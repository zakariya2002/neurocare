import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';

export const metadata: Metadata = {
  title: 'Glossaire des troubles du neurodéveloppement (TND)',
  description:
    'Définitions claires et accessibles des termes liés aux troubles du neurodéveloppement : TND, TSA, TDAH, DYS, ABA, TEACCH, MDPH, AEEH, PCH… pour mieux comprendre le parcours.',
  alternates: { canonical: '/glossaire' },
  openGraph: {
    title: 'Glossaire TND — NeuroCare',
    description:
      'Définitions des termes clés de l\'accompagnement des troubles du neurodéveloppement.',
    url: 'https://neuro-care.fr/glossaire',
    type: 'article',
  },
};

type Term = {
  term: string;
  abbr?: string;
  definition: string;
  related?: string[];
};

const TERMS: Term[] = [
  {
    term: 'AEEH',
    abbr: 'Allocation d’Éducation de l’Enfant Handicapé',
    definition:
      "Aide financière versée par la CAF aux familles élevant un enfant en situation de handicap (jusqu'à 20 ans). Accordée par la MDPH après évaluation, avec éventuels compléments selon la charge de soins.",
    related: ['MDPH', 'PCH'],
  },
  {
    term: 'AESH',
    abbr: 'Accompagnant des Élèves en Situation de Handicap',
    definition:
      'Professionnel qui aide l’élève en situation de handicap à suivre sa scolarité (accompagnement individuel, mutualisé ou collectif). Remplace progressivement l’appellation AVS.',
  },
  {
    term: 'ABA',
    abbr: 'Applied Behavior Analysis',
    definition:
      "Analyse Appliquée du Comportement : approche comportementale reconnue par la HAS pour l'accompagnement de l'autisme. S'appuie sur le renforcement positif pour développer les apprentissages.",
    related: ['TEACCH', 'PECS'],
  },
  {
    term: 'CESU',
    abbr: 'Chèque Emploi Service Universel',
    definition:
      'Dispositif permettant de déclarer et rémunérer un intervenant à domicile (éducateur spécialisé libéral, par ex.) en bénéficiant d’un crédit d’impôt de 50 %.',
  },
  {
    term: 'CMP / CMPP',
    abbr: 'Centre Médico-Psychologique / Pédagogique',
    definition:
      'Structures publiques ou associatives offrant des consultations pluridisciplinaires (psychologue, psychomotricien, orthophoniste, pédopsychiatre…) gratuites ou à faible coût.',
  },
  {
    term: 'DYS',
    abbr: 'Troubles « DYS »',
    definition:
      'Famille de troubles spécifiques des apprentissages : dyslexie (lecture), dysorthographie (orthographe), dyscalculie (calcul), dyspraxie (coordination motrice), dysphasie (langage oral).',
  },
  {
    term: 'GEVA-Sco',
    abbr: 'Guide d’Évaluation Scolaire',
    definition:
      'Document renseigné par l’équipe éducative pour décrire la situation scolaire d’un élève handicapé. Pièce centrale du dossier MDPH lors de la demande de PPS ou d’AESH.',
  },
  {
    term: 'IME',
    abbr: 'Institut Médico-Éducatif',
    definition:
      'Établissement médico-social accueillant des enfants en situation de handicap intellectuel, souvent avec troubles associés, pour une prise en charge globale (éducative, thérapeutique, pédagogique).',
  },
  {
    term: 'MDPH',
    abbr: 'Maison Départementale des Personnes Handicapées',
    definition:
      "Guichet unique d’accès aux droits des personnes en situation de handicap. Instruit les demandes d'AEEH, de PCH, de RQTH, de notification AESH, d'orientation en établissement…",
    related: ['AEEH', 'PCH'],
  },
  {
    term: 'Neurodiversité',
    definition:
      "Concept qui considère les variations neurologiques (autisme, TDAH, DYS…) comme des différences naturelles à accommoder plutôt que des maladies à guérir. Promeut l'inclusion et l'adaptation de l'environnement.",
  },
  {
    term: 'PAP',
    abbr: 'Plan d’Accompagnement Personnalisé',
    definition:
      'Dispositif interne à l’école permettant des aménagements pédagogiques pour un élève avec troubles des apprentissages, sans passer par la MDPH.',
    related: ['PPS'],
  },
  {
    term: 'PCH',
    abbr: 'Prestation de Compensation du Handicap',
    definition:
      'Aide financière attribuée par la MDPH pour couvrir les besoins liés au handicap : aide humaine, aides techniques, aménagement du logement, transport, aides spécifiques.',
    related: ['AEEH', 'MDPH'],
  },
  {
    term: 'PECS',
    abbr: 'Picture Exchange Communication System',
    definition:
      "Système de communication par échange d'images, utilisé notamment pour les personnes autistes non verbales ou peu verbales afin de développer la communication fonctionnelle.",
    related: ['ABA', 'TEACCH'],
  },
  {
    term: 'PPS',
    abbr: 'Projet Personnalisé de Scolarisation',
    definition:
      'Document élaboré par la MDPH qui définit les modalités de scolarisation de l’élève handicapé (AESH, matériel adapté, orientation en classe spécialisée, temps partiel, etc.).',
    related: ['MDPH', 'AESH'],
  },
  {
    term: 'SESSAD',
    abbr: 'Service d’Éducation Spéciale et de Soins À Domicile',
    definition:
      'Équipe pluridisciplinaire qui intervient sur les lieux de vie de l’enfant (école, domicile) pour un accompagnement médico-éducatif sur notification MDPH.',
  },
  {
    term: 'Stéréotypie',
    definition:
      "Comportement répétitif (mouvements, sons, manipulations d'objets) fréquent dans l'autisme. Souvent une stratégie d'auto-régulation sensorielle ou émotionnelle à ne pas empêcher systématiquement.",
  },
  {
    term: 'TDAH',
    abbr: 'Trouble du Déficit de l’Attention avec ou sans Hyperactivité',
    definition:
      "Trouble du neurodéveloppement caractérisé par des difficultés d'attention, une impulsivité et/ou une hyperactivité qui impactent le quotidien. Touche environ 5 % des enfants en France.",
    related: ['TND'],
  },
  {
    term: 'TEACCH',
    abbr: 'Treatment and Education of Autistic and related Communication-handicapped Children',
    definition:
      'Programme d’accompagnement structuré de l’autisme, basé sur la prévisibilité, la structuration de l’environnement et les supports visuels.',
    related: ['ABA', 'PECS'],
  },
  {
    term: 'TND',
    abbr: 'Troubles du Neurodéveloppement',
    definition:
      "Ensemble des troubles qui apparaissent durant le développement : autisme (TSA), TDAH, troubles DYS, déficience intellectuelle, troubles moteurs. Ils ont une origine neurologique et débutent dans l'enfance.",
    related: ['TSA', 'TDAH', 'DYS'],
  },
  {
    term: 'TSA',
    abbr: 'Trouble du Spectre de l’Autisme',
    definition:
      "Trouble du neurodéveloppement affectant la communication, les interactions sociales, associé à des intérêts restreints et/ou comportements répétitifs. S'exprime de façon très variable d'une personne à l'autre — d'où la notion de spectre.",
    related: ['TND'],
  },
];

export default function GlossairePage() {
  const groups = TERMS.reduce<Record<string, Term[]>>((acc, term) => {
    const letter = term.term[0].toUpperCase();
    (acc[letter] ||= []).push(term);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groups).sort();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Glossaire TND NeuroCare',
    url: 'https://neuro-care.fr/glossaire',
    hasDefinedTerm: TERMS.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      alternateName: t.abbr,
      description: t.definition,
    })),
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="pt-20 xl:pt-24 pb-8 px-4" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Glossaire des troubles du neurodéveloppement
          </h1>
          <p className="text-sm sm:text-base text-white/80">
            Les sigles, termes et dispositifs à connaître pour mieux s&apos;orienter dans le parcours.
          </p>
        </div>
      </section>

      {/* Index alphabétique */}
      <nav
        aria-label="Navigation alphabétique"
        className="sticky top-14 xl:top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-1.5 justify-center">
          {sortedLetters.map((l) => (
            <a
              key={l}
              href={`#letter-${l}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-semibold text-gray-700 hover:text-white hover:bg-[#027e7e] transition-colors"
            >
              {l}
            </a>
          ))}
        </div>
      </nav>

      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {sortedLetters.map((letter) => (
            <div key={letter} id={`letter-${letter}`} className="mb-8 scroll-mt-32">
              <h2
                className="text-3xl sm:text-4xl font-bold mb-4 pb-2 border-b-2"
                style={{ color: '#027e7e', borderColor: '#027e7e' }}
              >
                {letter}
              </h2>
              <dl className="space-y-4">
                {groups[letter].map((t) => (
                  <div
                    key={t.term}
                    id={`term-${t.term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="bg-white rounded-xl p-4 sm:p-5 shadow-sm scroll-mt-32"
                  >
                    <dt className="mb-1.5">
                      <span className="text-lg font-bold text-gray-900">{t.term}</span>
                      {t.abbr && (
                        <span className="ml-2 text-sm text-gray-500 italic">— {t.abbr}</span>
                      )}
                    </dt>
                    <dd className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {t.definition}
                    </dd>
                    {t.related && t.related.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-gray-500">Voir aussi :</span>
                        {t.related.map((r) => (
                          <a
                            key={r}
                            href={`#term-${r.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                            className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                          >
                            {r}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </dl>
            </div>
          ))}

          <div className="mt-10 p-5 rounded-xl bg-teal-50 border border-teal-100 text-center">
            <p className="text-sm text-gray-700 mb-2">
              Un terme manque à ce glossaire ?
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#027e7e' }}
            >
              Proposer un ajout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
