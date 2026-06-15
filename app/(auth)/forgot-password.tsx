import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  FormScreen,
  GradientButton,
  Input,
  Label,
  Subtitle,
  Title,
} from '@/components/ui';
import { theme } from '@/constants/theme';
import { forgotPasswordSchema } from '@/lib/schemas';
import { forgotPassword } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email invalide');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert('Email envoyé', 'Consultez votre boîte mail pour réinitialiser votre mot de passe.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Envoi impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen scroll={false}>
      <View style={styles.topRow}>
        <Text style={styles.logo}>DTM</Text>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={32} color={theme.gold} />
      </View>

      <Title>Mot de passe oublié ?</Title>
      <Subtitle>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</Subtitle>

      <Card>
        <Label>ADRESSE E-MAIL</Label>
        <Input icon="mail-outline" value={email} onChangeText={setEmail} placeholder="nom@exemple.com" autoCapitalize="none" keyboardType="email-address" error={error} />
        <GradientButton title={loading ? 'ENVOI...' : 'ENVOYER LE LIEN'} onPress={handleSend} disabled={loading} />
      </Card>

      <Link href="/(auth)/login" style={styles.backLink}>
        ← Retour à la connexion
      </Link>

      <Text style={styles.copyright}>© 2026 DTM, TOUS DROITS RÉSERVÉS.</Text>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 24, fontWeight: '900', color: theme.gold, letterSpacing: 2 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1A1500',
    borderWidth: 2,
    borderColor: theme.gold,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },
  backLink: { color: theme.gold, textAlign: 'center', fontWeight: '700', marginTop: 8 },
  copyright: { color: theme.muted, fontSize: 11, textAlign: 'center', marginTop: 'auto', paddingBottom: 16 },
});
