import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useOTAUpdate } from '@/hooks/useOtaUpdate';

export default function Index() {
  const { user, loading } = useAuth();
  useOTAUpdate();


  if (loading) return null;

  if (user) return <Redirect href="/(tabs)" />;

  return <Redirect href="/(auth)/login" />;
}
