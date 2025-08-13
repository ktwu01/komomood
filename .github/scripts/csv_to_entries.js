/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(',');
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] || '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.max(1, Math.min(5, Math.trunc(n)));
}

function normalizeRow(row, passphraseSecret) {
  // Map possible header variations; adjust as needed if your headers differ
  const date = (row.date || row.Date || row.DATE || '').slice(0, 10);
  const kokoMood = clampScore(row.kokoMood || row.KokoMood || row.koko || row.KOKO || row.KOKO_MOOD);
  const momoMood = clampScore(row.momoMood || row.MomoMood || row.momo || row.MOMO || row.MOMO_MOOD);
  const komoScore = clampScore(row.komoScore || row.KomoScore || row.komo || row.KOMO || row.KOMO_SCORE);
  const note = (row.note || row.Note || row.NOTES || row.Notes || '').toString();

  // Optional passphrase filtering
  const pass = (row.passphrase || row.Passphrase || row.PASSPHRASE || '').trim();
  if (passphraseSecret && pass && pass !== passphraseSecret) {
    return null;
  }

  if (!date || !kokoMood || !momoMood || !komoScore) return null;

  return { date, kokoMood, momoMood, komoScore, note };
}

function latestWinsByDate(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!r) continue;
    map.set(r.date, r); // overwrite keeps latest
  }
  return Array.from(map.values())
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function main() {
  const csvPath = path.join(process.cwd(), 'data', 'sheet.csv');
  const jsonPath = path.join(process.cwd(), 'data', 'entries.json');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    process.exit(1);
  }

  const passphraseSecret = process.env.GF_PASSPHRASE || '';

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const rawRows = parseCsv(csvText);
  const normalized = rawRows.map(r => normalizeRow(r, passphraseSecret)).filter(Boolean);
  const dedupedSorted = latestWinsByDate(normalized);

  const output = JSON.stringify(dedupedSorted, null, 2);
  if (!fs.existsSync(path.dirname(jsonPath))) {
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  }
  fs.writeFileSync(jsonPath, output, 'utf8');

  console.log(`Wrote ${dedupedSorted.length} entries to ${jsonPath}`);
}

main();


