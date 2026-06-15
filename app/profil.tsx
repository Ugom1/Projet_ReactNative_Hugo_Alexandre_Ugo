import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppHeader,
  ErrorText,
  GradientButton,
  Input,
  Label,
  LoadingState,
  Screen,
  Subtitle,
  Title,
} from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { logout, updateUserProfile } from '@/services/authService';

export default function ProfilScreen() {
  const { user, profile, loading } = useAuth();
  const { theme, mode, setMode } = useTheme();
  const [pseudo, setPseudo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.pseudo) setPseudo(profile.pseudo);
  }, [profile?.pseudo]);

  if (loading || !user || !profile) return <LoadingState />;

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await updateUserProfile(user.uid, pseudo);
      router.back();
    } catch (e) {
      setError((e as Error).message || 'Impossible de mettre à jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <AppHeader showBack />

      <Title>Mon profil</Title>
      <Subtitle>Modifiez votre pseudo et l&apos;apparence de l&apos;application.</Subtitle>

      <View style={styles.avatarPreview}>
        <Ionicons name="person-circle" size={88} color={theme.gold} />
        <Text style={[styles.previewPseudo, { color: theme.text }]}>{pseudo || profile.pseudo}</Text>
      </View>

      <View>
        <Label>Pseudo</Label>
        <Input
          value={pseudo}
          onChangeText={setPseudo}
          placeholder="Votre pseudo"
          autoCapitalize="words"
          icon="person-outline"
        />
      </View>

      <View style={styles.themeSection}>
        <Label>Apparence</Label>
        <View style={styles.themeRow}>
          {(['dark', 'light'] as const).map((value) => {
            const active = mode === value;
            return (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={[
                  styles.themeChip,
                  { borderColor: theme.border, backgroundColor: active ? theme.gold : theme.card },
                ]}>
                <Ionicons
                  name={value === 'dark' ? 'moon' : 'sunny'}
                  size={16}
                  color={active ? '#1A1A1A' : theme.muted}
                />
                <Text style={[styles.themeChipText, { color: active ? '#1A1A1A' : theme.text }]}>
                  {value === 'dark' ? 'Sombre' : 'Clair'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ErrorText>{error ?? undefined}</ErrorText>

      <GradientButton title="Enregistrer" onPress={save} loading={saving} disabled={saving} />

      <GradientButton
        title="Se déconnecter"
        variant="dark"
        onPress={() =>
          logout().catch((e) => {
            const message = e.message || 'Déconnexion impossible';
            if (typeof Alert !== 'undefined' && Alert.alert) {
              Alert.alert('Erreur', message);
            } else {
              setError(message);
            }
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarPreview: { alignItems: 'center', gap: 8, marginVertical: 8 },
  previewPseudo: { fontSize: 20, fontWeight: '800' },
  themeSection: { gap: 8 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  themeChipText: { fontWeight: '700', fontSize: 14 },
});
