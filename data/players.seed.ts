import { FC26_META, FC26_PLAYERS } from './fc26.players.generated';
import type { Ligue, Position } from '@/lib/types';
import { isInCatalogNoteRange, MAX_PLAYER_NOTE, MIN_PLAYER_NOTE } from '@/lib/player-note-range';

export type SeedPlayer = {
  apiId?: number;
  nom: string;
  position: Position;
  ligue: Ligue;
  nationalite: string;
  /** Note permanente du joueur (fixe, ne change pas à l'obtention). */
  note: number;
  ovr?: number;
  image: string;
};

export function resolvePlayerNote(player: Pick<SeedPlayer, 'note' | 'ovr'>): number {
  const n = player.note ?? player.ovr;
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0;
}

export { MIN_PLAYER_NOTE, MAX_PLAYER_NOTE };

export const PLAYER_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80';

/** Pool EA FC 26 — notes entre 75 et 91 inclus. */
export const SEED_PLAYERS: SeedPlayer[] = FC26_PLAYERS.map((p) => ({
  apiId: p.apiId,
  nom: p.nom,
  position: p.position,
  ligue: p.ligue,
  nationalite: p.nationalite,
  note: (p as { note?: number; ovr: number }).note ?? (p as { ovr: number }).ovr,
  ovr: (p as { ovr?: number }).ovr,
  image: p.image || PLAYER_IMAGE,
})).filter((p) => isInCatalogNoteRange(resolvePlayerNote(p)));

export const PLAYERS_META = FC26_META;
