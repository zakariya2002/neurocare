# Programme audit famille 2026 — guide de développement

Ce document briefe les développeurs (humains et agents Claude) qui contribuent
au programme d'audit famille 2026 sur la branche `feat/audit-famille-2026`.

## Contexte business

Plusieurs nouvelles features sont développées en parallèle pour le côté famille.
Certaines manipulent des données de santé (au sens article 9 RGPD) et ne peuvent
être activées en production qu'après migration de l'infra sur un hébergeur HDS
certifié (Scaleway / OVH). En attendant, on développe en local et sur staging
avec des données fictives, derrière des feature flags.

## Conventions transverses

### 1. Feature flags

Tous les chantiers du programme sont gardés derrière des flags définis dans
`lib/feature-flags.ts`. Avant d'afficher un lien de nav ou de répondre à une
route API liée à un nouveau chantier, **toujours vérifier** :

```ts
import { FEATURES } from '@/lib/feature-flags';

if (!FEATURES.journalBord) {
  return notFound(); // ou rediriger
}
```

Liste actuelle :
- `onboardingPostDiag` (A1, non-HDS, ON par défaut)
- `rappelsMdph` (A2, non-HDS, ON par défaut)
- `courriersAdmin` (A3, non-HDS, ON par défaut)
- `justificatifsAnnuels` (A4, non-HDS, ON par défaut)
- `annuaireExterne` (A5, non-HDS, ON par défaut)
- `scolarite` (B3', non-HDS, ON par défaut)
- `journalBord` (B1, **HDS-sensible, OFF par défaut**)
- `coffreFortSante` (B2, **HDS-sensible, OFF par défaut**)

### 2. Données de santé : schema `health.*`

Toute table qui stocke des données relevant de l'article 9 RGPD (observations
comportementales, médicaments, comptes-rendus médicaux, ordonnances, notif
MDPH médicales, etc.) **doit être créée dans le schema `health.*`** et accédée
via les clients dédiés :

- Côté browser : `import { supabaseHealth } from '@/lib/supabase-health';`
- Côté server : `createServerSupabaseHealth({ cookieStore })` depuis
  `@/lib/supabase-server-helpers`.

Les tables non-santé (admin, scolarité métadonnées, contenus publics)
restent dans le schema `public` et utilisent le client habituel
(`@/lib/supabase` ou `createServerSupabasePublic`).

### 3. Migrations

Convention de nommage : `supabase/migrations/<YYYYMMDD>_<short_name>.sql`
(format existant). Pour les tables HDS-sensibles, **préfixer le nom du
fichier** par `health_` :

- `20260512_health_daily_logs.sql` ← schema `health.*`
- `20260512_school_year.sql` ← schema `public`

Chaque migration HDS doit en-tête le commentaire :
```sql
-- HDS-required: contains health data (article 9 RGPD)
-- This table must reside on an HDS-certified host before production rollout.
```

### 4. Variables d'environnement

Quatre variables sont disponibles côté infra HDS (toutes optionnelles en local
— fallback sur le Supabase général) :

```
NEXT_PUBLIC_SUPABASE_HDS_URL=
NEXT_PUBLIC_SUPABASE_HDS_PUBLISHABLE_KEY=
SUPABASE_HDS_SECRET_KEY=
NEXT_PUBLIC_FEATURE_JOURNAL_BORD=true   # opt-in HDS
NEXT_PUBLIC_FEATURE_COFFRE_FORT_SANTE=true
```

### 5. Style de code

Suivre les conventions existantes :
- TypeScript strict, App Router Next.js, Tailwind, shadcn/ui (s'il est utilisé,
  sinon composants HTML + Tailwind direct).
- Copy en français (audience cible).
- Pas de commentaires explicatifs superflus dans le code.
- Émojis interdits sauf demande explicite.

### 6. Périmètres exclusifs entre agents

Pour éviter les conflits, chaque agent travaille dans son sous-dossier dédié
(`app/dashboard/family/<feature>/`, `app/api/<feature>/`, etc.) et **ne touche
pas** aux fichiers transverses suivants — qui sont mergés par l'orchestrateur :

- `app/dashboard/family/layout.tsx` (nav menu)
- `types/index.ts` et `types/scheduling.ts` (types globaux)
- `lib/supabase.ts`, `lib/feature-flags.ts`, `lib/supabase-health.ts`,
  `lib/supabase-server-helpers.ts`
- `middleware.ts`
- `next.config.js`, `tailwind.config.js`

Si un changement transverse est nécessaire, l'agent **propose un patch dans
son rapport final** et l'orchestrateur l'applique.

### 7. Tests

Tests Jest si présents dans le périmètre touché. Sinon, le minimum est :
- TypeScript compile (`npx tsc --noEmit`).
- Build Next.js OK (`npm run build` si l'agent peut, sinon laissez à
  l'orchestrateur).

### 8. RLS et sécurité

Toute nouvelle table doit avoir RLS activé. Les politiques doivent être
écrites dans la migration. Pour les tables `health.*`, RLS s'applique aussi —
l'isolation HDS s'ajoute en plus, pas à la place.
