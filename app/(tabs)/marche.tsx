import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppHeader, Card, GradientButton, Screen, Subtitle, Title } from '@/components/ui';
import { theme } from '@/constants/theme';
import { PACKS } from '@/lib/game';
import { useOpenPackMutation } from '@/hooks/useGame';
import { useTabScreenGuard } from '@/hooks/useTabScreenGuard';

export default function MarcheScreen() {
  const guard = useTabScreenGuard();
  const openPack = useOpenPackMutation();

  if (!guard.ready) return guard.content;
  const { profile, user } = guard;

  return (
    <Screen scroll>
      <AppHeader gems={profile.monnaie} />
      <Title>Boutique</Title>
      <Subtitle>Obtenez les meilleures cartes pour dominer la ligue.</Subtitle>

      {PACKS.map((pack) => {
        const canBuy = profile.monnaie >= pack.prix;

        return (
          <Card key={pack.id} style={styles.packCard}>
            <LinearGradient colors={pack.gradient as [string, string]} style={styles.packVisual} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.packEmoji}>📦</Text>
            </LinearGradient>
            <View style={styles.packInfo}>
              <Text style={styles.packName}>{pack.nom}</Text>
              <GradientButton
                title={openPack.isPending ? 'Ouverture…' : `${pack.prix} 💎 OUVRIR`}
                variant={pack.id === 'elite' ? 'blue' : 'gold'}
                disabled={!canBuy}
                loading={openPack.isPending}
                onPress={() =>
                  openPack.mutate(pack.id, {
                    onSuccess: (card) =>
                      router.push({
                        pathname: '/marche/ouverture',
                        params: {
                          nom: card.nom,
                          note: String(card.note),
                          rarete: card.rarete,
                          position: card.position,
                          nationalite: card.nationalite,
                          image: card.image,
                          cardId: card.cardId,
                        },
                      }),
                    onError: (e) => Alert.alert('Erreur pack', e.message || 'Impossible d\'ouvrir le pack'),
                  })
                }
              />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  packCard: { flexDirection: 'row', gap: 14, padding: 12 },
  packVisual: {
    width: 80,
    height: 100,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packEmoji: { fontSize: 36 },
  packInfo: { flex: 1, gap: 6 },
  packName: { color: theme.text, fontWeight: '800', fontSize: 17 },
});
