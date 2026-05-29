/**
 * Lien d'invitation vers la communauté WhatsApp des professionnels.
 *
 * ⚠️ La communauté n'est pas encore créée : la valeur par défaut est un
 * placeholder. Quand le lien d'invitation WhatsApp existera, renseigner
 * la variable d'environnement NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL
 * (dans Vercel + .env.local) — aucune autre modification de code nécessaire.
 */
export const WHATSAPP_COMMUNITY_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ||
  'https://chat.whatsapp.com/PLACEHOLDER';

/** true tant que le vrai lien n'a pas été renseigné (placeholder actif). */
export const WHATSAPP_COMMUNITY_PLACEHOLDER =
  !process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL;
