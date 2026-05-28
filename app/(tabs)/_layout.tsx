import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        tabBarStyle: { backgroundColor: '#111', borderTopColor: theme.border },
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.muted,
      }}>
      <Tabs.Screen name="clicker" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="league" options={{ title: 'Jouer', tabBarIcon: ({ color, size }) => <Ionicons name="football" color={color} size={size} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Marche', tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Ma Galerie', tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} /> }} />
    </Tabs>
  );
}
