import type { PackId } from './types';
import { isInCatalogNoteRange, MIN_PLAYER_NOTE, MAX_PLAYER_NOTE } from '@/lib/player-note-range';
import { resolvePlayerNote, type SeedPlayer } from '@/data/players.seed';

export type NoteBracketId = '75-79' | '80-82' | '83-85' | '86-87' | '88-89' | '90-91';

export type NoteBracket = {
  id: NoteBracketId;
  min: number;
  max: number;
  label: string;
};

/** Tranches de notes pour le tirage pack (75–91 uniquement). */
export const NOTE_BRACKETS: NoteBracket[] = [
  { id: '75-79', min: 75, max: 79, label: '75-79' },
  { id: '80-82', min: 80, max: 82, label: '80-82' },
  { id: '83-85', min: 83, max: 85, label: '83-85' },
  { id: '86-87', min: 86, max: 87, label: '86-87' },
  { id: '88-89', min: 88, max: 89, label: '88-89' },
  { id: '90-91', min: 90, max: 91, label: '90-91' },
];

/** Probabilité (%) de tirer chaque tranche selon le pack. */
export const PACK_NOTE_ODDS: Record<PackId, Record<NoteBracketId, number>> = {
  bronze: { '75-79': 50, '80-82': 30, '83-85': 10, '86-87': 5, '88-89': 3, '90-91': 2 },
  argent: { '75-79': 30, '80-82': 35, '83-85': 20, '86-87': 10, '88-89': 3, '90-91': 2 },
  or: { '75-79': 10, '80-82': 30, '83-85': 30, '86-87': 20, '88-89': 7, '90-91': 3 },
  elite: { '75-79': 2, '80-82': 8, '83-85': 20, '86-87': 25, '88-89': 25, '90-91': 20 },
};

export { MIN_PLAYER_NOTE, MAX_PLAYER_NOTE };

export function getNoteBracket(note: number): NoteBracketId | null {
  if (!isInCatalogNoteRange(note)) return null;
  for (const bracket of NOTE_BRACKETS) {
    if (note >= bracket.min && note <= bracket.max) return bracket.id;
  }
  return null;
}

export function playersInBracket(players: SeedPlayer[], bracketId: NoteBracketId): SeedPlayer[] {
  const bracket = NOTE_BRACKETS.find((b) => b.id === bracketId)!;
  return players.filter((p) => {
    const note = resolvePlayerNote(p);
    return note >= bracket.min && note <= bracket.max;
  });
}

export function pickNoteBracket(packId: PackId): NoteBracketId {
  const odds = PACK_NOTE_ODDS[packId];
  const roll = Math.random() * 100;
  let acc = 0;
  for (const bracket of NOTE_BRACKETS) {
    acc += odds[bracket.id];
    if (roll < acc) return bracket.id;
  }
  return NOTE_BRACKETS[NOTE_BRACKETS.length - 1].id;
}

/** Choisit un joueur : tranche selon le pack, puis tirage uniforme dans la tranche. */
export function pickPlayerForPack(packId: PackId, players: SeedPlayer[]): SeedPlayer {
  if (!players.length) throw new Error('Catalogue joueurs vide');

  const pool = players.filter((p) => getNoteBracket(resolvePlayerNote(p)) !== null);
  if (!pool.length) throw new Error(`Aucun joueur entre ${MIN_PLAYER_NOTE} et ${MAX_PLAYER_NOTE}`);

  let bracketId = pickNoteBracket(packId);
  let candidates = playersInBracket(pool, bracketId);

  if (!candidates.length) {
    for (const bracket of NOTE_BRACKETS) {
      candidates = playersInBracket(pool, bracket.id);
      if (candidates.length) break;
    }
  }

  if (!candidates.length) return pool[Math.floor(Math.random() * pool.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function packOddsSummary(packId: PackId): string {
  return NOTE_BRACKETS.map((b) => `${b.label}: ${PACK_NOTE_ODDS[packId][b.id]}%`).join(' · ');
}
