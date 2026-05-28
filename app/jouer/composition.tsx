import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Card, GradientButton, Screen, Title } from '@/components/ui';
import { randomCondition } from '@/lib/game';
import type { PlayerCard } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { loadComposition, saveComposition, subscribeCollection } from '@/services/gameService';

export default function CompositionScreen() {
  const { palier = '0' } = useLocalSearchParams<{ palier: string }>();
  const { user } = useAuth();
  const [collection, setCollection] = useState<PlayerCard[]>([]);
  const [selected, setSelected] = useState<PlayerCard[]>([]);
  const condition = useMemo(() => randomCondition(), []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeCollection(user.uid, setCollection);
    loadComposition(user.uid).then((cards) => setSelected(cards.slice(0, 5)));
    return unsub;
  }, [user]);

  if (!user) return null;
  const moyenne = selected.length ? selected.reduce((a, c) => a + c.note, 0) / selected.length : 0;

  return (
    <Screen>
      <Title>Composition</Title>
      <Card>
        <Text style={{ color: '#FFD700', fontWeight: '800' }}>{condition.label}</Text>
        <Text style={{ color: '#A8A8A8' }}>Moyenne actuelle: {moyenne.toFixed(1)}</Text>
      </Card>
      <Card>
        <Text style={{ color: '#F5F5F5', fontWeight: '700' }}>Selection ({selected.length}/5)</Text>
        {selected.map((p) => <Text key={p.id} style={{ color: '#A8A8A8' }}>{p.nom} - {p.note}</Text>)}
      </Card>
      <Card>
        <Text style={{ color: '#F5F5F5', fontWeight: '700' }}>Collection</Text>
        {collection.slice(0, 12).map((p) => (
          <Text key={p.id} style={{ color: '#A8A8A8' }} onPress={() => setSelected((prev) => prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : prev.length < 5 ? [...prev, p] : prev)}>
            {selected.some((x) => x.id === p.id) ? '✓ ' : ''}{p.nom} ({p.position}) - {p.note}
          </Text>
        ))}
      </Card>
      <GradientButton
        title="Enregistrer la composition"
        onPress={async () => {
          try {
            await saveComposition(user.uid, selected);
            Alert.alert('OK', 'Composition sauvegardee');
          } catch (e) {
            Alert.alert('Erreur', "Impossible d'enregistrer la composition pour le moment.");
          }
        }}
      />
      <GradientButton title="Jouer le match" onPress={() => {
        const required = 75 + Number(palier) * 5;
        const success = selected.length === 5 && moyenne >= required && condition.check(selected);
        router.push({ pathname: '/jouer/resultat', params: { win: success ? '1' : '0', palier } });
      }} />
      <View style={{ height: 8 }} />
    </Screen>
  );
}
