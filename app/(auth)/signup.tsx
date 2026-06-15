import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  ErrorText,
  FormScreen,
  GradientButton,
  Input,
  Label,
  Subtitle,
  Title,
} from '@/components/ui';
import { theme } from '@/constants/theme';
import { signupSchema } from '@/lib/schemas';
import { register } from '@/services/authService';

export default function SignupScreen() {
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignup = async () => {
    const parsed = signupSchema.safeParse({ pseudo, email, password, confirmPassword, acceptTerms });
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
    setMessage('');
    try {
      await register(email, password, pseudo, confirmPassword, acceptTerms);
      setMessage('Compte créé. Redirection en cours...');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <Text style={styles.logo}>DTM</Text>
      <Title>Rejoignez l'élite</Title>
      <Subtitle>Commencez votre collection de cartes numériques rares dès aujourd'hui.</Subtitle>

      <Card>
        <Label>Pseudo</Label>
        <Input icon="person-outline" value={pseudo} onChangeText={setPseudo} placeholder="Entrez votre pseudo" error={errors.pseudo} />
        <Label>Email</Label>
        <Input icon="mail-outline" value={email} onChangeText={setEmail} placeholder="votre@email.com" autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <Label>Mot de passe</Label>
        <Input icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
        <Label>Confirmer mot de passe</Label>
        <Input icon="lock-closed-outline" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={errors.confirmPassword} />

        <Pressable style={styles.checkRow} onPress={() => setAcceptTerms((v) => !v)}>
          <View style={[styles.checkbox, acceptTerms && styles.checkboxOn]}>
            {acceptTerms ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkText}>
            J'accepte les <Text style={styles.link}>Conditions d'utilisation</Text> et la{' '}
            <Text style={styles.link}>Politique de confidentialité</Text>.
          </Text>
        </Pressable>
        <ErrorText>{errors.acceptTerms}</ErrorText>

        <GradientButton title={loading ? 'CRÉATION...' : 'Créer mon compte'} onPress={handleSignup} disabled={loading} />
        {message ? (
          <Text style={{ color: message.includes('créé') ? theme.success : theme.danger, fontWeight: '600' }}>{message}</Text>
        ) : null}
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Vous avez déjà un compte ? </Text>
        <Link href="/(auth)/login" style={styles.link}>
          Se connecter
        </Link>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  logo: { fontSize: 28, fontWeight: '900', color: theme.gold, letterSpacing: 2, textAlign: 'center' },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: theme.gold, borderColor: theme.gold },
  checkMark: { color: '#1A1A1A', fontWeight: '900', fontSize: 12 },
  checkText: { flex: 1, color: theme.muted, fontSize: 13, lineHeight: 18 },
  link: { color: theme.gold, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: theme.muted },
});
