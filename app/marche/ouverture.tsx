import { useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton, AppHeader, RareteTag, Screen } from '@/components/ui';
import { theme } from '@/constants/theme';
import { PLAYER_IMAGE } from '@/data/players.seed';
import type { PlayerCard, Position, Rarete } from '@/lib/types';
import { useTabScreenGuard } from '@/hooks/useTabScreenGuard';

export default function OuvertureScreen() {
  const guard = useTabScreenGuard();
  const params = useLocalSearchParams<{
    nom: string;
    note: string;
    rarete: string;
    position: string;
    nationalite: string;
    image: string;
    cardId: string;
    source?: string;
  }>();

  const [revealed, setRevealed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;

  const card: PlayerCard = {
    id: 'preview',
    cardId: params.cardId ?? 'preview',
    nom: params.nom ?? 'Joueur mystère',
    note: Number(params.note ?? 0),
    rarete: (params.rarete as Rarete) ?? 'UNCOMMON',
    position: (params.position as Position) ?? 'ATT',
    ligue: 'Premier League',
    nationalite: params.nationalite ?? 'Inconnu',
    image: params.image ?? '',
  };

  const flip = () => {
    if (revealed) return;
    setRevealed(true);
    Animated.timing(spin, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  };

  const rotateFront = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotateBack = spin.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const cardUri = card.image && !imageError ? card.image : PLAYER_IMAGE;

  const fifaCard = (
    <Image
      source={{ uri: cardUri }}
      style={styles.fifaCard}
      resizeMode="contain"
      onError={() => setImageError(true)}
    />
  );

  return (
    <Screen scroll>
      {guard.ready ? <AppHeader gems={guard.profile.monnaie} showBack /> : null}

      <Text style={styles.title}>PRÊT POUR LA RÉVÉLATION ?</Text>
      <Text style={styles.sub}>Touchez la carte pour la retourner</Text>

      <Pressable onPress={flip} style={styles.stage}>
        {!revealed ? (
          <LinearGradient colors={[theme.gold, theme.orange]} style={styles.cardBack}>
            <RareteTag rarete="RARE" />
            <Text style={styles.cardBackLogo}>DTM</Text>
            <Text style={styles.cardBackSeason}>SAISON 2026-27</Text>
            <Text style={styles.cardBackHint}>🔍 Touchez pour révéler</Text>
          </LinearGradient>
        ) : (
          <View style={styles.flipContainer}>
            <Animated.View style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: rotateFront }] }]}>
              <LinearGradient colors={[theme.gold, theme.orange]} style={styles.cardBack}>
                <Text style={styles.cardBackLogo}>DTM</Text>
              </LinearGradient>
            </Animated.View>
            <Animated.View
              style={[
                styles.face,
                styles.faceBack,
                { transform: [{ perspective: 1000 }, { rotateY: rotateBack }] },
              ]}>
              {fifaCard}
            </Animated.View>
          </View>
        )}
      </Pressable>

      <GradientButton
        title={revealed ? 'Voir ma collection' : 'Révéler la carte'}
        onPress={() => (revealed ? router.replace('/(tabs)/galerie') : flip())}
      />
      {revealed ? (
        <GradientButton
          title={params.source === 'bonus' ? 'Retour au mode Jouer' : 'Retour à la boutique'}
          variant="dark"
          onPress={() =>
            router.replace(params.source === 'bonus' ? '/(tabs)/jouer' : '/(tabs)/marche')
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 24 },
  sub: { color: theme.muted, textAlign: 'center', marginBottom: 16 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 380 },
  flipContainer: { width: 220, height: 308, position: 'relative', alignSelf: 'center' },
  face: { backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  faceBack: { transform: [{ rotateY: '180deg' }] },
  fifaCard: { width: 220, height: 308 },
  cardBack: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 220,
    width: '100%',
  },
  cardBackLogo: { color: '#1A1A1A', fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  cardBackSeason: { color: '#1A1A1A', fontWeight: '700' },
  cardBackHint: { color: '#1A1A1A', marginTop: 8 },
});
