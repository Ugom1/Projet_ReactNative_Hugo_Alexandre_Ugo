import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={theme.muted} style={styles.input} {...props} />;
}

export function GradientButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.45 : 1 }}>
      <LinearGradient colors={[theme.gold, theme.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 16, gap: 14 },
  card: { backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14, gap: 10 },
  title: { fontSize: 30, fontWeight: '800', color: theme.text },
  label: { color: theme.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  input: { backgroundColor: '#0F0F0F', borderWidth: 1, borderColor: theme.border, color: theme.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  button: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#1A1A1A', fontWeight: '800' },
});
