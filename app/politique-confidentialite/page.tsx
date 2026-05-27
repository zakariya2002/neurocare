import LegalPageLayout from '@/components/LegalPageLayout';
import { parseLegalMarkdown } from '@/lib/legal-markdown';
import md from '@/legal-content/Politique-confidentialite';

export default function PolitiqueConfidentialitePage() {
  const { html, toc } = parseLegalMarkdown(md);
  return (
    <LegalPageLayout
      title="Politique de confidentialité"
      subtitle="Comment Neuro Care collecte, utilise et protège vos données personnelles, conformément au RGPD et à la loi Informatique et Libertés."
      effectiveDate="27 mai 2026"
      toc={toc}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </LegalPageLayout>
  );
}
