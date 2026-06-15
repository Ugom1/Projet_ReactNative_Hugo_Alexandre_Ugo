import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
      <Text style={{ color: 'white' }}>Ecran introuvable</Text>
      <Link href="/(tabs)" style={{ color: '#FFD700' }}>Retour à l'accueil</Link>
    </View>
  );
}
