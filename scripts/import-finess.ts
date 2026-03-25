/**
 * Script d'import des données FINESS pour les structures TND
 *
 * Le CSV FINESS n'a PAS de vrais headers — les champs sont positionnels :
 *   [1] type_ligne  [2] finess_et  [3] finess_ej  [4] rs_court  [5] rs_long
 *   [6] complrs     [7] compldistrib [8] numvoie    [9] typvoie   [10] voie
 *   [11] compvoie   [12] lieuditbp  [13] commune    [14] dept_code [15] dept_lib
 *   [16] ligneacheminement (code postal + ville)
 *   [17] telephone  [18] fax        [19] categetab  [20] libcategetab
 *   [21] categagregetab [22] libcategagregetab
 *
 * Usage : npx tsx scripts/import-finess.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const FINESS_CSV_URL = 'https://www.data.gouv.fr/fr/datasets/r/98f3161f-79ff-4f16-8f6a-6d571a80fea2';
const LOCAL_CSV_PATH = path.join(__dirname, '..', 'data', 'finess-geo.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'structures-tnd.json');

// ─── Codes catégorie FINESS (champ index 19) ───
const FINESS_CATEGORIES: Record<string, string> = {
  '156': 'CMP',
  '182': 'SESSAD',
  '189': 'CMPP',
  '190': 'CAMSP',
};

// ─── Mapping département → région ───
const DEPT_TO_REGION: Record<string, string> = {
  '01': 'Auvergne-Rhône-Alpes', '03': 'Auvergne-Rhône-Alpes', '07': 'Auvergne-Rhône-Alpes',
  '15': 'Auvergne-Rhône-Alpes', '26': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes',
  '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes', '63': 'Auvergne-Rhône-Alpes',
  '69': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes', '74': 'Auvergne-Rhône-Alpes',
  '21': 'Bourgogne-Franche-Comté', '25': 'Bourgogne-Franche-Comté', '39': 'Bourgogne-Franche-Comté',
  '58': 'Bourgogne-Franche-Comté', '70': 'Bourgogne-Franche-Comté', '71': 'Bourgogne-Franche-Comté',
  '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
  '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
  '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire',
  '37': 'Centre-Val de Loire', '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
  '2A': 'Corse', '2B': 'Corse',
  '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est',
  '54': 'Grand Est', '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est',
  '68': 'Grand Est', '88': 'Grand Est',
  '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France',
  '62': 'Hauts-de-France', '80': 'Hauts-de-France',
  '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
  '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
  '94': 'Île-de-France', '95': 'Île-de-France',
  '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
  '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine',
  '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine',
  '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
  '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
  '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie',
  '31': 'Occitanie', '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie',
  '48': 'Occitanie', '65': 'Occitanie', '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
  '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire',
  '72': 'Pays de la Loire', '85': 'Pays de la Loire',
  '04': 'Provence-Alpes-Côte d\'Azur', '05': 'Provence-Alpes-Côte d\'Azur',
  '06': 'Provence-Alpes-Côte d\'Azur', '13': 'Provence-Alpes-Côte d\'Azur',
  '83': 'Provence-Alpes-Côte d\'Azur', '84': 'Provence-Alpes-Côte d\'Azur',
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
  '974': 'La Réunion', '976': 'Mayotte',
};

interface StructureTND {
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

function clean(s: string): string {
  return s?.trim().replace(/\s+/g, ' ') || '';
}

function formatPhone(tel: string): string | null {
  const cleaned = tel.replace(/\D/g, '');
  if (cleaned.length !== 10) return null;
  return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}

function extractCodePostalVille(ligne: string): { cp: string; ville: string } {
  // Format: "01500 AMBERIEU EN BUGEY" ou "75012 PARIS"
  const match = ligne.match(/^(\d{5})\s+(.+)/);
  if (match) return { cp: match[1], ville: clean(match[2]) };
  return { cp: '', ville: clean(ligne) };
}

async function downloadCSV(): Promise<string> {
  if (fs.existsSync(LOCAL_CSV_PATH)) {
    console.log(`📄 Fichier local trouvé : ${LOCAL_CSV_PATH}`);
    return fs.readFileSync(LOCAL_CSV_PATH, 'utf-8');
  }

  console.log(`⬇️  Téléchargement du CSV FINESS...`);
  const response = await fetch(FINESS_CSV_URL, {
    headers: { 'User-Agent': 'NeuroCare-Import/1.0' },
    redirect: 'follow',
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  fs.writeFileSync(LOCAL_CSV_PATH, text, 'utf-8');
  console.log(`💾 Sauvegardé (${(text.length / 1024 / 1024).toFixed(1)} MB)`);
  return text;
}

function parseCSV(csv: string): StructureTND[] {
  const lines = csv.split('\n');
  console.log(`🔍 ${lines.length} lignes au total`);

  const structures: StructureTND[] = [];
  const categoryCodes = Object.keys(FINESS_CATEGORIES);

  for (let i = 1; i < lines.length; i++) { // Skip header line
    const fields = lines[i].split(';');
    if (fields.length < 20) continue;

    // Indices 0-based: categetab = index 18 (position 19)
    const catCode = clean(fields[18]);
    if (!categoryCodes.includes(catCode)) continue;

    const finessNum = clean(fields[1]);
    const nomCourt = clean(fields[3]);
    const nomLong = clean(fields[4]);
    const numvoie = clean(fields[7]);
    const typvoie = clean(fields[8]);
    const voie = clean(fields[9]);
    const deptCode = clean(fields[13]);
    const ligneAch = clean(fields[15]);
    const telephone = clean(fields[16]);

    const { cp, ville } = extractCodePostalVille(ligneAch);
    const adresseParts = [numvoie, typvoie, voie].filter(Boolean).join(' ');

    // Département → Région
    let dept = deptCode;
    if (dept.length === 1) dept = '0' + dept;
    // Corse
    if (dept === '20') {
      const cpNum = parseInt(cp.substring(0, 3));
      dept = cpNum >= 201 && cpNum <= 209 ? '2A' : '2B';
    }
    const region = DEPT_TO_REGION[dept] || 'Autre';

    const structure: StructureTND = {
      id: `finess-${finessNum}`,
      finess: finessNum,
      nom: nomCourt || nomLong,
      type: FINESS_CATEGORIES[catCode],
      type_code: catCode,
      adresse: adresseParts,
      code_postal: cp,
      ville,
      departement: dept,
      region,
      telephone: formatPhone(telephone),
      lat: null,
      lng: null,
      source: 'FINESS',
    };

    if (structure.nom && structure.ville) {
      structures.push(structure);
    }
  }

  return structures;
}

function mergeCRA(structures: StructureTND[]): StructureTND[] {
  const craPath = path.join(__dirname, '..', 'data', 'cra-manual.json');
  if (!fs.existsSync(craPath)) {
    console.log(`⚠️  Fichier CRA non trouvé`);
    return structures;
  }
  const craData: StructureTND[] = JSON.parse(fs.readFileSync(craPath, 'utf-8'));
  console.log(`🧩 + ${craData.length} CRA (GNCRA)`);
  return [...structures, ...craData];
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Import FINESS → structures TND');
  console.log('═══════════════════════════════════════\n');

  const csv = await downloadCSV();
  let structures = parseCSV(csv);

  // Stats
  const byType: Record<string, number> = {};
  for (const s of structures) byType[s.type] = (byType[s.type] || 0) + 1;
  console.log(`\n✅ ${structures.length} structures FINESS :`);
  for (const [t, c] of Object.entries(byType).sort()) console.log(`   ${t}: ${c}`);

  structures = mergeCRA(structures);
  structures.sort((a, b) => a.region.localeCompare(b.region) || a.ville.localeCompare(b.ville));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(structures, null, 2), 'utf-8');
  const sizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n💾 ${OUTPUT_PATH} (${sizeMB} MB)`);
  console.log(`   Total : ${structures.length} structures`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
