/**
 * Importe les joueurs EA FC 26 (nations CDM) via https://api.msmc.cc/api/fc26
 * Aucune clé API requise.
 *
 * Usage : npm run sync:players
 * Doc   : https://api.msmc.cc/fc26/
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');
const outPath = resolve(root, 'data/fc26.players.generated.ts');

const API_BASE = 'https://api.msmc.cc/api/fc26';
const MIN_OVR = 75;
const MAX_OVR = 91;
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80';

/** Slugs nation API FC26 — sélection nations Coupe du Monde / grands pays */
const WC_NATIONS = [
  'france',
  'england',
  'spain',
  'italy',
  'germany',
  'portugal',
  'holland',
  'belgium',
  'croatia',
  'brazil',
  'argentina',
  'uruguay',
  'colombia',
  'mexico',
  'united states',
  'canada',
  'japan',
  'korea republic',
  'morocco',
  'senegal',
  'australia',
  'wales',
  'scotland',
  'republic of ireland',
  'ecuador',
  'paraguay',
  'chile',
  'poland',
  'switzerland',
  'austria',
  'denmark',
  'sweden',
  'norway',
  'serbia',
  'turkey',
  'ukraine',
  'nigeria',
  'cameroon',
  'ghana',
  'egypt',
  'algeria',
  'tunisia',
  'south africa',
  'saudi arabia',
  'iran',
  'qatar',
  'costa rica',
  'jamaica',
  'panama',
];

const FC26_POSITION_MAP = {
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

const LEAGUE_NAME_TO_LIGUE = {
  'Ligue 1': 'Ligue 1',
  'Premier League': 'Premier League',
  'La Liga': 'Liga',
  'LALIGA EA SPORTS': 'Liga',
  'Serie A': 'Serie A',
  'Serie A TIM': 'Serie A',
};

const COUNTRY_TO_LIGUE = {
  France: 'Ligue 1',
  England: 'Premier League',
  Spain: 'Liga',
  Italy: 'Serie A',
};

function mapPosition(raw) {
  if (!raw) return 'MDC';
  const code = String(raw).trim().toUpperCase();
  if (FC26_POSITION_MAP[code]) return FC26_POSITION_MAP[code];
  if (code.includes('G')) return 'GB';
  if (['CB', 'LB', 'RB', 'WB'].some((p) => code.includes(p))) return 'DC';
  if (['ST', 'LW', 'RW', 'CF'].some((p) => code.includes(p))) return 'ATT';
  return 'MDC';
}

function inferLigue(player) {
  const league = player.League?.trim();
  if (league && LEAGUE_NAME_TO_LIGUE[league]) return LEAGUE_NAME_TO_LIGUE[league];
  const nation = player.Nation?.trim() ?? '';
  return COUNTRY_TO_LIGUE[nation] ?? 'Premier League';
}

function mapPlayer(player) {
  const apiId = Number(player.ID);
  const nom = player.Name?.trim();
  if (!apiId || !nom) return null;

  const ovr = Number(player.OVR) || 0;
  if (ovr < MIN_OVR || ovr > MAX_OVR) return null;

  return {
    apiId,
    nom,
    position: mapPosition(player.Position),
    ligue: inferLigue(player),
    nationalite: player.Nation?.trim() || 'Inconnu',
    note: ovr,
    image: player.card?.trim() || FALLBACK_IMAGE,
  };
}

async function fetchNation(slug) {
  const url = `${API_BASE}/nation/${encodeURIComponent(slug)}/M`;
  const res = await fetch(url);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`HTTP ${res.status} pour nation ${slug}`);
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json;
}

function writeGenerated(players, meta) {
  const header = `/** Fichier généré — ne pas éditer à la main. Lancez \`npm run sync:players\`. */\n`;
  const body = `export const FC26_META = ${JSON.stringify(meta, null, 2)} as const;\n\nexport const FC26_PLAYERS = ${JSON.stringify(players, null, 2)} as const;\n`;
  writeFileSync(outPath, header + body, 'utf8');
}

async function main() {
  console.log(`⚽ Sync joueurs EA FC 26 (nations CDM, OVR ${MIN_OVR}–${MAX_OVR})…`);

  const all = [];
  for (const nation of WC_NATIONS) {
    await new Promise((r) => setTimeout(r, 200));
    const players = await fetchNation(nation);
    let added = 0;
    for (const raw of players) {
      const mapped = mapPlayer(raw);
      if (mapped) {
        all.push(mapped);
        added++;
      }
    }
    console.log(`   ${nation}: ${added}/${players.length} joueurs (OVR ${MIN_OVR}–${MAX_OVR})`);
  }

  const deduped = [];
  const seen = new Map();
  for (const p of all) {
    const existing = seen.get(p.apiId);
    if (!existing || p.note > existing.note) seen.set(p.apiId, p);
  }
  deduped.push(...seen.values());
  deduped.sort((a, b) => b.note - a.note || a.nom.localeCompare(b.nom, 'fr'));

  const meta = {
    source: 'api.msmc.cc/fc26',
    syncedAt: new Date().toISOString(),
    minOvr: MIN_OVR,
    maxOvr: MAX_OVR,
    nations: WC_NATIONS.length,
    count: deduped.length,
  };

  writeGenerated(deduped, meta);
  console.log(`✅ ${deduped.length} joueurs écrits dans data/fc26.players.generated.ts`);
}

main().catch((err) => {
  console.error('❌ Échec sync:', err.message || err);
  process.exit(1);
});
