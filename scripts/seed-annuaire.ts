/**
 * Seed `public.external_directory_entries` à partir des fichiers
 * `data/annuaire/*.json`. Idempotent — upsert sur (type, slug).
 *
 * Usage :
 *   npx tsx scripts/seed-annuaire.ts
 *
 * Variables d'env requises :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Note : ce script utilise la SERVICE_ROLE_KEY pour bypass RLS — à exécuter
 * uniquement depuis un environnement de confiance (machine dev / CI).
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Erreur : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.'
  );
  process.exit(1);
}

const TYPES = ['pco', 'cra', 'mdph', 'camsp'] as const;
type DirectoryType = typeof TYPES[number];

interface SeedEntry {
  id?: string; // ignoré au seed (UUID auto)
  type: DirectoryType;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  department_code?: string | null;
  region_code?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source_label?: string | null;
  source_url?: string | null;
  is_published?: boolean;
}

async function main() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false },
  });

  const seedDir = path.join(__dirname, '..', 'data', 'annuaire');
  const stats: Record<DirectoryType, { read: number; upserted: number; failed: number }> = {
    pco: { read: 0, upserted: 0, failed: 0 },
    cra: { read: 0, upserted: 0, failed: 0 },
    mdph: { read: 0, upserted: 0, failed: 0 },
    camsp: { read: 0, upserted: 0, failed: 0 },
  };

  for (const type of TYPES) {
    const filePath = path.join(seedDir, `${type}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[skip] ${filePath} introuvable.`);
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const entries = JSON.parse(raw) as SeedEntry[];
    stats[type].read = entries.length;

    for (const e of entries) {
      const { id: _ignore, ...payload } = e;
      const row = {
        ...payload,
        type,
        is_published: payload.is_published !== false,
      };

      const { error } = await supabase
        .from('external_directory_entries')
        .upsert(row, { onConflict: 'type,slug' });

      if (error) {
        stats[type].failed++;
        console.error(`[fail] ${type}/${e.slug} : ${error.message}`);
      } else {
        stats[type].upserted++;
      }
    }
  }

  console.log('\n— Résumé seed annuaire externe —');
  for (const type of TYPES) {
    const s = stats[type];
    console.log(
      `  ${type.padEnd(6)} : lus ${s.read}, upserted ${s.upserted}, en erreur ${s.failed}`
    );
  }

  const totalFailed = TYPES.reduce((a, t) => a + stats[t].failed, 0);
  process.exit(totalFailed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
