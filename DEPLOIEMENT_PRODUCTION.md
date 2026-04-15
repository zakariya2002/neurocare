> ⚠️ **DOCUMENT ARCHIVÉ — NE PAS UTILISER COMME RÉFÉRENCE**
>
> Ce document décrit un modèle d'abonnement (29€/mois, offres Pro mensuelle/annuelle) qui **n'existe plus**.
> **Modèle actuel (2026)** : plateforme 100% gratuite pour les professionnels, avec une commission de 12% prélevée uniquement sur les rendez-vous réservés via Stripe Connect.
> Conservé pour archives historiques uniquement.

---

## Modèle actuel

Seuls les événements Stripe `payment_intent.*` et `charge.*` sont utilisés aujourd'hui pour gérer les paiements des rendez-vous et le prélèvement de la commission de 12% via Stripe Connect.
Les événements liés aux abonnements (`customer.subscription.*`, `invoice.*`) ne sont plus traités.
Toute la section abonnement ci-dessous est **obsolète** et conservée uniquement à titre historique.

---

# 🚀 Guide de déploiement en PRODUCTION sur neuro-care.fr

## 📋 Checklist avant le déploiement

- [ ] Compte Stripe activé et vérifié
- [ ] Coordonnées bancaires ajoutées sur Stripe
- [ ] Tables Supabase créées (exécuter `supabase-subscriptions.sql`)
- [ ] Site déployé sur Vercel

## Étape 1️⃣ : Activer votre compte Stripe en PRODUCTION

### 1.1 Activer le compte Stripe
1. Aller sur https://dashboard.stripe.com
2. Cliquer sur "Activer votre compte" (en haut à droite)
3. Remplir les informations requises :
   - **Informations entreprise** : Nom, type d'activité, adresse
   - **Coordonnées personnelles** : Identité du représentant légal
   - **Informations bancaires** : IBAN pour recevoir les paiements
   - **Vérification d'identité** : Document d'identité

### 1.2 Récupérer les clés API de PRODUCTION
1. Aller sur https://dashboard.stripe.com/apikeys
2. **IMPORTANT** : Basculer en mode **LIVE** (toggle en haut à droite)
3. Copier les clés suivantes :

```
Publishable key: pk_live_[VOTRE_CLE_PUBLIQUE]
Secret key: sk_live_[VOTRE_CLE_SECRETE] (cliquer sur "Reveal live key")
```

⚠️ **ATTENTION** : Ne JAMAIS partager la Secret key !

## Étape 2️⃣ : Configurer le Webhook Stripe

### 2.1 Créer l'endpoint webhook
1. Aller sur https://dashboard.stripe.com/webhooks
2. S'assurer d'être en mode **LIVE**
3. Cliquer sur "Add endpoint"
4. Remplir :
   - **Endpoint URL** : `https://www.neuro-care.fr/api/webhooks/stripe`
   - **Description** : Webhooks NeuroCare Production

### 2.2 Sélectionner les événements
Cocher les événements suivants :
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### 2.3 Récupérer le Signing Secret
1. Cliquer sur "Add endpoint"
2. Cliquer sur l'endpoint nouvellement créé
3. Dans la section "Signing secret", cliquer sur "Reveal"
4. Copier le secret (commence par `whsec_...`)

```
Signing secret: whsec_[VOTRE_SIGNING_SECRET]
```

## Étape 3️⃣ : Configurer les variables d'environnement sur Vercel

### 3.1 Accéder aux paramètres Vercel
1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet **neuro-care**
3. Aller dans **Settings** → **Environment Variables**

### 3.2 Ajouter/Mettre à jour les variables suivantes

**Pour l'environnement Production uniquement** :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `STRIPE_SECRET_KEY` | Votre Secret Key LIVE | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Votre Publishable Key LIVE | Production |
| `STRIPE_WEBHOOK_SECRET` | Votre Webhook Signing Secret | Production |
| `NEXT_PUBLIC_APP_URL` | `https://www.neuro-care.fr` | Production |

**Variables Supabase** (déjà configurées normalement) :
| Variable | Environnement |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Production |

### 3.3 Redéployer l'application
Après avoir ajouté les variables :
1. Aller dans l'onglet **Deployments**
2. Cliquer sur les 3 points (...) du dernier déploiement
3. Cliquer sur **Redeploy**
4. Cocher "Use existing Build Cache"
5. Cliquer sur **Redeploy**

## Étape 4️⃣ : Vérifier les tables Supabase

### 4.1 Vérifier que les tables existent
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **Table Editor**
4. Vérifier que ces tables existent :
   - ✅ `subscriptions`
   - ✅ `payment_transactions`

### 4.2 Si les tables n'existent pas
1. Aller dans **SQL Editor**
2. Copier le contenu du fichier `supabase-subscriptions.sql`
3. Coller et exécuter le SQL

## Étape 5️⃣ : Tester le système de paiement

### 5.1 Test avec une vraie carte (mode LIVE)
⚠️ **ATTENTION** : En mode LIVE, les paiements sont RÉELS !

1. Aller sur https://www.neuro-care.fr/pricing
2. Cliquer sur "Commencer gratuitement"
3. Créer un compte éducateur (ou se connecter)
4. Remplir avec une VRAIE carte bancaire
5. **IMPORTANT** : Annuler immédiatement l'abonnement si c'est un test !

### 5.2 Annuler un abonnement de test
1. Dashboard Stripe → Customers
2. Trouver le client
3. Cliquer sur l'abonnement
4. Cliquer sur "Cancel subscription"

### 5.3 Vérifier les webhooks
1. Dashboard Stripe → Developers → Webhooks
2. Cliquer sur votre endpoint
3. Vérifier dans "Recent deliveries" que les événements arrivent bien
4. Statut attendu : **200 OK** ✅

## Étape 6️⃣ : Monitoring et vérifications

### 6.1 Vérifier les logs Vercel
1. Vercel Dashboard → Votre projet → Logs
2. Rechercher des erreurs liées à Stripe
3. Vérifier que les webhooks sont bien reçus

### 6.2 Vérifier Supabase
1. Aller dans Table Editor → `subscriptions`
2. Vérifier qu'un abonnement apparaît après un paiement test
3. Vérifier les champs : `status`, `stripe_customer_id`, `stripe_subscription_id`

### 6.3 Vérifier Stripe Dashboard
1. Aller sur https://dashboard.stripe.com/payments
2. Vérifier les paiements récents
3. Vérifier les abonnements actifs

## 🔒 Sécurité et bonnes pratiques

### ✅ À faire :
- Toujours utiliser HTTPS en production
- Ne jamais exposer la Secret Key dans le code frontend
- Vérifier la signature des webhooks (déjà implémenté)
- Utiliser des variables d'environnement pour les clés
- Activer 2FA sur Stripe

### ❌ À ne pas faire :
- Ne jamais commiter les clés API dans Git
- Ne jamais partager les clés secrètes
- Ne pas désactiver la vérification des webhooks

## 💰 Tarification Stripe en Production

**Frais par transaction** :
- Cartes européennes : 1.4% + 0.25€
- Cartes non-européennes : 2.9% + 0.25€

**Abonnements** :
- Mensuel 90€/mois → Vous recevez ~88€ (après frais Stripe)
- Annuel 80€/mois (960€/an) → Vous recevez ~945€ (après frais Stripe)

**Période d'essai** :
- 30 jours gratuits → Aucun paiement pendant l'essai
- Prélèvement automatique après 30 jours

## 🆘 Dépannage

### Problème : Webhook signature verification failed
**Solution** :
- Vérifier que le `STRIPE_WEBHOOK_SECRET` dans Vercel correspond au Signing Secret du webhook
- Redéployer l'application après modification

### Problème : API key invalid
**Solution** :
- Vérifier que vous êtes bien en mode LIVE sur Stripe
- Vérifier que les clés `sk_live_` et `pk_live_` sont correctes
- Vérifier que les variables sont bien définies sur Vercel (Production)

### Problème : Pas d'abonnement créé dans Supabase
**Solution** :
- Vérifier les logs Vercel pour voir les erreurs
- Vérifier que le webhook arrive bien (Stripe Dashboard → Webhooks)
- Vérifier que les tables existent dans Supabase
- Vérifier que le `SUPABASE_SERVICE_ROLE_KEY` est correct

### Problème : Redirection après paiement ne fonctionne pas
**Solution** :
- Vérifier que `NEXT_PUBLIC_APP_URL` est bien défini sur Vercel
- Vérifier que l'URL est : `https://www.neuro-care.fr` (sans slash final)

## 📊 Statistiques à surveiller

Une fois en production, surveillez :
- **Taux de conversion** : Visiteurs → Inscriptions → Paiements
- **Taux d'annulation** : Abonnements annulés / Abonnements totaux
- **Revenus mensuels récurrents (MRR)** : Nombre d'abonnés × Prix moyen
- **Churn rate** : Taux de désabonnement mensuel

Dashboard Stripe vous donnera toutes ces métriques automatiquement !

## ✅ Checklist finale avant le lancement

- [ ] Compte Stripe activé et vérifié ✓
- [ ] Clés API LIVE récupérées ✓
- [ ] Webhook configuré sur Stripe ✓
- [ ] Variables d'environnement ajoutées sur Vercel ✓
- [ ] Application redéployée ✓
- [ ] Tables Supabase créées ✓
- [ ] Test de paiement effectué et annulé ✓
- [ ] Webhooks reçus avec succès (200 OK) ✓
- [ ] Abonnement créé dans Supabase ✓
- [ ] Page pricing accessible sur neuro-care.fr ✓

---

🎉 **Félicitations !** Votre système de paiement Stripe est maintenant en production !
