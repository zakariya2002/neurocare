import crypto from 'crypto';

/**
 * Genere un token HMAC pour securiser le desabonnement newsletter.
 * Seuls les destinataires de l'email (avec le token) peuvent se desabonner.
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'newsletter-unsubscribe-secret';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex').substring(0, 32);
}
