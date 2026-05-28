import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Card, GradientButton, Input, Label, Screen, Title } from '@/components/ui';
import { login, useGoogleLogin } from '@/services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithGoogle } = useGoogleLogin();

  return (
    <Screen>
      <Text style={{ color: '#FFD700', fontWeight: '900' }}>DTM</Text>
      <Title>Entrez dans l'elite du jeu</Title>
      <Card>
        <Label>Email</Label><Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Label>Mot de passe</Label><Input value={password} onChangeText={setPassword} secureTextEntry />
        <GradientButton title="Se connecter" onPress={async () => { try { await login(email, password); } catch (e) { Alert.alert('Erreur', String(e)); } }} />
        <GradientButton title="Continuer avec Google" onPress={async () => { try { await loginWithGoogle(); } catch (e) { Alert.alert('Erreur', String(e)); } }} />
      </Card>
      <Link href="/(auth)/forgot-password" style={{ color: '#FFD700' }}>Mot de passe oublie ?</Link>
      <Link href="/(auth)/signup" style={{ color: '#FF6B00' }}>Creer mon compte</Link>
    </Screen>
  );
}
