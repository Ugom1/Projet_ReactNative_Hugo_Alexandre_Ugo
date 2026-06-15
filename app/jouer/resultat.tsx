import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, AppHeader, GradientButton, Screen } from '@/components/ui';
import { theme } from '@/constants/theme';
import { PACKS, formatGems } from '@/lib/game';
import type { PackId } from '@/lib/types';
import { useTabScreenGuard } from '@/hooks/useTabScreenGuard';

function cardParamsFromSearchParams(params: Record<string, string | string[] | undefined>) {
  return {
    nom: String(params.nom ?? ''),
    note: String(params.note ?? '0'),
    rarete: String(params.rarete ?? 'UNCOMMON'),
    position: String(params.position ?? 'ATT'),
    nationalite: String(params.nationalite ?? ''),
    image: String(params.image ?? ''),
    cardId: String(params.cardId ?? ''),
    source: 'bonus',
  };
}

export default function ResultatScreen() {
  const guard = useTabScreenGuard();
  const params = useLocalSearchParams<{
    victoire: string;
    score: string;
    requis: string;
    recompense: string;
    palier: string;
    bonusPack?: string;
    nom?: string;
    note?: string;
    rarete?: string;
    position?: string;
    nationalite?: string;
    image?: string;
    cardId?: string;
  }>();

  const {
    victoire = '0',
    score = '0',
    requis = '75',
    recompense = '0',
    bonusPack,
  } = params;

  const win = victoire === '1';
  const scoreNum = Number(score);
  const requisNum = Number(requis);
  const progress = Math.min(scoreNum / requisNum, 1);
  const hasBonusPack = win && !!bonusPack;
  const packInfo = hasBonusPack ? PACKS.find((p) => p.id === (bonusPack as PackId)) : null;

  const openBonusPack = () => {
    router.push({
      pathname: '/marche/ouverture',
      params: cardParamsFromSearchParams(params),
    });
  };

  return (
    <Screen scroll>
      {guard.ready ? <AppHeader gems={guard.profile.monnaie} showBack /> : null}

      {win ? (
        <View style={styles.badge}>
          <Ionicons name="trophy" size={14} color="#1A1A1A" />
          <Text style={styles.badgeText}>VICTOIRE</Text>
        </View>
      ) : (
        <View style={[styles.badge, styles.badgeLoss]}>
          <Text style={styles.badgeText}>DÉFAITE</Text>
        </View>
      )}

      <Text style={styles.heroTitle}>
        {win ? 'EXCELLENT TRAVAIL !' : 'MATCH PERDU'}
      </Text>
      <Text style={styles.heroSub}>
        {win ? 'Match de Championnat terminé' : 'Votre équipe n\'a pas atteint le score requis.'}
      </Text>

      <Card>
        <Text style={styles.cardLabel}>PERFORMANCE MOYENNE</Text>
        <Text style={styles.scoreLine}>
          {scoreNum.toFixed(1)} <Text style={styles.scoreMuted}>/ {requisNum} requis</Text>
        </Text>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[theme.gold, theme.orange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        {win ? (
          <View style={styles.gemsRow}>
            <Text style={styles.statLabel}>Gains</Text>
            <Text style={styles.statValue}>+{formatGems(Number(recompense))} 💎</Text>
          </View>
        ) : null}
      </Card>

      {hasBonusPack && packInfo ? (
        <View style={styles.bonusSection}>
          <Text style={styles.cardLabel}>RÉCOMPENSE BONUS</Text>
          <LinearGradient
            colors={packInfo.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.packHero}>
            <Text style={styles.packEmoji}>📦</Text>
            <Text style={styles.packName}>{packInfo.nom}</Text>
            <Text style={styles.packHint}>Pack bonus débloqué — ouvrez-le maintenant !</Text>
          </LinearGradient>
          <GradientButton title="OUVRIR LE PACK" onPress={openBonusPack} />
        </View>
      ) : null}

      <GradientButton
        title={hasBonusPack ? 'Plus tard' : 'CONTINUER'}
        variant={hasBonusPack ? 'dark' : 'gold'}
        onPress={() => router.replace('/(tabs)/jouer')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: theme.orange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  badgeLoss: { backgroundColor: theme.danger },
  badgeText: { color: '#1A1A1A', fontWeight: '900', fontSize: 12 },
  heroTitle: {
    color: theme.gold,
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    marginTop: 12,
  },
  heroSub: { color: theme.muted, marginBottom: 8 },
  cardLabel: { color: theme.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  scoreLine: { color: theme.text, fontSize: 28, fontWeight: '900', marginVertical: 8 },
  scoreMuted: { color: theme.muted, fontSize: 16, fontWeight: '600' },
  progressTrack: { height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%' },
  gemsRow: { marginTop: 16, gap: 4 },
  statLabel: { color: theme.muted, fontSize: 12 },
  statValue: { color: theme.gold, fontWeight: '800', fontSize: 22 },
  bonusSection: { gap: 12, marginTop: 4 },
  packHero: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: theme.gold,
  },
  packEmoji: { fontSize: 64 },
  packName: { color: '#1A1A1A', fontWeight: '900', fontSize: 22 },
  packHint: { color: '#1A1A1A', fontWeight: '600', textAlign: 'center' },
});
