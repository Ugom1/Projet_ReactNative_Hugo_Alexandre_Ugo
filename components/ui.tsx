import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppTheme } from '@/constants/theme';
import { formatGems, POSITION_LABELS, RARETE_COLORS, RARETE_LABELS } from '@/lib/game';
import type { PlayerCard, Rarete } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    flex: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
    screen: { flex: 1, backgroundColor: theme.bg, padding: 16, gap: 14 },
    screenScroll: { padding: 16, gap: 14, paddingBottom: 120 },
    formScroll: { padding: 20, gap: 16, flexGrow: 1, justifyContent: 'center' },
    headerWrap: { gap: 4 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    headerProfile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      minWidth: 0,
    },
    headerPseudo: { color: theme.text, fontWeight: '700', fontSize: 13, flexShrink: 1 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
    backText: { color: theme.gold, fontWeight: '700', fontSize: 14 },
    logo: { fontSize: 22, fontWeight: '900', color: theme.gold, letterSpacing: 2 },
    gemBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
    gemText: { color: theme.text, fontWeight: '700', fontSize: 14 },
    gemIcon: { fontSize: 16 },
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 10,
    },
    title: { fontSize: 28, fontWeight: '800', color: theme.text },
    titleGold: { color: theme.gold },
    subtitle: { color: theme.muted, fontSize: 14, lineHeight: 20 },
    label: { color: theme.muted, fontSize: 12, fontWeight: '600', marginBottom: 4 },
    error: { color: theme.danger, fontSize: 12, marginTop: 4 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
    },
    inputError: { borderColor: theme.danger },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, color: theme.text, paddingVertical: 12, fontSize: 15 },
    button: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    buttonText: { color: '#1A1A1A', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
    darkButton: {
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    darkButtonText: { color: theme.text, fontWeight: '600' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
    dividerText: { color: theme.muted, fontSize: 13 },
    playerCard: {
      backgroundColor: theme.cardSoft,
      borderRadius: 12,
      borderWidth: 2,
      padding: 10,
      gap: 4,
      minHeight: 160,
    },
    playerCardCompact: { minHeight: 130 },
    selected: { backgroundColor: theme.selectedCard, borderColor: theme.gold, borderWidth: 3 },
    playerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    playerPos: { color: theme.gold, fontWeight: '800', fontSize: 12 },
    playerAvatar: {
      height: 88,
      borderRadius: 8,
      backgroundColor: theme.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 4,
      overflow: 'hidden',
    },
    playerAvatarCompact: { height: 56 },
    playerPhoto: { width: '100%', height: '100%' },
    playerName: { color: theme.text, fontWeight: '700', fontSize: 13 },
    playerMeta: { color: theme.muted, fontSize: 11 },
    noteBadge: {
      alignSelf: 'flex-end',
      backgroundColor: theme.gold,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 4,
    },
    noteText: { color: '#1A1A1A', fontWeight: '900', fontSize: 13 },
    rareteBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    rareteText: { color: '#1A1A1A', fontWeight: '800', fontSize: 9 },
  });
}

function useUiStyles() {
  const { theme } = useTheme();
  return useMemo(() => createStyles(theme), [theme]);
}

export function FormScreen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const styles = useUiStyles();
  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.formScroll}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const styles = useUiStyles();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.screenScroll}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.screen}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function AppHeader({ gems, showBack }: { gems?: number; showBack?: boolean }) {
  const router = useRouter();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const styles = useUiStyles();
  const displayGems = gems ?? profile?.monnaie ?? 0;

  return (
    <View style={styles.headerWrap}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/profil')}
          style={styles.headerProfile}
          accessibilityLabel="Profil"
          accessibilityRole="button">
          <Ionicons name="person-circle-outline" size={28} color={theme.gold} />
          <Text style={styles.headerPseudo} numberOfLines={1}>
            {profile?.pseudo ?? 'Profil'}
          </Text>
        </Pressable>
        <Text style={styles.logo}>DTM</Text>
        <View style={styles.gemBadge}>
          <Text style={styles.gemText}>{formatGems(displayGems)}</Text>
          <Text style={styles.gemIcon}>💎</Text>
        </View>
      </View>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={18} color={theme.gold} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const styles = useUiStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, gold }: { children: ReactNode; gold?: boolean }) {
  const styles = useUiStyles();
  return <Text style={[styles.title, gold && styles.titleGold]}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  const styles = useUiStyles();
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  const styles = useUiStyles();
  return <Text style={styles.label}>{children}</Text>;
}

export function ErrorText({ children }: { children?: string }) {
  const styles = useUiStyles();
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Input({
  icon,
  error,
  ...props
}: React.ComponentProps<typeof TextInput> & { icon?: keyof typeof Ionicons.glyphMap; error?: string }) {
  const { theme } = useTheme();
  const styles = useUiStyles();
  return (
    <View>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        {icon ? <Ionicons name={icon} size={18} color={theme.muted} style={styles.inputIcon} /> : null}
        <TextInput placeholderTextColor={theme.muted} style={styles.input} {...props} />
      </View>
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

export function GradientButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'gold',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'gold' | 'dark' | 'blue';
}) {
  const { theme } = useTheme();
  const styles = useUiStyles();
  const isDisabled = disabled || loading;

  if (variant === 'dark') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={{ opacity: isDisabled ? 0.45 : 1 }}>
        <View style={styles.darkButton}>
          {loading ? <ActivityIndicator color={theme.text} /> : <Text style={styles.darkButtonText}>{title}</Text>}
        </View>
      </Pressable>
    );
  }

  const colors =
    variant === 'blue' ? (['#3B82F6', '#1E40AF'] as const) : ([theme.gold, theme.orange] as const);

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={{ opacity: isDisabled ? 0.45 : 1 }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
        {loading ? <ActivityIndicator color="#1A1A1A" /> : <Text style={styles.buttonText}>{title}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

export function LoadingState() {
  const { theme } = useTheme();
  const styles = useUiStyles();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.gold} size="large" />
    </View>
  );
}

export function Divider({ label = 'ou' }: { label?: string }) {
  const styles = useUiStyles();
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function PlayerCardView({
  card,
  compact,
  onPress,
  selected,
}: {
  card: PlayerCard;
  compact?: boolean;
  onPress?: () => void;
  selected?: boolean;
}) {
  const { theme } = useTheme();
  const styles = useUiStyles();
  const [imageError, setImageError] = useState(false);
  const borderColor = RARETE_COLORS[card.rarete];
  const showPhoto = Boolean(card.image) && !imageError;
  const content = (
    <View style={[styles.playerCard, { borderColor }, compact && styles.playerCardCompact, selected && styles.selected]}>
      <View style={styles.playerTop}>
        <Text style={styles.playerPos}>{POSITION_LABELS[card.position]}</Text>
        <View style={[styles.rareteBadge, { backgroundColor: borderColor }]}>
          <Text style={styles.rareteText}>{RARETE_LABELS[card.rarete]}</Text>
        </View>
      </View>
      <View style={[styles.playerAvatar, compact && styles.playerAvatarCompact]}>
        {showPhoto ? (
          <Image
            source={{ uri: card.image }}
            style={styles.playerPhoto}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <Ionicons name="person" size={compact ? 28 : 40} color={theme.muted} />
        )}
      </View>
      <Text style={styles.playerName} numberOfLines={1}>
        {card.nom}
      </Text>
      <Text style={styles.playerMeta}>{card.nationalite}</Text>
      <View style={styles.noteBadge}>
        <Text style={styles.noteText}>{card.note}</Text>
      </View>
    </View>
  );

  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

export function RareteTag({ rarete }: { rarete: Rarete }) {
  const styles = useUiStyles();
  return (
    <View style={[styles.rareteBadge, { backgroundColor: RARETE_COLORS[rarete] }]}>
      <Text style={styles.rareteText}>{RARETE_LABELS[rarete]}</Text>
    </View>
  );
}
