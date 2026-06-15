import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.border,
          height: 52 + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueille',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="jouer"
        options={{
          title: 'Jouer',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="football" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="marche"
        options={{
          title: 'Marché',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="galerie"
        options={{
          title: 'Ma Galerie',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
