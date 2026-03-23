/**
 * Traduit les messages d'erreur Supabase/Stripe en français.
 */
const ERROR_TRANSLATIONS: Record<string, string> = {
  'Email not confirmed': 'Votre email n\'a pas été confirmé. Vérifiez votre boîte de réception.',
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'User already registered': 'Cet email est déjà utilisé.',
  'Email already registered': 'Cet email est déjà utilisé.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Signup requires a valid password': 'Veuillez saisir un mot de passe valide.',
  'User not found': 'Aucun compte trouvé avec cet email.',
  'New password should be different from the old password': 'Le nouveau mot de passe doit être différent de l\'ancien.',
  'Auth session missing!': 'Session expirée. Veuillez vous reconnecter.',
  'JWT expired': 'Session expirée. Veuillez vous reconnecter.',
  'Token has expired or is invalid': 'Le lien a expiré ou est invalide.',
  'For security purposes, you can only request this once every 60 seconds': 'Pour des raisons de sécurité, veuillez patienter 60 secondes avant de réessayer.',
  'Email rate limit exceeded': 'Trop de tentatives. Veuillez patienter quelques minutes.',
  'Request rate limit reached': 'Trop de requêtes. Veuillez patienter quelques minutes.',
  'Unable to validate email address: invalid format': 'Format d\'email invalide.',
  'Signups not allowed for this instance': 'Les inscriptions sont temporairement désactivées.',
  'Email link is invalid or has expired': 'Le lien de confirmation a expiré. Veuillez en demander un nouveau.',
  'Password is too short': 'Le mot de passe est trop court.',
  'Password is too weak': 'Le mot de passe est trop faible. Ajoutez des chiffres ou caractères spéciaux.',
};

export function translateError(message: string): string {
  // Correspondance exacte
  if (ERROR_TRANSLATIONS[message]) {
    return ERROR_TRANSLATIONS[message];
  }

  // Correspondance partielle
  for (const [key, value] of Object.entries(ERROR_TRANSLATIONS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Patterns courants
  if (message.includes('already been registered') || message.includes('already exists') || message.includes('déjà utilisé')) {
    return 'Cet email est déjà utilisé. Essayez de vous connecter ou utilisez un autre email.';
  }

  if (message.includes('rate limit') || message.includes('429')) {
    return 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
  }

  // Fallback
  return 'Une erreur est survenue. Veuillez réessayer.';
}
