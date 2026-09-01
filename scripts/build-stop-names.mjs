/**
 * Regenerates data/*-stops.json from the MTA static GTFS bundles.
 *
 * The realtime feeds only carry stop IDs, so these lookups are what let us name
 * a trip's terminal ("Inwood-207 St", "Williamsburg Bridge Plaza"). Re-run when
 * the MTA publishes a new schedule:  node scripts/build-stop-names.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUS_ROUTES = new Set(['B44', 'B44+', 'B26']);

const SOURCES = {
  bus: 'http://web.mta.info/developers/data/nyct/bus/google_transit_brooklyn.zip',
  subway: 'http://web.mta.info/developers/data/nyct/subway/google_transit.zip',
};

function parseCsv(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  const headers = splitLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const cells = splitLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] ?? ''));
    rows.push(row);
  }
  return rows;
}

function splitLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function download(url) {
  const dir = mkdtempSync(join(tmpdir(), 'gtfs-'));
  const zip = join(dir, 'feed.zip');
  execFileSync('curl', ['-sSL', '-o', zip, url]);
  execFileSync('unzip', ['-o', '-q', zip, '-d', dir]);
  return dir;
}

function titleCase(name) {
  return name
    .toLowerCase()
    .split(/(\s|\/|-)/)
    .map((part) => (/^[a-z]/.test(part) ? part[0].toUpperCase() + part.slice(1) : part))
    .join('')
    .replace(/\bAv\b/g, 'Av')
    .replace(/\bSt\b/g, 'St');
}

console.log('Downloading subway GTFS…');
const subwayDir = download(SOURCES.subway);
const subwayStops = {};
for (const s of parseCsv(readFileSync(join(subwayDir, 'stops.txt'), 'utf8'))) {
  subwayStops[s.stop_id] = s.stop_name;
}

console.log('Downloading Brooklyn bus GTFS…');
const busDir = download(SOURCES.bus);
const busTripIds = new Set();
for (const t of parseCsv(readFileSync(join(busDir, 'trips.txt'), 'utf8'))) {
  if (BUS_ROUTES.has(t.route_id)) busTripIds.add(t.trip_id);
}
const usedStopIds = new Set();
for (const st of parseCsv(readFileSync(join(busDir, 'stop_times.txt'), 'utf8'))) {
  if (busTripIds.has(st.trip_id)) usedStopIds.add(st.stop_id);
}
const busStops = {};
for (const s of parseCsv(readFileSync(join(busDir, 'stops.txt'), 'utf8'))) {
  if (usedStopIds.has(s.stop_id)) busStops[s.stop_id] = titleCase(s.stop_name);
}

mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(join(ROOT, 'data/subway-stops.json'), JSON.stringify(subwayStops, null, 0) + '\n');
writeFileSync(join(ROOT, 'data/bus-stops.json'), JSON.stringify(busStops, null, 0) + '\n');

console.log(`Wrote ${Object.keys(subwayStops).length} subway stops, ${Object.keys(busStops).length} bus stops.`);
