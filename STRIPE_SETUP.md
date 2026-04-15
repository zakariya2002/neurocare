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

# Configuration Stripe pour Autisme Connect

## 📋 Prérequis
1. Un compte Stripe (gratuit) : https://dashboard.stripe.com/register
2. Stripe CLI installé (pour les webhooks en développement)

## 🔑 Étape 1 : Obtenir les clés API

1. Connectez-vous à https://dashboard.stripe.com
2. Assurez-vous d'être en **mode Test** (toggle en haut à droite)
3. Allez dans **Developers** > **API keys**
4. Copiez :
   - **Publishable key** (commence par `pk_test_...`)
   - **Secret key** (commence par `sk_test_...`) - Cliquez sur "Reveal test key"

## 🔧 Étape 2 : Configurer `.env.local`

Remplacez dans votre fichier `.env.local` :

```bash
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
```

## 🎣 Étape 3 : Configurer les Webhooks (Développement)

### Option A : Avec Stripe CLI (Recommandé)

1. Installez Stripe CLI :
   ```bash
   # Sur macOS avec Homebrew
   brew install stripe/stripe-cli/stripe

   # Sur Linux/Windows, téléchargez depuis : https://stripe.com/docs/stripe-cli
   ```

2. Connectez Stripe CLI à votre compte :
   ```bash
   stripe login
   ```

3. Démarrez le forwarding des webhooks :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copiez le **webhook signing secret** (commence par `whsec_...`) et ajoutez-le dans `.env.local` :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SIGNING_SECRET
   ```

### Option B : Webhook en ligne (Production)

1. Allez dans **Developers** > **Webhooks**
2. Cliquez sur **Add endpoint**
3. URL du endpoint : `https://votre-domaine.com/api/webhooks/stripe`
4. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copiez le **Signing secret**

## 📊 Étape 4 : Créer les produits Stripe (Optionnel)

Par défaut, l'app crée les prix à la volée. Mais vous pouvez créer des produits permanents :

1. Allez dans **Products** > **Add product**
2. Créez deux produits :

### Produit 1 : Abonnement Mensuel
- Nom : `Autisme Connect - Abonnement Éducateur`
- Prix : `89.90 EUR` / mois
- Période d'essai : 30 jours

### Produit 2 : Abonnement Annuel
- Nom : `Autisme Connect - Abonnement Éducateur (Annuel)`
- Prix : `958.80 EUR` / an (ou `79.90 EUR` × 12)
- Période d'essai : 30 jours

## 🧪 Étape 5 : Tester les paiements

### Cartes de test Stripe :

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0027 6000 3184`

Informations de test :
- Date d'expiration : N'importe quelle date future
- CVC : N'importe quels 3 chiffres
- Code postal : N'importe quel code

## 🗄️ Étape 6 : Exécuter le SQL dans Supabase

1. Ouvrez Supabase Studio : https://app.supabase.com
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `supabase-subscriptions.sql`
4. Cliquez sur **Run**

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Démarrez votre serveur Next.js :
   ```bash
   npm run dev
   ```

2. Dans un autre terminal, démarrez le webhook Stripe :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Allez sur : http://localhost:3000/pricing

4. Testez un paiement avec la carte `4242 4242 4242 4242`

5. Vérifiez dans Supabase que l'abonnement a bien été créé dans la table `subscriptions`

## 🚀 Passage en Production

Quand vous êtes prêt pour la production :

1. Basculez Stripe en **mode Live**
2. Récupérez les nouvelles clés API (elles commenceront par `pk_live_` et `sk_live_`)
3. Créez un vrai webhook endpoint avec votre URL de production
4. Mettez à jour `.env.production` avec les clés live

## 💰 Frais Stripe

- **Mode Test** : Gratuit, aucun frais
- **Mode Live** :
  - 2.9% + 0.30€ par transaction réussie
  - Pas d'abonnement mensuel
  - Premiers 1 million d'euros : tarif standard
  - Au-delà : tarifs dégressifs

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Dashboard Stripe](https://dashboard.stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)
- [API Stripe](https://stripe.com/docs/api)

## 🆘 Dépannage

### Erreur : "No webhook signature found"
- Assurez-vous que Stripe CLI est bien démarré
- Vérifiez que le STRIPE_WEBHOOK_SECRET est correct

### Erreur : "Invalid API Key"
- Vérifiez que vous êtes dans le bon mode (Test/Live)
- Vérifiez que les clés dans `.env.local` sont correctes

### Les webhooks ne sont pas reçus
- Redémarrez Stripe CLI
- Vérifiez que l'URL du webhook est correcte
- Consultez les logs dans Developers > Webhooks
