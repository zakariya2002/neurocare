import LegalPageLayout from '@/components/LegalPageLayout';
import { loadLegalMarkdown } from '@/lib/legal-markdown';

export default function MentionsLegalesPage() {
  const { html, toc } = loadLegalMarkdown('Mentions-legales.md');
  return (
    <LegalPageLayout
      title="Mentions légales"
      subtitle="Informations relatives à l'éditeur, à l'hébergeur et aux conditions d'exploitation du site neuro-care.fr, conformément à la LCEN."
      effectiveDate="27 mai 2026"
      toc={toc}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalPageLayout>
  );
}
