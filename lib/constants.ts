export const API_FOOTBALL_KEY = '919749d79d089e4d5323f754aaa46961';
export const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

export const LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga', country: 'Spain', flag: '🇪🇸' },
] as const;

export const CURRENT_SEASON = 2024;

export const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'] as const;

export const BOOSTS = [
  { id: 'x2', label: 'x2 gains', multiplier: 2, durationSec: 60, price: 100 },
  { id: 'x5', label: 'x5 gains', multiplier: 5, durationSec: 30, price: 500 },
  { id: 'auto', label: 'Auto-clic', multiplier: 1, durationSec: 45, price: 300, auto: true },
] as const;

export const ACHIEVEMENTS = [
  { id: 'first_team', title: 'Première DreamTeam', description: 'Créer ta première équipe', rewardCoins: 50 },
  { id: 'full_squad', title: 'Effectif complet', description: '11 joueurs sur la feuille', rewardCoins: 100 },
  { id: 'first_win', title: 'Première victoire', description: 'Gagner un match simulé', rewardCoins: 75 },
  { id: 'season_champ', title: 'Champion', description: 'Finir 1er de ta mini-saison', rewardCoins: 200 },
  { id: 'clicker_1k', title: 'Millionnaire?', description: '1000 clics au total', rewardCoins: 50 },
  { id: 'coins_10k', title: 'Riche', description: 'Accumuler 10 000 coins', rewardCoins: 100 },
] as const;

export const BASE_CLICK_REWARD = 1;
export const AUTO_CLICK_INTERVAL_MS = 400;
