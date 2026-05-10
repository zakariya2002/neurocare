# Seed annuaire externe (feature A5)

Données seed pour la table `public.external_directory_entries` :
PCO, CRA, MDPH, CAMSP.

## Statut

**Échantillon de démonstration uniquement.** Les coordonnées sont
plausibles mais ne sont pas exhaustives. Pour passer en production, il
faudra ingérer les données depuis les sources officielles :

- **PCO** : [handicap.gouv.fr — annuaire PCO TND](https://handicap.gouv.fr/les-plateformes-de-coordination-et-dorientation-pour-les-troubles-du-neuro-developpement)
- **CRA** : [GNCRA — annuaire des CRA](https://gncra.fr/le-reseau-national/annuaire-des-cra/)
- **MDPH** : [CNSA — annuaire MDPH](https://www.cnsa.fr/vous-etes-une-personne-handicapee-ou-un-proche/les-maisons-departementales-des-personnes-handicapees) ou jeu de données data.gouv.fr
- **CAMSP** : [FINESS — base nationale](https://finess.esante.gouv.fr) (catégorie 190)

Couverture seed : départements 13, 31, 33, 44, 59, 67, 69, 75, 92 + DOM.

## Format

Chaque fichier `<type>.json` est un tableau d'objets `DirectoryEntry`
(voir `lib/annuaire/types.ts`). Les champs `id`, `created_at`,
`updated_at` sont remplis par Postgres lors du seed.

## Comment seeder la base

```bash
# Idempotent — upsert sur (type, slug)
npx tsx scripts/seed-annuaire.ts
```

Variables d'env requises :
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## TODO ingestion exhaustive

1. Scraper / parser les annuaires officiels (cf. liens ci-dessus).
2. Géocoder via Nominatim (`lib/geolocation.ts`) ou base IGN BAN.
3. Pipeline cron mensuel pour rafraîchir.
4. Permettre signalement d'erreur côté famille (formulaire ou mailto).
