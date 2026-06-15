import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, GradientButton, Screen, Subtitle, Title } from '@/components/ui';
import type { AppTheme } from '@/constants/theme';
import { PALIERS, palierRewardLabel } from '@/lib/game';
import { useResetPaliersMutation } from '@/hooks/useGame';
import { useTabScreenGuard } from '@/hooks/useTabScreenGuard';
import { useTheme } from '@/providers/ThemeProvider';

export default function JouerScreen() {
  const guard = useTabScreenGuard();
  const resetPaliers = useResetPaliersMutation();
  const { theme } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  if (!guard.ready) return guard.content;
  const { profile } = guard;

  const handleReset = () => {
    setResetError(null);
    resetPaliers.mutate(undefined, {
      onSuccess: () => setShowResetConfirm(false),
      onError: (e) => setResetError(e.message || 'Impossible de réinitialiser.'),
    });
  };

  const styles = createStyles(theme);

  return (
    <Screen scroll>
      <AppHeader gems={profile.monnaie} />
      <Title>Progression de Saison</Title>
      <Subtitle>Débloquez des récompenses exclusives en améliorant votre équipe.</Subtitle>

      {profile.palierActuel > 0 ? (
        showResetConfirm ? (
          <Card style={styles.resetConfirmCard}>
            <Text style={styles.resetConfirmTitle}>Réinitialiser la progression ?</Text>
            <Text style={styles.resetConfirmText}>
              Vous recommencerez au palier 1. Vos gems et votre collection ne sont pas affectés.
            </Text>
            {resetError ? <Text style={styles.resetError}>{resetError}</Text> : null}
            <GradientButton
              title={resetPaliers.isPending ? 'Réinitialisation…' : 'Confirmer la réinitialisation'}
              onPress={handleReset}
              loading={resetPaliers.isPending}
              disabled={resetPaliers.isPending}
            />
            <GradientButton
              title="Annuler"
              variant="dark"
              onPress={() => {
                setShowResetConfirm(false);
                setResetError(null);
              }}
              disabled={resetPaliers.isPending}
            />
          </Card>
        ) : (
          <Pressable style={styles.resetBtn} onPress={() => setShowResetConfirm(true)}>
            <Ionicons name="refresh" size={16} color={theme.muted} />
            <Text style={styles.resetText}>Réinitialiser les paliers</Text>
          </Pressable>
        )
      ) : null}

      <View style={styles.timeline}>
        {PALIERS.map((score, index) => {
          const completed = index < profile.palierActuel;
          const current = index === profile.palierActuel;
          const locked = index > profile.palierActuel;

          return (
            <View key={score} style={styles.tierRow}>
              <View style={styles.lineCol}>
                <View
                  style={[
                    styles.dot,
                    completed && styles.dotDone,
                    current && styles.dotCurrent,
                    locked && styles.dotLocked,
                  ]}>
                  {completed ? (
                    <Ionicons name="checkmark" size={16} color="#1A1A1A" />
                  ) : locked ? (
                    <Ionicons name="lock-closed" size={14} color={theme.muted} />
                  ) : (
                    <Text style={styles.dotNum}>{index + 1}</Text>
                  )}
                </View>
                {index < PALIERS.length - 1 ? <View style={styles.line} /> : null}
              </View>

              <Card style={[styles.tierCard, locked && styles.tierLocked]}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierTitle}>Palier {index + 1}</Text>
                  {completed ? (
                    <View style={styles.badgeDone}>
                      <Text style={styles.badgeDoneText}>COMPLÉTÉ</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.tierScore}>Score moyen requis : {score}</Text>
                {completed ? (
                  <Text style={styles.tierMeta}>Moyenne atteinte ✓</Text>
                ) : current ? (
                  <>
                    <Text style={styles.tierMeta}>Palier actuel — composez votre équipe</Text>
                    <Link href={{ pathname: '/jouer/composition', params: { palier: String(index) } }} style={styles.playLink}>
                      Lancer la composition →
                    </Link>
                  </>
                ) : (
                  <Text style={styles.tierMeta}>Encore verrouillé</Text>
                )}
                <View style={styles.rewardRow}>
                  <Ionicons name="gift-outline" size={16} color={theme.gold} />
                  <Text style={styles.rewardText}>Récompense : {palierRewardLabel(index)}</Text>
                </View>
              </Card>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    timeline: { gap: 0, marginTop: 8 },
    tierRow: { flexDirection: 'row', gap: 12 },
    lineCol: { alignItems: 'center', width: 32 },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.cardSoft,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotDone: { backgroundColor: theme.orange, borderColor: theme.orange },
    dotCurrent: { backgroundColor: theme.gold, borderColor: theme.gold },
    dotLocked: { backgroundColor: theme.inputBg },
    dotNum: { color: theme.text, fontWeight: '800', fontSize: 12 },
    line: { width: 2, flex: 1, backgroundColor: theme.border, minHeight: 24 },
    tierCard: { flex: 1, marginBottom: 12 },
    tierLocked: { opacity: 0.5 },
    tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tierTitle: { color: theme.text, fontWeight: '800', fontSize: 16 },
    badgeDone: { backgroundColor: theme.orange, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
    badgeDoneText: { color: '#1A1A1A', fontWeight: '900', fontSize: 10 },
    tierScore: { color: theme.gold, fontWeight: '700', marginTop: 4 },
    tierMeta: { color: theme.muted, fontSize: 13, marginTop: 4 },
    playLink: { color: theme.gold, fontWeight: '800', marginTop: 8 },
    rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    rewardText: { color: theme.muted, fontSize: 12 },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginTop: 4,
      marginBottom: 4,
    },
    resetText: { color: theme.muted, fontSize: 13, textDecorationLine: 'underline' },
    resetConfirmCard: { gap: 10, marginTop: 4, marginBottom: 4 },
    resetConfirmTitle: { color: theme.text, fontWeight: '800', fontSize: 16 },
    resetConfirmText: { color: theme.muted, fontSize: 13, lineHeight: 18 },
    resetError: { color: theme.danger, fontSize: 13 },
  });
}
