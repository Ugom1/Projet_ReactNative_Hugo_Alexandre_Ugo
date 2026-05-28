import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Card, GradientButton, Screen, Title } from '@/components/ui';
import { rewardForPalier } from '@/lib/game';
import { useAuth } from '@/providers/AuthProvider';
import { click } from '@/services/gameService';

export default function ResultatScreen() {
  const { win = '0', palier = '0' } = useLocalSearchParams<{ win: string; palier: string }>();
  const { user } = useAuth();
  const victoire = win === '1';
  const reward = rewardForPalier(Number(palier));

  return (
    <Screen>
      <Title>{victoire ? 'Excellent travail !' : 'Match perdu'}</Title>
      <Card>
        <Text style={{ color: '#F5F5F5' }}>{victoire ? 'Match de championnat termine.' : "La condition n'a pas ete remplie."}</Text>
        <Text style={{ color: '#FFD700', fontSize: 32, fontWeight: '900' }}>{victoire ? `+${reward}` : '+0'}</Text>
      </Card>
      {victoire ? <GradientButton title="Recuperer la recompense" onPress={async () => {
        if (!user) return;
        try { await click(user.uid, reward); router.replace('/(tabs)/league'); } catch (e) { Alert.alert('Erreur', String(e)); }
      }} /> : null}
      <GradientButton title="Continuer" onPress={() => router.replace('/(tabs)/league')} />
    </Screen>
  );
}
