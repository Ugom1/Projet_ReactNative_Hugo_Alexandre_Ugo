import type { Ligue, Position } from './types';

export const FC26_API_BASE = 'https://api.msmc.cc/api/fc26';

export type Fc26Player = {
  ID: string;
  Rank?: string;
  Name: string;
  GENDER?: string;
  OVR?: string;
  Position?: string;
  Nation?: string;
  League?: string;
  Team?: string;
  card?: string;
  url?: string;
};

export type Fc26SeedPlayer = {
  apiId: number;
  nom: string;
  position: Position;
  ligue: Ligue;
  nationalite: string;
  note: number;
  image: string;
};

const FC26_POSITION_MAP: Record<string, Position> = {
  GK: 'GB',
  CB: 'DC',
  LB: 'DC',
  RB: 'DC',
  LWB: 'DC',
  RWB: 'DC',
  CDM: 'MDC',
  CM: 'MDC',
  CAM: 'MDC',
  LM: 'MDC',
  RM: 'MDC',
  ST: 'ATT',
  LW: 'ATT',
  RW: 'ATT',
  CF: 'ATT',
};

const LEAGUE_NAME_TO_LIGUE: Record<string, Ligue> = {
  'Ligue 1': 'Ligue 1',
  'Premier League': 'Premier League',
  'La Liga': 'Liga',
  'LALIGA EA SPORTS': 'Liga',
  'Serie A': 'Serie A',
  'Serie A TIM': 'Serie A',
};

const COUNTRY_TO_LIGUE: Record<string, Ligue> = {
  France: 'Ligue 1',
  England: 'Premier League',
  Spain: 'Liga',
  Italy: 'Serie A',
};

export function mapFc26Position(raw?: string | null): Position {
  if (!raw) return 'MDC';
  const code = raw.trim().toUpperCase();
  if (FC26_POSITION_MAP[code]) return FC26_POSITION_MAP[code];
  if (code.includes('G')) return 'GB';
  if (['CB', 'LB', 'RB', 'WB'].some((p) => code.includes(p))) return 'DC';
  if (['ST', 'LW', 'RW', 'CF'].some((p) => code.includes(p))) return 'ATT';
  return 'MDC';
}

export function inferLigueFromFc26(player: Fc26Player): Ligue {
  const league = player.League?.trim();
  if (league && LEAGUE_NAME_TO_LIGUE[league]) return LEAGUE_NAME_TO_LIGUE[league];
  const nation = player.Nation?.trim() ?? '';
  return COUNTRY_TO_LIGUE[nation] ?? 'Premier League';
}

export function mapFc26PlayerToSeed(player: Fc26Player, fallbackImage: string): Fc26SeedPlayer | null {
  const apiId = Number(player.ID);
  const nom = player.Name?.trim();
  if (!apiId || !nom) return null;

  const note = Number(player.OVR) || 0;
  if (note < 75 || note > 91) return null;
  const nationalite = player.Nation?.trim() || 'Inconnu';

  return {
    apiId,
    nom,
    position: mapFc26Position(player.Position),
    ligue: inferLigueFromFc26(player),
    nationalite,
    note,
    image: player.card?.trim() || fallbackImage,
  };
}

export function dedupeFc26Players(players: Fc26SeedPlayer[]): Fc26SeedPlayer[] {
  const seen = new Map<number, Fc26SeedPlayer>();
  for (const player of players) {
    const existing = seen.get(player.apiId);
    if (!existing || player.note > existing.note) seen.set(player.apiId, player);
  }
  return [...seen.values()].sort((a, b) => b.note - a.note || a.nom.localeCompare(b.nom, 'fr'));
}
