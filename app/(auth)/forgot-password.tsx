import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Card, GradientButton, Input, Label, Screen, Title } from '@/components/ui';
import { forgotPassword } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  return (
    <Screen>
      <Title>Mot de passe oublie ?</Title>
      <Card>
        <Label>Adresse e-mail</Label>
        <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <GradientButton title="Envoyer le lien" onPress={async () => { try { await forgotPassword(email); Alert.alert('OK', 'Email envoye'); } catch (e) { Alert.alert('Erreur', String(e)); } }} />
      </Card>
      <Link href="/(auth)/login" style={{ color: '#FFD700' }}>Retour a la connexion</Link>
    </Screen>
  );
}
