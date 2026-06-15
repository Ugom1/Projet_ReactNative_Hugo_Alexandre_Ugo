import { SEED_PLAYERS, PLAYER_IMAGE, resolvePlayerNote } from '@/data/players.seed';
import { pickPlayerForPack } from '@/lib/pack-odds';
import type { MatchCondition, PackId, PlayerCard, Position, Rarete, SlotId } from './types';

export const PALIERS = [75, 80, 85, 90, 95] as const;
export const SLOTS: SlotId[] = ['ATT', 'MDC', 'DC', 'GB', 'EXTRA'];

export const POSITION_LABELS: Record<Position, string> = {
  ATT: 'Attaquant',
  MDC: 'Milieu',
  DC: 'Défenseur',
  GB: 'Gardien',
};

export const SLOT_LABELS: Record<SlotId, string> = {
  ...POSITION_LABELS,
  EXTRA: 'Joueur bonus',
};

/** Compatibilité données Firestore encore en LIMITED. */
export function normalizeRarete(value: string | undefined): Rarete {
  if (value === 'LIMITED') return 'UNCOMMON';
  if (value === 'RARE' || value === 'SUPER_RARE' || value === 'UNIQUE') return value;
  return 'UNCOMMON';
}

export const PACKS = [
  {
    id: 'bronze' as PackId,
    nom: 'Pack Bronze',
    prix: 100,
    drops: { UNCOMMON: 95, RARE: 5, SUPER_RARE: 0, UNIQUE: 0 },
    gradient: ['#8B6914', '#CD7F32'],
  },
  {
    id: 'argent' as PackId,
    nom: 'Pack Argent',
    prix: 250,
    drops: { UNCOMMON: 0, RARE: 88, SUPER_RARE: 12, UNIQUE: 0 },
    gradient: ['#C0C0C0', '#808080'],
  },
  {
    id: 'or' as PackId,
    nom: 'Pack Or',
    prix: 500,
    drops: { UNCOMMON: 0, RARE: 0, SUPER_RARE: 95, UNIQUE: 5 },
    gradient: ['#FFD700', '#FF6B00'],
  },
  {
    id: 'elite' as PackId,
    nom: 'Pack Élite',
    prix: 1500,
    drops: { UNCOMMON: 0, RARE: 0, SUPER_RARE: 75, UNIQUE: 25 },
    gradient: ['#7B2FBE', '#1E3A8A'],
  },
];

export const RARETE_COLORS: Record<Rarete, string> = {
  UNCOMMON: '#3B82F6',
  RARE: '#FFD700',
  SUPER_RARE: '#A855F7',
  UNIQUE: '#FF6B00',
};

export const RARETE_LABELS: Record<Rarete, string> = {
  UNCOMMON: 'UNCOMMON',
  RARE: 'RARE',
  SUPER_RARE: 'SUPER RARE',
  UNIQUE: 'UNIQUE',
};

const RECYCLE_BASE_GEMS = 25;
const RECYCLE_RARITY_EXPONENT = 4;

const RARETE_TIER: Record<Rarete, number> = {
  UNCOMMON: 0,
  RARE: 1,
  SUPER_RARE: 2,
  UNIQUE: 3,
};

/** Gems obtenues en recyclant une carte (progression exponentielle par rareté). */
export function recycleGemsForCard(card: Pick<PlayerCard, 'rarete'>): number {
  const tier = RARETE_TIER[card.rarete] ?? 0;
  return Math.round(RECYCLE_BASE_GEMS * Math.pow(RECYCLE_RARITY_EXPONENT, tier));
}

export function rewardForPalier(index: number) {
  return Math.round(50 * Math.pow(1.5, index));
}

export function noteToRarete(note: number): Rarete {
  if (note >= 86) return 'UNIQUE';
  if (note >= 83) return 'SUPER_RARE';
  if (note >= 80) return 'RARE';
  return 'UNCOMMON';
}

/** Pack bonus gagné à la victoire, proportionnel au palier joué. */
const BONUS_PACK_BY_PALIER: PackId[] = ['bronze', 'argent', 'or', 'elite', 'elite'];

export function bonusPackForPalier(index: number): PackId {
  const clamped = Math.max(0, Math.min(index, BONUS_PACK_BY_PALIER.length - 1));
  return BONUS_PACK_BY_PALIER[clamped];
}

export function palierRewardLabel(index: number) {
  const gems = rewardForPalier(index);
  const packName = PACKS.find((p) => p.id === bonusPackForPalier(index))?.nom ?? 'Pack';
  return `${formatGems(gems)} 💎 + ${packName}`;
}

function hasMinNationality(cards: PlayerCard[], nationality: string) {
  return cards.filter((c) => c.nationalite === nationality).length >= 1;
}

function hasMinSameField(cards: PlayerCard[], field: 'nationalite' | 'ligue', min: number) {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const key = card[field];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count >= min);
}

function extraHasPosition(
  slots: Partial<Record<SlotId, PlayerCard>>,
  positions: Position[]
) {
  const extra = slots.EXTRA;
  return extra != null && positions.includes(extra.position);
}

const CONDITIONS: MatchCondition[] = [
  {
    id: 'min-france',
    label: 'Au moins 1 joueur français',
    check: (cards) => hasMinNationality(cards, 'France'),
  },
  {
    id: 'min-bresil',
    label: 'Au moins 1 joueur brésilien',
    check: (cards) => hasMinNationality(cards, 'Brazil'),
  },
  {
    id: 'min-espagne',
    label: 'Au moins 1 joueur espagnol',
    check: (cards) => hasMinNationality(cards, 'Spain'),
  },
  {
    id: 'min-portugal',
    label: 'Au moins 1 joueur portugais',
    check: (cards) => hasMinNationality(cards, 'Portugal'),
  },
  {
    id: 'min-angleterre',
    label: 'Au moins 1 joueur anglais',
    check: (cards) => hasMinNationality(cards, 'England'),
  },
  {
    id: 'extra-att',
    label: `Le ${SLOT_LABELS.EXTRA.toLowerCase()} doit être ${POSITION_LABELS.ATT.toLowerCase()}`,
    check: (_cards, slots) => extraHasPosition(slots, ['ATT']),
  },
  {
    id: 'extra-mdc',
    label: `Le ${SLOT_LABELS.EXTRA.toLowerCase()} doit être ${POSITION_LABELS.MDC.toLowerCase()}`,
    check: (_cards, slots) => extraHasPosition(slots, ['MDC']),
  },
  {
    id: 'extra-def',
    label: `Le ${SLOT_LABELS.EXTRA.toLowerCase()} doit être ${POSITION_LABELS.DC.toLowerCase()} ou ${POSITION_LABELS.GB.toLowerCase()}`,
    check: (_cards, slots) => extraHasPosition(slots, ['DC', 'GB']),
  },
  {
    id: 'deux-meme-pays',
    label: 'Au moins 2 joueurs du même pays',
    check: (cards) => hasMinSameField(cards, 'nationalite', 2),
  },
  {
    id: 'deux-meme-ligue',
    label: 'Au moins 2 joueurs de la même ligue',
    check: (cards) => hasMinSameField(cards, 'ligue', 2),
  },
];

export function randomCondition(): MatchCondition {
  return CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
}

export function createRandomCard(packId: PackId): Omit<PlayerCard, 'id'> {
  const seed = pickPlayerForPack(packId, SEED_PLAYERS);
  const note = resolvePlayerNote(seed);
  const cardId = seed.apiId != null ? String(seed.apiId) : seed.nom.toLowerCase().replace(/\s+/g, '-');
  return {
    cardId,
    nom: seed.nom,
    position: seed.position,
    ligue: seed.ligue,
    nationalite: seed.nationalite,
    note,
    rarete: noteToRarete(note),
    image: seed.image || PLAYER_IMAGE,
  };
}

export function canFillSlot(card: PlayerCard, slot: SlotId): boolean {
  if (slot === 'EXTRA') return true;
  return card.position === slot;
}

export function computeMoyenne(cards: PlayerCard[]) {
  if (!cards.length) return 0;
  return cards.reduce((a, c) => a + c.note, 0) / cards.length;
}

export function simulateMatch(moyenne: number, scoreRequis: number) {
  const bonus = Math.floor(Math.random() * 16) - 5;
  const score = Math.round((moyenne + bonus) * 10) / 10;
  return { score, victoire: score >= scoreRequis };
}

export function formatGems(n: number) {
  return n.toLocaleString('fr-FR');
}
