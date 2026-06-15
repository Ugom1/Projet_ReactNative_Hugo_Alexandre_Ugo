import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    if (user && inAuth) router.replace('/(tabs)');
  }, [loading, user, segments, router]);

  return <>{children}</>;
}

function ThemedStack() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.bg },
      }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profil" options={{ title: 'Profil', headerShown: false }} />
      <Stack.Screen name="jouer/composition" options={{ title: 'Composition', headerShown: false }} />
      <Stack.Screen name="jouer/resultat" options={{ title: 'Résultat', headerShown: false }} />
      <Stack.Screen name="marche/ouverture" options={{ title: 'Ouverture de pack', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <Gate>
            <ThemedStack />
          </Gate>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
