import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Card, GradientButton, Input, Screen, Title } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { subscribeCollection } from '@/services/gameService';
import { logout } from '@/services/authService';
import type { PlayerCard } from '@/lib/types';

export default function GalerieScreen() {
  const { user } = useAuth();
  const [cards, setCards] = useState<PlayerCard[]>([]);
  const [ligue, setLigue] = useState('');
  const [position, setPosition] = useState('');
  const [noteMin, setNoteMin] = useState('');

  useEffect(() => {
    if (!user) return;
    return subscribeCollection(user.uid, setCards);
  }, [user]);

  const filtered = useMemo(() => cards.filter((c) =>
    (!ligue || c.ligue.toLowerCase().includes(ligue.toLowerCase())) &&
    (!position || c.position.toLowerCase().includes(position.toLowerCase())) &&
    (!noteMin || c.note >= Number(noteMin))
  ), [cards, ligue, position, noteMin]);

  return (
    <Screen>
      <Title>Ma Collection</Title>
      <Card>
        <Input placeholder="Filtre ligue" value={ligue} onChangeText={setLigue} />
        <Input placeholder="Filtre position" value={position} onChangeText={setPosition} />
        <Input placeholder="Note minimale" value={noteMin} onChangeText={setNoteMin} keyboardType="numeric" />
      </Card>
      <ScrollView>
        {filtered.map((c) => (
          <Card key={c.id}>
            <Text style={{ color: '#F5F5F5', fontWeight: '700' }}>{c.nom}</Text>
            <Text style={{ color: '#A8A8A8' }}>{c.ligue} - {c.position} - {c.note}</Text>
          </Card>
        ))}
      </ScrollView>
      <GradientButton title="Se deconnecter" onPress={() => logout()} />
    </Screen>
  );
}
