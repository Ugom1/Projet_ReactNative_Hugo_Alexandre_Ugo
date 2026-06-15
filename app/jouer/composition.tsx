import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  AppHeader,
  GradientButton,
  LoadingState,
  PlayerCardView,
  Screen,
  Subtitle,
} from '@/components/ui';
import { theme } from '@/constants/theme';
import { PALIERS, SLOTS, SLOT_LABELS, canFillSlot, computeMoyenne, randomCondition } from '@/lib/game';
import type { PlayerCard, SlotId } from '@/lib/types';
import { useCollectionQuery, usePlayMatchMutation, useSaveCompositionMutation } from '@/hooks/useGame';
import { useAuth } from '@/providers/AuthProvider';
import { useTabScreenGuard } from '@/hooks/useTabScreenGuard';
import { loadComposition, resolveSlots } from '@/services/gameService';

export default function CompositionScreen() {
  const { palier = '0' } = useLocalSearchParams<{ palier: string }>();
  const palierIndex = Number(palier);
  const scoreRequis = PALIERS[palierIndex] ?? 75;
  const { user } = useAuth();
  const guard = useTabScreenGuard();

  const { data: collection = [], isLoading } = useCollectionQuery();
  const saveComposition = useSaveCompositionMutation();
  const playMatch = usePlayMatchMutation();

  const [slots, setSlots] = useState<Partial<Record<SlotId, string>>>({});
  const [pickerSlot, setPickerSlot] = useState<SlotId | null>(null);
  const condition = useMemo(() => randomCondition(), []);

  useEffect(() => {
    if (!user) return;
    loadComposition(user.uid).then((doc) => {
      if (doc?.slots) setSlots(doc.slots);
    });
  }, [user]);

  const resolved = useMemo(() => resolveSlots(slots, collection), [slots, collection]);
  const selectedCards = SLOTS.map((s) => resolved[s]).filter(Boolean) as PlayerCard[];
  const moyenne = computeMoyenne(selectedCards);
  const conditionOk = condition.check(selectedCards, resolved);
  const canPlay = selectedCards.length === 5 && moyenne >= scoreRequis && conditionOk;

  if (isLoading) return <LoadingState />;

  const pickCard = (card: PlayerCard) => {
    if (!pickerSlot || !canFillSlot(card, pickerSlot)) return;
    setSlots((prev) => ({ ...prev, [pickerSlot]: card.id }));
    setPickerSlot(null);
  };

  const slotLabel = SLOT_LABELS;

  return (
    <Screen scroll>
      {guard.ready ? <AppHeader gems={guard.profile.monnaie} showBack /> : null}

      <View style={styles.topMeta}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Score Moyen</Text>
          <Text style={styles.scoreValue}>{moyenne.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.title}>Composition</Text>

      <View style={styles.conditionBox}>
        <Ionicons name="flag" size={16} color={theme.gold} />
        <Text style={styles.conditionText}>CONDITION REQUISE : {condition.label}</Text>
      </View>

      <View style={styles.pitch}>
        {SLOTS.map((slot) => {
          const card = resolved[slot];
          return (
            <Pressable key={slot} style={styles.slot} onPress={() => setPickerSlot(slot)}>
              {card ? (
                <PlayerCardView card={card} compact />
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.slotPos}>{slotLabel[slot]}</Text>
                  <Ionicons name="add-circle-outline" size={28} color={theme.gold} />
                  <Text style={styles.slotHint}>{slotLabel[slot]}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <GradientButton
        title="🚀 Lancer le match"
        disabled={!canPlay || playMatch.isPending}
        onPress={() => {
          playMatch.mutate(
            { palierIndex, moyenne, scoreRequis },
            {
              onSuccess: (result) =>
                router.push({
                  pathname: '/jouer/resultat',
                  params: {
                    victoire: result.victoire ? '1' : '0',
                    score: String(result.score),
                    requis: String(result.scoreRequis),
                    recompense: String(result.recompense),
                    palier: String(palierIndex),
                    ...(result.bonusPack && result.bonusCard
                      ? {
                          bonusPack: result.bonusPack,
                          nom: result.bonusCard.nom,
                          note: String(result.bonusCard.note),
                          rarete: result.bonusCard.rarete,
                          position: result.bonusCard.position,
                          nationalite: result.bonusCard.nationalite,
                          image: result.bonusCard.image,
                          cardId: result.bonusCard.cardId,
                        }
                      : {}),
                  },
                }),
              onError: (e) => Alert.alert('Erreur', e.message),
            }
          );
        }}
      />

      <Pressable
        onPress={() => {
          saveComposition.mutate(
            {
              palierCible: palierIndex,
              condition: { id: condition.id, label: condition.label },
              slots,
              scoreMoyen: moyenne,
            },
            {
              onSuccess: () => Alert.alert('Brouillon', 'Composition enregistrée.'),
              onError: () => Alert.alert('Erreur', 'Impossible de sauvegarder.'),
            }
          );
        }}>
        <Text style={styles.draftLink}>Enregistrer le brouillon</Text>
      </Pressable>

      {!conditionOk && selectedCards.length === 5 ? (
        <Subtitle>La condition n'est pas remplie.</Subtitle>
      ) : null}
      {moyenne < scoreRequis && selectedCards.length === 5 ? (
        <Subtitle>
          Moyenne insuffisante ({moyenne.toFixed(1)} / {scoreRequis} requis).
        </Subtitle>
      ) : null}

      <Modal visible={!!pickerSlot} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choisir — {pickerSlot}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {collection
                .filter((c) => pickerSlot && canFillSlot(c, pickerSlot))
                .map((c) => (
                  <Pressable key={c.id} onPress={() => pickCard(c)} style={styles.modalItem}>
                    <Text style={styles.modalItemText}>
                      {c.nom} · {c.position} · {c.note}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
            <GradientButton title="Fermer" variant="dark" onPress={() => setPickerSlot(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start' },
  scoreBox: { alignItems: 'flex-end' },
  scoreLabel: { color: theme.muted, fontSize: 11 },
  scoreValue: { color: theme.gold, fontSize: 32, fontWeight: '900' },
  title: { color: theme.text, fontSize: 28, fontWeight: '800' },
  conditionBox: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.gold,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#1A1500',
  },
  conditionText: { color: theme.gold, fontWeight: '700', flex: 1, fontSize: 13 },
  pitch: { gap: 10, marginVertical: 8 },
  slot: { borderRadius: 12, overflow: 'hidden' },
  emptySlot: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  slotPos: { color: theme.gold, fontWeight: '900', fontSize: 14 },
  slotHint: { color: theme.muted, fontSize: 12 },
  draftLink: { color: theme.muted, textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
  modalBackdrop: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: { color: theme.text, fontWeight: '800', fontSize: 18 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  modalItemText: { color: theme.text },
});
