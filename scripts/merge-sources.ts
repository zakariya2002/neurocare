/**
 * Fusionne toutes les sources de données TND en un seul JSON
 *
 * Sources :
 * - data/structures-tnd.json (FINESS + CRA, déjà géocodé)
 * - data/handiconsult-manual.json
 * - data/pco-manual.json
 * - data/handident-manual.json
 *
 * Dédoublonnage sur nom + code_postal
 * Géocodage des nouvelles entrées sans coordonnées
 *
 * Usage : npx tsx scripts/merge-sources.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT = path.join(DATA_DIR, 'structures-tnd.json');

interface Structure {
  id: string;
  finess: string;
  nom: string;
  type: string;
  type_code: string;
  adresse: string;
  code_postal: string;
  ville: string;
  departement: string;
  region: string;
  telephone: string | null;
  lat: number | null;
  lng: number | null;
  source: string;
}

// Cache pour le géocodage
const geoCache: Record<string, { lat: number; lng: number } | null> = {};

async function geocode(cp: string, ville: string): Promise<{ lat: number; lng: number } | null> {
  const key = `${cp}-${ville}`;
  if (geoCache[key] !== undefined) return geoCache[key];

  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(ville)}&postcode=${cp}&limit=1&type=municipality`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      geoCache[key] = { lat, lng };
      return geoCache[key];
    }
    // Fallback : juste le code postal
    const res2 = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${cp}&limit=1`);
    const data2 = await res2.json();
    if (data2.features?.length > 0) {
      const [lng, lat] = data2.features[0].geometry.coordinates;
      geoCache[key] = { lat, lng };
      return geoCache[key];
    }
  } catch {}
  geoCache[key] = null;
  return null;
}

function loadJSON(filename: string): Structure[] {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠️  ${filename} non trouvé, ignoré`);
    return [];
  }
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  console.log(`  ✅ ${filename} : ${data.length} entrées`);
  return data;
}

function dedup(structures: Structure[]): Structure[] {
  const seen = new Set<string>();
  const result: Structure[] = [];
  for (const s of structures) {
    // Clé de dédup : nom normalisé + code postal
    const key = `${s.nom.toLowerCase().trim()}-${s.code_postal}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(s);
  }
  return result;
}

async function geocodeNew(structures: Structure[]): Promise<void> {
  const toGeocode = structures.filter(s => !s.lat || !s.lng);
  if (toGeocode.length === 0) return;

  console.log(`\n📍 Géocodage de ${toGeocode.length} nouvelles entrées...`);
  let ok = 0;

  const BATCH = 10;
  for (let i = 0; i < toGeocode.length; i += BATCH) {
    const batch = toGeocode.slice(i, i + BATCH);
    await Promise.all(batch.map(async (s) => {
      if (!s.code_postal && !s.ville) return;
      const coords = await geocode(s.code_postal, s.ville);
      if (coords) { s.lat = coords.lat; s.lng = coords.lng; ok++; }
    }));
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`   ${ok}/${toGeocode.length} géocodés`);
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Fusion des sources TND');
  console.log('═══════════════════════════════════════\n');

  console.log('📂 Chargement des fichiers :');
  const existing = loadJSON('structures-tnd.json');
  const handiconsult = loadJSON('handiconsult-manual.json');
  const pco = loadJSON('pco-manual.json');
  const handident = loadJSON('handident-manual.json');

  // Fusionner : existants + nouvelles sources
  const all = [...existing, ...handiconsult, ...pco, ...handident];
  console.log(`\n📊 Total brut : ${all.length}`);

  const deduped = dedup(all);
  console.log(`   Après dédoublonnage : ${deduped.length}`);

  // Géocoder les nouvelles entrées
  await geocodeNew(deduped);

  // Trier par région puis ville
  deduped.sort((a, b) => a.region.localeCompare(b.region) || a.ville.localeCompare(b.ville));

  // Stats par type
  const byType: Record<string, number> = {};
  for (const s of deduped) byType[s.type] = (byType[s.type] || 0) + 1;
  console.log('\n📊 Par type :');
  for (const [t, c] of Object.entries(byType).sort()) console.log(`   ${t}: ${c}`);

  // Sauvegarder
  fs.writeFileSync(OUTPUT, JSON.stringify(deduped, null, 2), 'utf-8');
  const mb = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(2);
  console.log(`\n💾 ${OUTPUT} (${mb} MB)`);
  console.log(`   Total : ${deduped.length} structures`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
