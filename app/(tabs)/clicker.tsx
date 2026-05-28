import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Card, GradientButton, Label, Screen, Title } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { click, upgradeClick } from '@/services/gameService';

export default function ClickerScreen() {
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!profile || !user) return null;
  const upgradePrice = profile.gainParClic * 50;

  return (
    <Screen>
      <Title>DTM</Title>
      <Card>
        <Label>Score total</Label>
        <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 42 }}>{profile.monnaie}</Text>
        <Text style={{ color: '#A8A8A8' }}>Niveau {profile.niveau} - Gain {profile.gainParClic} / clic</Text>
        <GradientButton title="Cliquer +" onPress={() => click(user.uid, profile.gainParClic)} />
        <GradientButton
          title={`Ameliorer (${upgradePrice})`}
          disabled={busy || profile.monnaie < upgradePrice}
          onPress={async () => {
            setBusy(true);
            try { await upgradeClick(user.uid, profile); } catch (e) { Alert.alert('Erreur', String(e)); }
            setBusy(false);
          }}
        />
      </Card>
      <View style={{ padding: 12, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12 }}>
        <Text style={{ color: '#F5F5F5', fontWeight: '700' }}>Progression de saison</Text>
        <Text style={{ color: '#A8A8A8' }}>Debloquez des recompenses exclusives.</Text>
      </View>
    </Screen>
  );
}
