import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Card, GradientButton, Input, Label, Screen, Title } from '@/components/ui';
import { theme } from '@/constants/theme';
import { register } from '@/services/authService';

function getSignupErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  if (code.includes('email-already-in-use')) return 'Cet email est deja utilise.';
  if (code.includes('invalid-email')) return 'Adresse email invalide.';
  if (code.includes('weak-password')) return 'Le mot de passe doit contenir au moins 6 caracteres.';
  if (code.includes('permission-denied')) {
    return "Compte cree, mais l'ecriture Firestore est refusee. Deploie les regles Firestore puis reconnecte-toi.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Une erreur est survenue pendant l'inscription.";
}

export default function SignupScreen() {
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignup = async () => {
    const cleanPseudo = pseudo.trim();
    const cleanEmail = email.trim();
    setMessage('');

    if (!cleanPseudo || !cleanEmail || !password || !confirm) {
      setMessage('Remplis tous les champs.');
      return;
    }
    if (password !== confirm) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(cleanEmail, password, cleanPseudo);
      setMessage('Compte cree. Redirection en cours...');
    } catch (e) {
      setMessage(getSignupErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>Rejoignez l'elite</Title>
      <Card>
        <Label>Pseudo</Label><Input value={pseudo} onChangeText={setPseudo} />
        <Label>Email</Label><Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Label>Mot de passe</Label><Input value={password} onChangeText={setPassword} secureTextEntry />
        <Label>Confirmer</Label><Input value={confirm} onChangeText={setConfirm} secureTextEntry />
        <GradientButton title={loading ? 'Creation...' : 'Creer mon compte'} onPress={handleSignup} disabled={loading} />
        {message ? (
          <Text style={{ color: message.startsWith('Compte cree') ? theme.success : theme.danger, fontWeight: '600' }}>
            {message}
          </Text>
        ) : null}
      </Card>
      <Link href="/(auth)/login" style={{ color: '#FFD700' }}>Se connecter</Link>
    </Screen>
  );
}
