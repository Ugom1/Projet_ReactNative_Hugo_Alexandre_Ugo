import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AppHeader,
  GradientButton,
  Input,
  LoadingState,
  PlayerCardView,
  Subtitle,
  Title,
} from '@/components/ui';
import { formatGems, RARETE_LABELS, recycleGemsForCard } from '@/lib/game';
import { useCollectionQuery, useRecycleCardsMutation } from '@/hooks/useGame';
import { useTabScreenGuard } from '@/hooks/useTabScreenGuard';
import { useTheme } from '@/providers/ThemeProvider';
import type { PlayerCard, Rarete } from '@/lib/types';

const SORT_OPTIONS = [
  { id: 'recent', label: 'Récent' },
  { id: 'note', label: 'Note' },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]['id'];

const RARETE_FILTERS: { id: 'all' | Rarete; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'UNCOMMON', label: RARETE_LABELS.UNCOMMON },
  { id: 'RARE', label: RARETE_LABELS.RARE },
  { id: 'SUPER_RARE', label: RARETE_LABELS.SUPER_RARE },
  { id: 'UNIQUE', label: RARETE_LABELS.UNIQUE },
];

const RARETE_ORDER: Record<Rarete, number> = {
  UNIQUE: 4,
  SUPER_RARE: 3,
  RARE: 2,
  UNCOMMON: 1,
};

export default function GalerieScreen() {
  const guard = useTabScreenGuard();
  const { data: cards = [], isLoading, isError } = useCollectionQuery();
  const recycleCards = useRecycleCardsMutation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortId>('recent');
  const [rareteFilter, setRareteFilter] = useState<'all' | Rarete>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...cards];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.nom.toLowerCase().includes(q));
    }

    if (rareteFilter !== 'all') {
      list = list.filter((c) => c.rarete === rareteFilter);
    }

    if (sort === 'note') {
      list.sort((a, b) => b.note - a.note || RARETE_ORDER[b.rarete] - RARETE_ORDER[a.rarete]);
    } else {
      list.sort(
        (a, b) =>
          (b.obtainedAt ?? 0) - (a.obtainedAt ?? 0) ||
          b.note - a.note ||
          RARETE_ORDER[b.rarete] - RARETE_ORDER[a.rarete]
      );
    }

    return list;
  }, [cards, search, sort, rareteFilter]);

  const selectedCards = useMemo(
    () => cards.filter((c) => selectedIds.has(c.id)),
    [cards, selectedIds]
  );

  const totalGems = useMemo(
    () => selectedCards.reduce((sum, c) => sum + recycleGemsForCard(c), 0),
    [selectedCards]
  );

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setFeedback(null);
  };

  const toggleSelectMode = () => {
    if (selectMode) exitSelectMode();
    else {
      setFeedback(null);
      setSelectMode(true);
    }
  };

  const toggleCard = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRecycle = () => {
    if (!selectedIds.size || recycleCards.isPending) return;
    setFeedback(null);
    recycleCards.mutate(
      selectedCards.map((c) => ({ cardId: c.cardId, ownershipId: c.id })),
      {
        onSuccess: ({ gems, count }) => {
          exitSelectMode();
          setFeedback(`${count} carte(s) recyclée(s) · +${formatGems(gems)} 💎`);
        },
        onError: (e) => setFeedback(e.message || 'Erreur lors du recyclage'),
      }
    );
  };

  if (!guard.ready) return guard.content;
  const { profile } = guard;
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
        trashBtn: {
          width: 44,
          height: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
        },
        trashBtnActive: { backgroundColor: theme.gold, borderColor: theme.gold },
        selectHint: { color: theme.gold, fontSize: 12, fontWeight: '600' },
        filterLabel: {
          color: theme.muted,
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        chip: {
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.border,
          paddingHorizontal: 14,
          paddingVertical: 6,
        },
        chipActive: { backgroundColor: theme.gold, borderColor: theme.gold },
        chipText: { color: theme.muted, fontWeight: '600', fontSize: 12 },
        chipTextActive: { color: '#1A1A1A' },
        gridRow: { gap: 10 },
        gridItem: { flex: 1 },
        empty: { color: theme.muted, textAlign: 'center', marginTop: 40 },
        error: { color: theme.danger, textAlign: 'center' },
        recycleBar: {
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          padding: 16,
          gap: 10,
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          zIndex: 10,
          elevation: 10,
        },
        feedback: { color: theme.gold, textAlign: 'center', fontWeight: '700', fontSize: 13 },
        recycleSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        recycleCount: { color: theme.muted, fontWeight: '600' },
        recycleGems: { color: theme.gold, fontWeight: '800', fontSize: 18 },
      }),
    [theme]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'left', 'right']}>
      <View style={{ padding: 16, gap: 10 }}>
        <AppHeader gems={profile.monnaie} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Title>Ma Collection</Title>
            <Subtitle>
              {selectMode
                ? `${selectedIds.size} sélectionnée(s) · +${formatGems(totalGems)} 💎`
                : `${cards.length} joueurs au total`}
            </Subtitle>
          </View>
          <Pressable
            onPress={toggleSelectMode}
            style={[styles.trashBtn, selectMode && styles.trashBtnActive]}
            accessibilityLabel={selectMode ? 'Annuler la sélection' : 'Recycler des cartes'}>
            <Ionicons name={selectMode ? 'close' : 'trash-outline'} size={22} color={selectMode ? '#1A1A1A' : theme.gold} />
          </Pressable>
        </View>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        {selectMode ? (
          <Text style={styles.selectHint}>Touchez les cartes à recycler, puis confirmez en bas.</Text>
        ) : null}
        <Input icon="search-outline" placeholder="Rechercher un joueur..." value={search} onChangeText={setSearch} />

        <Text style={styles.filterLabel}>Tri</Text>
        <View style={styles.chips}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={[styles.chip, sort === opt.id && styles.chipActive]}
              onPress={() => setSort(opt.id)}>
              <Text style={[styles.chipText, sort === opt.id && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.filterLabel}>Rareté</Text>
        <View style={styles.chips}>
          {RARETE_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={[styles.chip, rareteFilter === f.id && styles.chipActive]}
              onPress={() => setRareteFilter(f.id)}>
              <Text style={[styles.chipText, rareteFilter === f.id && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <Text style={[styles.error, { padding: 16 }]}>Impossible de charger la collection.</Text>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: selectMode ? 240 : 100, gap: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>Aucune carte. Ouvrez un pack !</Text>}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <PlayerCardView
                card={item}
                compact
                selected={selectMode && selectedIds.has(item.id)}
                onPress={selectMode ? () => toggleCard(item.id) : undefined}
              />
            </View>
          )}
        />
      )}

      {selectMode ? (
        <View style={styles.recycleBar}>
          <View style={styles.recycleSummary}>
            <Text style={styles.recycleCount}>{selectedIds.size} carte(s)</Text>
            <Text style={styles.recycleGems}>+{formatGems(totalGems)} 💎</Text>
          </View>
          <GradientButton
            title={
              recycleCards.isPending
                ? 'Recyclage…'
                : selectedIds.size
                  ? `Recycler (+${formatGems(totalGems)} 💎)`
                  : 'Sélectionnez des cartes'
            }
            variant="gold"
            disabled={!selectedIds.size || recycleCards.isPending}
            onPress={handleRecycle}
          />
          <GradientButton title="Annuler" variant="dark" onPress={exitSelectMode} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
