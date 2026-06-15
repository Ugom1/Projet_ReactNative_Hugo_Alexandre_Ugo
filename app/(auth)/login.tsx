import { Link } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  ErrorText,
  FormScreen,
  GradientButton,
  Input,
  Label,
  Subtitle,
} from '@/components/ui';
import { theme } from '@/constants/theme';
import { getFirebaseSetupMessage, isFirebaseConfigured } from '@/lib/firebase-config';
import { loginSchema } from '@/lib/schemas';
import { login } from '@/services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  const handleLogin = async () => {
    Keyboard.dismiss();
    setFormError('');

    if (!firebaseReady) {
      setFormError(getFirebaseSetupMessage());
      return;
    }
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) next[String(i.path[0])] = i.message;
      });
      setErrors(next);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <View style={styles.brand}>
        <Text style={styles.logo}>DTM</Text>
        <Subtitle>ENTREZ DANS L'ÉLITE DU JEU</Subtitle>
      </View>

      <Card>
        <Label>Email</Label>
        <Input
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
          returnKeyType="next"
        />
        <View style={styles.row}>
          <Label>Mot de passe</Label>
          <Link href="/(auth)/forgot-password" style={styles.link}>
            Mot de passe oublié ?
          </Link>
        </View>
        <Input
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={errors.password}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <ErrorText>{formError}</ErrorText>
        <GradientButton title={loading ? 'CONNEXION...' : 'SE CONNECTER'} onPress={handleLogin} disabled={loading} />
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas encore de compte ? </Text>
        <Link href="/(auth)/signup" style={styles.linkBold}>
          Créer mon compte
        </Link>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logo: { fontSize: 36, fontWeight: '900', color: theme.gold, letterSpacing: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: theme.gold, fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { color: theme.muted },
  linkBold: { color: theme.gold, fontWeight: '800' },
});
