/**
 * Extracted validation logic from app/api/newsletter/unsubscribe/route.ts
 * Validates and normalizes email input for newsletter unsubscribe.
 */

export interface UnsubscribeValidationResult {
  valid: boolean;
  error?: string;
  normalizedEmail?: string;
}

export function validateUnsubscribeInput(email: unknown): UnsubscribeValidationResult {
  if (!email) {
    return { valid: false, error: "L'email est requis" };
  }

  if (typeof email !== 'string') {
    return { valid: false, error: "L'email doit être une chaîne de caractères" };
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail.length === 0) {
    return { valid: false, error: "L'email est requis" };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { valid: false, error: 'Email invalide' };
  }

  return { valid: true, normalizedEmail };
}
