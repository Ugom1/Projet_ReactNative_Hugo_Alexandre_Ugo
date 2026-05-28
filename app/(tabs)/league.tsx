import { Link } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Card, GradientButton, Screen, Title } from '@/components/ui';
import { PALIERS } from '@/lib/game';
import { useAuth } from '@/providers/AuthProvider';
import { unlockPalier } from '@/services/gameService';

export default function LeagueScreen() {
  const { user, profile } = useAuth();
  if (!user || !profile) return null;

  return (
    <Screen>
      <Title>Jouer</Title>
      {PALIERS.map((score, i) => {
        const unlocked = i <= profile.palierActuel;
        const next = i === profile.palierActuel + 1;
        return (
          <Card key={score}>
            <Text style={{ color: '#F5F5F5', fontWeight: '700' }}>Palier {i + 1} - Score {score}</Text>
            <Text style={{ color: '#A8A8A8' }}>{unlocked ? 'Debloque' : next ? 'Debloquable' : 'Verrouille'}</Text>
            {unlocked ? <Link href={{ pathname: '/jouer/composition', params: { palier: String(i) } }} style={{ color: '#FFD700' }}>Lancer la composition</Link> : null}
            {next ? <GradientButton title="Debloquer" onPress={async () => { try { await unlockPalier(user.uid, i); } catch (e) { Alert.alert('Erreur', String(e)); } }} /> : null}
          </Card>
        );
      })}
    </Screen>
  );
}
