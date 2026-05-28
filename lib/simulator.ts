import type { DreamTeam } from './schemas';

export type MatchResult = {
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  outcome: 'win' | 'draw' | 'loss';
  coinsEarned: number;
  xpEarned: number;
};

export type SeasonSummary = {
  matches: MatchResult[];
  wins: number;
  draws: number;
  losses: number;
  points: number;
  rank: number;
  totalCoins: number;
  totalXp: number;
};

function teamStrength(team: DreamTeam): number {
  if (team.players.length === 0) return 50;
  return team.players.reduce((s, p) => s + p.rating, 0) / team.players.length;
}

const OPPONENTS = [
  'FC Rivaux',
  'United Clickers',
  'Real Monnaie',
  'Barça Coins',
  'Liverpool XP',
  'Atlético Dream',
];

export function simulateMatch(team: DreamTeam): MatchResult {
  const strength = teamStrength(team);
  const oppStrength = 65 + Math.random() * 20;
  const diff = strength - oppStrength;
  const gf = Math.max(0, Math.round(1.5 + diff / 25 + (Math.random() * 2 - 0.5)));
  const ga = Math.max(0, Math.round(1.2 - diff / 30 + (Math.random() * 2 - 0.5)));

  let outcome: MatchResult['outcome'] = 'draw';
  if (gf > ga) outcome = 'win';
  else if (gf < ga) outcome = 'loss';

  const coinsEarned = outcome === 'win' ? 80 : outcome === 'draw' ? 35 : 15;
  const xpEarned = outcome === 'win' ? 40 : outcome === 'draw' ? 20 : 10;

  return {
    opponent: OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)],
    goalsFor: gf,
    goalsAgainst: ga,
    outcome,
    coinsEarned,
    xpEarned,
  };
}

export function simulateSeason(team: DreamTeam, matchCount = 8): SeasonSummary {
  const matches = Array.from({ length: matchCount }, () => simulateMatch(team));
  const wins = matches.filter((m) => m.outcome === 'win').length;
  const draws = matches.filter((m) => m.outcome === 'draw').length;
  const losses = matches.filter((m) => m.outcome === 'loss').length;
  const points = wins * 3 + draws;
  const rank = points >= 18 ? 1 : points >= 14 ? 2 : points >= 10 ? 3 : 5;

  return {
    matches,
    wins,
    draws,
    losses,
    points,
    rank,
    totalCoins: matches.reduce((s, m) => s + m.coinsEarned, 0),
    totalXp: matches.reduce((s, m) => s + m.xpEarned, 0),
  };
}
