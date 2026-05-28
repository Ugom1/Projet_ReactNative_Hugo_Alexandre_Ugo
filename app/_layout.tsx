import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { theme } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    if (user && inAuth) router.replace('/(tabs)/clicker');
  }, [loading, user, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Gate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.bg },
            headerTintColor: theme.text,
            contentStyle: { backgroundColor: theme.bg },
          }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="jouer/composition" options={{ title: 'Composition' }} />
          <Stack.Screen name="jouer/resultat" options={{ title: 'Resultat' }} />
          <Stack.Screen name="marche/ouverture" options={{ title: 'Ouverture de pack' }} />
        </Stack>
      </Gate>
    </AuthProvider>
  );
}
