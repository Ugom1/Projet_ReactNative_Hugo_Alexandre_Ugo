import { LoadingState, Screen, Subtitle, Title } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';

export function useTabScreenGuard() {
  const { user, profile, loading, profileError } = useAuth();

  if (loading) return { ready: false as const, content: <LoadingState /> };
  if (!user) return { ready: false as const, content: null };
  if (profileError || !profile) {
    return {
      ready: false as const,
      content: (
        <Screen>
          <Title>Chargement du profil</Title>
          <Subtitle>
            {profileError ??
              'Votre compte existe mais le profil Firestore est introuvable. Vérifiez les règles Firestore dans la console Firebase.'}
          </Subtitle>
        </Screen>
      ),
    };
  }

  return { ready: true as const, profile, user };
}
