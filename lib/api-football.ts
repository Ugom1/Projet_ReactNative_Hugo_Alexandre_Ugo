import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_FOOTBALL_BASE, API_FOOTBALL_KEY, CURRENT_SEASON } from './constants';
import { playerPrice } from './formations';

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

type ApiTeam = { team: { id: number; name: string; logo: string } };
type ApiPlayer = {
  id: number;
  name: string;
  photo: string;
  position: string;
  rating?: string;
};

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_FOOTBALL_BASE}${path}`, {
    headers: { 'x-apisports-key': API_FOOTBALL_KEY },
  });
  if (!res.ok) throw new Error(`API Football: ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.response as T;
}

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw) {
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (Date.now() - parsed.at < CACHE_TTL_MS) return parsed.data;
  }
  const data = await fetcher();
  await AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  return data;
}

export type MarketPlayer = {
  apiPlayerId: number;
  name: string;
  photo: string;
  position: string;
  rating: number;
  price: number;
  teamName: string;
};

export async function fetchLeagueTeams(leagueId: number) {
  return cached(`teams_${leagueId}_${CURRENT_SEASON}`, () =>
    apiFetch<ApiTeam[]>(`/teams?league=${leagueId}&season=${CURRENT_SEASON}`)
  );
}

export async function fetchTeamSquad(teamId: number, teamName: string): Promise<MarketPlayer[]> {
  return cached(`squad_${teamId}_${CURRENT_SEASON}`, async () => {
    const squads = await apiFetch<
      { team: { id: number }; players: ApiPlayer[] }[]
    >(`/players/squads?team=${teamId}`);
    const players = squads[0]?.players ?? [];
    return players.map((p) => {
      const rating = Number(p.rating ?? 70) || 70;
      return {
        apiPlayerId: p.id,
        name: p.name,
        photo: p.photo || '',
        position: p.position || 'M',
        rating,
        price: playerPrice(rating),
        teamName,
      };
    });
  });
}

export async function preloadLeaguePlayers(leagueId: number, maxTeams = 6) {
  const teams = await fetchLeagueTeams(leagueId);
  const slice = teams.slice(0, maxTeams);
  for (const t of slice) {
    await fetchTeamSquad(t.team.id, t.team.name);
  }
  return slice.length;
}
