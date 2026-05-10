# Convention migrations — programme audit famille 2026

## Schémas Postgres

Le programme audit famille 2026 introduit une **séparation explicite entre
deux schémas Postgres** :

- **`public.*`** — toutes les tables existantes du projet, plus les nouvelles
  tables qui ne contiennent **pas** de données de santé (article 9 RGPD).
- **`health.*`** — tables qui stockent des observations médicales, des
  médicaments, des comportements pathologiques, des ordonnances, des
  comptes-rendus médicaux, ou tout document à caractère médical.

Ce découplage prépare la migration de `health.*` sur une infra HDS-certifiée
(Scaleway / OVH) pendant que `public.*` reste sur le Supabase général.

## Quand utiliser quel schéma

Demande-toi : *cette donnée révèle-t-elle un état de santé identifié d'une
personne ?*

| Donnée | Schema |
|---|---|
| Type TND déclaré (autisme, TDAH, dyslexie...) | déjà dans `public` (existant) |
| Statut MDPH (ouvert / fermé / en cours) | `public` (admin, pas médical) |
| Numéro AEEH, dates de droits | `public` (admin) |
| Métadonnées scolarité (école, AESH, dispositif) | `public` |
| Coordonnées d'une école / d'un médecin référent | `public` |
| Observation comportementale quotidienne (crise, automutilation...) | **`health`** |
| Médicaments pris (nom, dose, heure) | **`health`** |
| Compte-rendu d'orthophonie / de psychomot | **`health`** |
| Notif MDPH (PDF) avec contenu médical | **`health`** |
| Ordonnance | **`health`** |
| GEVA-Sco scanné (contient handicap reconnu) | **`health`** |
| Observation parentale "humeur", "fatigue", "stress" | **`health`** |

En cas de doute, opter pour `health` (plus sûr).

## Format des fichiers

Convention de nommage existante : `<YYYYMMDD>_<short_name>.sql`.

**Pour les migrations HDS, préfixer `health_`** :

```
20260512_school_year.sql            ← public.*
20260512_health_daily_logs.sql      ← health.*
```

Chaque migration `health_*` commence par :

```sql
-- HDS-required: contains health data (article 9 RGPD)
-- This schema must reside on an HDS-certified host before production rollout.

create schema if not exists health;
```

## RLS

RLS toujours activé sur toutes les nouvelles tables. Les politiques sont
définies dans la migration. Pour `health.*`, écrire les politiques au même
endroit que la définition de la table — elles seront répliquées telles
quelles sur l'infra HDS lors de la bascule.

## Types TypeScript

Les types DB générés via `supabase gen types` doivent inclure les deux
schémas. Voir `package.json` pour la commande, et regénérer après chaque
nouvelle migration.
