import type { MatchCondition, PlayerCard } from './types';
export const PALIERS = [75, 80, 85, 90, 95];
export const PACKS = [
  { id: 'bronze', nom: 'Pack Bronze', prix: 100, min: 65, max: 78, chances: { Bronze: 80, Argent: 18, Or: 2, Elite: 0 } },
  { id: 'argent', nom: 'Pack Argent', prix: 250, min: 72, max: 84, chances: { Bronze: 40, Argent: 45, Or: 13, Elite: 2 } },
  { id: 'or', nom: 'Pack Or', prix: 600, min: 80, max: 91, chances: { Bronze: 10, Argent: 35, Or: 45, Elite: 10 } },
  { id: 'elite', nom: 'Pack Elite', prix: 1500, min: 86, max: 96, chances: { Bronze: 0, Argent: 20, Or: 50, Elite: 30 } },
] as const;
const baseJoueurs = [
  ['K. Mbappe', 'FWD', 'Ligue 1', 'France'], ['A. Griezmann', 'FWD', 'Liga', 'France'], ['V. Djike', 'DEF', 'Ligue 1', 'France'], ['Maignan', 'GK', 'Serie A', 'France'], ['W. Saliba', 'DEF', 'Premier League', 'France'], ['Bellingham', 'MID', 'Liga', 'Angleterre'], ['Leao', 'FWD', 'Serie A', 'Portugal'], ['Odegaard', 'MID', 'Premier League', 'Norvege'], ['Hakimi', 'DEF', 'Ligue 1', 'Maroc'], ['Ter Stegen', 'GK', 'Liga', 'Allemagne'],
] as const;
export function rewardForPalier(index: number) { return Math.round(50 * Math.pow(1.5, index)); }
export function randomCondition(): MatchCondition { const c: MatchCondition[] = [{ id: 'francais', label: 'Un joueur Francais requis', check: (cards) => cards.some((x) => x.nation === 'France') }, { id: 'extra-def', label: 'Le joueur EXTRA doit etre DEF', check: (cards) => cards[4]?.position === 'DEF' }, { id: 'deux-ligues', label: 'Au moins 2 ligues differentes', check: (cards) => new Set(cards.map((x) => x.ligue)).size >= 2 }]; return c[Math.floor(Math.random() * c.length)]; }
function pickRarity(chances: Record<'Bronze'|'Argent'|'Or'|'Elite', number>) { const roll = Math.random() * 100; if (roll < chances.Elite) return 'Elite'; if (roll < chances.Elite + chances.Or) return 'Or'; if (roll < chances.Elite + chances.Or + chances.Argent) return 'Argent'; return 'Bronze'; }
export function createRandomCard(packId: string): PlayerCard { const pack = PACKS.find((p) => p.id === packId) ?? PACKS[0]; const p = baseJoueurs[Math.floor(Math.random() * baseJoueurs.length)]; const note = Math.floor(Math.random() * (pack.max - pack.min + 1)) + pack.min; const rarete = pickRarity(pack.chances as Record<'Bronze'|'Argent'|'Or'|'Elite', number>); return { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, nom: p[0], position: p[1], ligue: p[2], nation: p[3], note, rarete, image: 'https://images.unsplash.com/photo-1570498839593-e565b39455fc?auto=format&fit=crop&w=400&q=80' }; }
