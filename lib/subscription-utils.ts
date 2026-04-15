/**
 * Utilitaires d'abonnement - Stub minimal
 *
 * Le système d'abonnement premium a été supprimé : tous les professionnels
 * ont accès à toutes les fonctionnalités, et le modèle économique repose
 * uniquement sur les commissions (12%) sur les rendez-vous.
 *
 * Ce fichier ne reste que pour éviter de modifier les appelants côté UI.
 * À retirer lorsque les derniers imports auront été nettoyés.
 */

/**
 * Vérifie si un éducateur peut créer une nouvelle conversation.
 * Retourne toujours true — pas de limite.
 */
export async function canEducatorCreateConversation(_educatorId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}> {
  return { canCreate: true };
}
