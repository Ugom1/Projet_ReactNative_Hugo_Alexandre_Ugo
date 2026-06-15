export type ThemeMode = 'dark' | 'light';

export type AppTheme = {
  mode: ThemeMode;
  bg: string;
  card: string;
  cardSoft: string;
  border: string;
  text: string;
  muted: string;
  gold: string;
  orange: string;
  success: string;
  danger: string;
  inputBg: string;
  tabBarBg: string;
  selectedCard: string;
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  bg: '#0A0A0A',
  card: '#141414',
  cardSoft: '#1B1B1B',
  border: '#2A2A2A',
  text: '#F5F5F5',
  muted: '#A8A8A8',
  gold: '#FFD700',
  orange: '#FF6B00',
  success: '#23C552',
  danger: '#FF4D4F',
  inputBg: '#0F0F0F',
  tabBarBg: '#111111',
  selectedCard: '#3D3208',
};

export const lightTheme: AppTheme = {
  mode: 'light',
  bg: '#F4F4F5',
  card: '#FFFFFF',
  cardSoft: '#F0F0F0',
  border: '#D4D4D8',
  text: '#18181B',
  muted: '#71717A',
  gold: '#CA8A04',
  orange: '#EA580C',
  success: '#16A34A',
  danger: '#DC2626',
  inputBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  selectedCard: '#FEF9C3',
};

/** Thème sombre par défaut (compatibilité). */
export const theme = darkTheme;

export function themeForMode(mode: ThemeMode): AppTheme {
  return mode === 'light' ? lightTheme : darkTheme;
}
