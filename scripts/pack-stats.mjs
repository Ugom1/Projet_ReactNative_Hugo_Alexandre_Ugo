/**
 * Affiche les stats de tirage par pack (tranches de notes + effectifs joueurs).
 * Usage : npm run pack:stats
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const playersPath = resolve(__dir, '../data/fc26.players.generated.ts');

const NOTE_BRACKETS = [
  { id: '75-79', min: 75, max: 79 },
  { id: '80-82', min: 80, max: 82 },
  { id: '83-85', min: 83, max: 85 },
  { id: '86-87', min: 86, max: 87 },
  { id: '88-89', min: 88, max: 89 },
  { id: '90-91', min: 90, max: 91 },
];

const PACK_NOTE_ODDS = {
  bronze: { '75-79': 50, '80-82': 30, '83-85': 10, '86-87': 5, '88-89': 3, '90-91': 2 },
  argent: { '75-79': 30, '80-82': 35, '83-85': 20, '86-87': 10, '88-89': 3, '90-91': 2 },
  or: { '75-79': 10, '80-82': 30, '83-85': 30, '86-87': 20, '88-89': 7, '90-91': 3 },
  elite: { '75-79': 2, '80-82': 8, '83-85': 20, '86-87': 25, '88-89': 25, '90-91': 20 },
};

const PACK_LABELS = {
  bronze: 'Pack Bronze',
  argent: 'Pack Argent',
  or: 'Pack Or',
  elite: 'Pack Élite',
};

function loadPlayers() {
  const raw = readFileSync(playersPath, 'utf8');
  const match = raw.match(/export const FC26_PLAYERS = (\[[\s\S]*?\]) as const;/);
  if (!match) throw new Error('Impossible de lire FC26_PLAYERS — lancez npm run sync:players');
  const list = JSON.parse(match[1]);
  return list.map((p) => ({ ...p, note: p.note ?? p.ovr }));
}

function bracketOf(note) {
  for (const b of NOTE_BRACKETS) {
    if (note >= b.min && note <= b.max) return b.id;
  }
  return null;
}

function countByBracket(players) {
  const counts = Object.fromEntries(NOTE_BRACKETS.map((b) => [b.id, 0]));
  let outside = 0;
  for (const p of players) {
    const id = bracketOf(p.note);
    if (id) counts[id]++;
    else outside++;
  }
  return { counts, outside };
}

function simulate(packId, players, runs = 20_000) {
  const pool = players.filter((p) => bracketOf(p.note));
  const bracketHits = Object.fromEntries(NOTE_BRACKETS.map((b) => [b.id, 0]));
  const noteHits = {};

  for (let i = 0; i < runs; i++) {
    const roll = Math.random() * 100;
    let acc = 0;
    let bracketId = NOTE_BRACKETS.at(-1).id;
    for (const b of NOTE_BRACKETS) {
      acc += PACK_NOTE_ODDS[packId][b.id];
      if (roll < acc) {
        bracketId = b.id;
        break;
      }
    }
    bracketHits[bracketId]++;
    const b = NOTE_BRACKETS.find((x) => x.id === bracketId);
    const candidates = pool.filter((p) => p.note >= b.min && p.note <= b.max);
    if (!candidates.length) continue;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    noteHits[picked.note] = (noteHits[picked.note] ?? 0) + 1;
  }

  return { bracketHits, noteHits, runs };
}

function pad(str, len) {
  return String(str).padEnd(len);
}

function padNum(n, len) {
  return String(n).padStart(len);
}

const players = loadPlayers();
const { counts, outside } = countByBracket(players);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  DTM — Stats de tirage par pack (notes fixes par joueur)');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Pool total : ${players.length} joueurs (${outside} hors tranches 75-91, non tirables)\n`);

console.log('── Effectif par tranche de note (note permanente du joueur) ──\n');
console.log(`${pad('Tranche', 10)} ${pad('Joueurs', 10)}`);
for (const b of NOTE_BRACKETS) {
  console.log(`${pad(b.id, 10)} ${padNum(counts[b.id], 10)}`);
}
if (outside) console.log(`${pad('(<75 ou >91)', 10)} ${padNum(outside, 10)}`);

console.log('\n── Probabilités de tranche par pack (config) ──\n');
const header = `${pad('Note', 10)} ${pad('Bronze', 10)} ${pad('Argent', 10)} ${pad('Or', 10)} ${pad('Elite', 10)} ${pad('Joueurs', 10)}`;
console.log(header);
console.log('-'.repeat(header.length));
for (const b of NOTE_BRACKETS) {
  console.log(
    `${pad(b.id, 10)} ${padNum(PACK_NOTE_ODDS.bronze[b.id] + '%', 10)} ${padNum(PACK_NOTE_ODDS.argent[b.id] + '%', 10)} ${padNum(PACK_NOTE_ODDS.or[b.id] + '%', 10)} ${padNum(PACK_NOTE_ODDS.elite[b.id] + '%', 10)} ${padNum(counts[b.id], 10)}`
  );
}

console.log('\n── Probabilité effective par tranche (simulation 20 000 packs) ──\n');

for (const packId of Object.keys(PACK_LABELS)) {
  const { bracketHits, runs } = simulate(packId, players);
  console.log(`\n${PACK_LABELS[packId]} (${packId})`);
  for (const b of NOTE_BRACKETS) {
    const pct = ((bracketHits[b.id] / runs) * 100).toFixed(1);
    const config = PACK_NOTE_ODDS[packId][b.id];
    const perPlayer =
      counts[b.id] > 0 ? ((bracketHits[b.id] / runs / counts[b.id]) * 100).toFixed(3) : '—';
    console.log(
      `  ${pad(b.id, 8)} config ${padNum(config + '%', 5)} → simulé ${padNum(pct + '%', 6)} | ~${perPlayer}% par joueur (${counts[b.id]} dans la tranche)`
    );
  }
}

console.log('\n── Note moyenne simulée par pack ──\n');
for (const packId of Object.keys(PACK_LABELS)) {
  const { noteHits, runs } = simulate(packId, players);
  let sum = 0;
  let total = 0;
  for (const [note, hits] of Object.entries(noteHits)) {
    sum += Number(note) * hits;
    total += hits;
  }
  const avg = total ? (sum / total).toFixed(2) : '—';
  console.log(`  ${PACK_LABELS[packId]} : note moyenne ≈ ${avg}`);
}

console.log('\n── Fonctionnement ──');
console.log('  1. Tirage d\'une tranche selon les % du pack');
console.log('  2. Joueur aléatoire parmi ceux dont la note fixe est dans la tranche');
console.log('  3. La note affichée = note permanente du joueur (ne change jamais)\n');
