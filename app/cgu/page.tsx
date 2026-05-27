import LegalPageLayout from '@/components/LegalPageLayout';
import { parseLegalMarkdown } from '@/lib/legal-markdown';
import md from '../../legal-content/CGU.md';

export default function CGUPage() {
  const { html, toc } = parseLegalMarkdown(md);
  return (
    <LegalPageLayout
      title="Conditions Générales d'Utilisation"
      subtitle="Règles encadrant l'utilisation de la plateforme Neuro Care, les obligations respectives des familles et des professionnels, et les modalités de paiement."
      effectiveDate="27 mai 2026"
      toc={toc}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalPageLayout>
  );
}
