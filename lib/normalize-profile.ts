import type { UserProfile } from '@/lib/schemas';
import { safeCoins, safeNum } from '@/lib/numbers';

const DEFAULTS: Omit<UserProfile, 'uid' | 'email'> = {
  displayName: 'Joueur',
  coins: 200,
  xp: 0,
  totalClicks: 0,
  clickPower: 1,
  activeBoosts: [],
  achievements: [],
  disabled: false,
};

export function normalizeUserProfile(uid: string, raw: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: String(raw.email ?? ''),
    displayName: String(raw.displayName ?? DEFAULTS.displayName),
    photoURL: raw.photoURL ? String(raw.photoURL) : undefined,
    coins: safeCoins(raw.coins ?? DEFAULTS.coins),
    xp: safeNum(raw.xp, DEFAULTS.xp),
    totalClicks: safeNum(raw.totalClicks, DEFAULTS.totalClicks),
    clickPower: Math.max(1, safeNum(raw.clickPower, DEFAULTS.clickPower)),
    activeBoosts: Array.isArray(raw.activeBoosts) ? (raw.activeBoosts as UserProfile['activeBoosts']) : [],
    achievements: Array.isArray(raw.achievements) ? (raw.achievements as string[]) : [],
    disabled: Boolean(raw.disabled),
    createdAt: raw.createdAt,
  };
}

export function profileNeedsRepair(raw: Record<string, unknown>): boolean {
  return (
    !Number.isFinite(Number(raw.coins)) ||
    !Number.isFinite(Number(raw.clickPower)) ||
    !Number.isFinite(Number(raw.xp)) ||
    !Array.isArray(raw.activeBoosts)
  );
}
