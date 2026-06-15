import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppHeader, Card, GradientButton, Screen } from '@/components/ui';
import { formatGems } from '@/lib/game';
import { useClickMutation, useUpgradeMutation } from '@/hooks/useGame';
import { useTabScreenGuard } from '@/hooks/useTabScreenGuard';
import { useTheme } from '@/providers/ThemeProvider';

export default function AccueilScreen() {
  const guard = useTabScreenGuard();
  const clickMutation = useClickMutation();
  const upgradeMutation = useUpgradeMutation();
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: { alignItems: 'center', gap: 8, paddingVertical: 12 },
        scoreLabel: { color: theme.muted, fontWeight: '700', letterSpacing: 1, fontSize: 12 },
        scoreValue: { color: theme.gold, fontSize: 40, fontWeight: '900' },
        ballWrap: { marginVertical: 12 },
        ball: {
          width: 140,
          height: 140,
          borderRadius: 70,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: '#FF6B0044',
        },
        tapHint: { color: theme.muted, fontSize: 13 },
        levelRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
        levelLabel: { color: theme.muted, fontSize: 11, fontWeight: '700' },
        levelValue: { color: theme.text, fontWeight: '800', fontSize: 18, marginVertical: 4 },
        progressTrack: { height: 6, backgroundColor: theme.border, borderRadius: 3, overflow: 'hidden' },
        progressFill: { height: '100%', backgroundColor: theme.gold },
        statCard: { alignItems: 'center', gap: 4 },
        statLabel: { color: theme.muted, fontSize: 11 },
        statValue: { color: theme.text, fontWeight: '800', fontSize: 18 },
      }),
    [theme]
  );

  if (!guard.ready) return guard.content;

  const { profile } = guard;
  const upgradeCost = profile.upgradeCost ?? profile.gainParClic * 100;
  const progress = Math.min((profile.totalClics % 100) / 100, 1);

  return (
    <Screen>
      <AppHeader gems={profile.monnaie} />

      <View style={styles.hero}>
        <Text style={styles.scoreLabel}>SCORE TOTAL</Text>
        <Text style={styles.scoreValue}>{formatGems(profile.totalClics)}</Text>

        <Pressable
          onPress={() => clickMutation.mutate(undefined, { onError: (e) => Alert.alert('Erreur', e.message) })}
          style={styles.ballWrap}>
          <LinearGradient colors={['#FFD700', '#FF6B00']} style={styles.ball}>
            <Ionicons name="football" size={64} color="#1A1A1A" />
          </LinearGradient>
        </Pressable>
        <Text style={styles.tapHint}>Tapez pour gagner des 💎</Text>
      </View>

      <Card>
        <View style={styles.levelRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.levelLabel}>PROCHAIN NIVEAU</Text>
            <Text style={styles.levelValue}>Niveau {profile.niveau + 1}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
          <GradientButton
            title={`AMÉLIORER\n${formatGems(upgradeCost)} 💎`}
            onPress={() =>
              upgradeMutation.mutate(undefined, {
                onError: (e) => Alert.alert('Erreur', e.message),
              })
            }
            disabled={profile.monnaie < upgradeCost || upgradeMutation.isPending}
          />
        </View>
      </Card>

      <Card style={styles.statCard}>
        <Ionicons name="flash" size={20} color={theme.gold} />
        <Text style={styles.statLabel}>Points / Clic</Text>
        <Text style={styles.statValue}>+{profile.gainParClic}</Text>
      </Card>
    </Screen>
  );
}
