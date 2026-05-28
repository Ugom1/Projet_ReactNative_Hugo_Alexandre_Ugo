import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Card, GradientButton, Screen, Title } from '@/components/ui';
import { PACKS } from '@/lib/game';
import { useAuth } from '@/providers/AuthProvider';
import { openPack } from '@/services/gameService';

export default function MarcheScreen() {
  const { user, profile } = useAuth();
  if (!user || !profile) return null;

  return (
    <Screen>
      <Title>Boutique</Title>
      {PACKS.map((pack) => (
        <Card key={pack.id}>
          <Text style={{ color: '#F5F5F5', fontWeight: '700' }}>{pack.nom}</Text>
          <Text style={{ color: '#A8A8A8' }}>{pack.prix} monnaie</Text>
          <GradientButton title="Acheter" onPress={async () => {
            try {
              const card = await openPack(user.uid, pack.id);
              router.push({ pathname: '/marche/ouverture', params: { nom: card.nom, note: String(card.note), rarete: card.rarete } });
            } catch (e) {
              Alert.alert('Erreur', String(e));
            }
          }} disabled={profile.monnaie < pack.prix} />
        </Card>
      ))}
    </Screen>
  );
}
