import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/assert-admin';
import { getEducatorWelcomeEmail } from '@/lib/email-templates/educator-welcome';
import { getFamilyWelcomeEmail } from '@/lib/email-templates/family-welcome';
import { getProThankYouEmail } from '@/lib/email-templates/thank-you-pro';
import { getFamilyThankYouEmail } from '@/lib/email-templates/thank-you-family';
import { getPasswordResetEmail } from '@/lib/email-templates/password-reset';

export const dynamic = 'force-dynamic';

type TemplateBuilder = (firstName: string) => { html: string; subject: string };

const TEMPLATES: Record<string, TemplateBuilder> = {
  'thank-you-pro': (firstName) => ({
    html: getProThankYouEmail(firstName),
    subject: `Merci de rejoindre NeuroCare, ${firstName} !`,
  }),
  'thank-you-family': (firstName) => ({
    html: getFamilyThankYouEmail(firstName),
    subject: `Merci de rejoindre NeuroCare, ${firstName} !`,
  }),
  'welcome-pro': (firstName) => ({
    html: getEducatorWelcomeEmail(firstName, 'https://neuro-care.fr/auth/login?confirmed=true'),
    subject: `Confirmez votre email - Bienvenue sur NeuroCare Pro, ${firstName} !`,
  }),
  'welcome-family': (firstName) => ({
    html: getFamilyWelcomeEmail(firstName, 'https://neuro-care.fr/auth/login?confirmed=true'),
    subject: `Confirmez votre email - Bienvenue sur NeuroCare, ${firstName} !`,
  }),
  'password-reset': (firstName) => ({
    html: getPasswordResetEmail(firstName, 'https://neuro-care.fr/auth/reset-password?token=preview'),
    subject: 'Réinitialisation de votre mot de passe NeuroCare',
  }),
};

export async function GET(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  const template = request.nextUrl.searchParams.get('template') || '';
  const firstName = request.nextUrl.searchParams.get('firstName') || 'Prénom';

  const builder = TEMPLATES[template];
  if (!builder) {
    return NextResponse.json(
      { error: 'Template inconnu', available: Object.keys(TEMPLATES) },
      { status: 400 },
    );
  }

  const { html, subject } = builder(firstName);
  return NextResponse.json({ html, subject, template, firstName });
}
