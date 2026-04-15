import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MDPH : constituer son dossier efficacement | NeuroCare',
  description:
    'Guide complet pour préparer un dossier MDPH solide : pièces à rassembler, formulaires, délais et astuces pour obtenir AEEH, PCH et reconnaissance du handicap.',
  alternates: { canonical: 'https://neuro-care.fr/blog/mdph-dossier' },
  openGraph: {
    title: 'MDPH : constituer son dossier efficacement',
    description: 'Étape par étape, tout ce que les parents doivent savoir pour réussir leur dossier MDPH.',
    url: 'https://neuro-care.fr/blog/mdph-dossier',
    type: 'article',
  },
};

export default function ArticleMDPH() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-7 sm:h-8" />
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Retour au blog</span>
              <span className="sm:hidden">Blog</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-200">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/articles/mdph.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)', color: '#41005c' }}>
            Droits et démarches
          </span>
          <span>25 décembre 2024</span>
          <span>•</span>
          <span>10 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          MDPH : constituer son dossier efficacement
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8">
            La MDPH est un passage incontournable pour obtenir la reconnaissance du handicap de votre enfant et accéder aux aides associées. Ce guide vous accompagne pour constituer un dossier complet et maximiser vos chances de réponse favorable.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Ce que vous pouvez demander</h2>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>AEEH</strong> : Allocation d'Éducation de l'Enfant Handicapé (base + compléments)</li>
            <li><strong>PCH</strong> : Prestation de Compensation du Handicap</li>
            <li><strong>Carte Mobilité Inclusion</strong> : Stationnement, priorité, invalidité</li>
            <li><strong>Orientation scolaire</strong> : ULIS, IME, SESSAD, AESH...</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les pièces obligatoires</h2>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Formulaire Cerfa n°15692*01</li>
            <li>Certificat médical Cerfa n°15695*01 (validité 12 mois)</li>
            <li>Justificatif d'identité de l'enfant</li>
            <li>Justificatif de domicile de moins de 3 mois</li>
            <li>Photo d'identité récente</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les pièces complémentaires essentielles</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">C'est là que se fait la différence !</p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Bilan diagnostic (neuropédiatre, psychiatre, CRA...)</li>
            <li>Bilans orthophonique, psychomoteur, psychologique</li>
            <li>GEVA-Sco et documents scolaires</li>
            <li>Factures des prises en charge</li>
            <li><strong>Projet de vie</strong> (voir ci-dessous)</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Rédiger le projet de vie</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            C'est LE document qui fait la différence. Il permet de décrire concrètement le quotidien de votre enfant.
          </p>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 my-8 rounded-r-lg">
            <h4 className="font-bold text-teal-800 mb-2">Structure recommandée</h4>
            <ul className="text-teal-700 space-y-1">
              <li>1. Présentation de l'enfant (prénom, âge, diagnostic, forces)</li>
              <li>2. Le quotidien : difficultés concrètes heure par heure</li>
              <li>3. Impact sur la vie familiale</li>
              <li>4. Les prises en charge actuelles</li>
              <li>5. Vos demandes précises et justifiées</li>
            </ul>
          </div>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Conseils de rédaction</h3>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>Soyez concret</strong> : "il met 45 minutes à s'habiller seul" plutôt que "il a des difficultés"</li>
            <li><strong>Quantifiez</strong> : Heures d'aide, nombre de crises par semaine, coût mensuel</li>
            <li><strong>Décrivez les mauvais jours</strong> : Ne minimisez pas</li>
            <li><strong>Restez factuel</strong> : Évitez le ton trop émotionnel</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">En cas de refus</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">Vous avez des recours :</p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>Recours gracieux</strong> : Dans les 2 mois, courrier à la MDPH</li>
            <li><strong>Recours contentieux</strong> : Tribunal administratif ou judiciaire</li>
            <li>Faites-vous accompagner par des associations si besoin</li>
          </ul>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 my-8 rounded-r-lg">
            <h4 className="font-bold text-purple-800 mb-2">Checklist avant envoi</h4>
            <ul className="text-purple-700 space-y-1">
              <li>☐ Formulaire Cerfa complètement rempli et signé</li>
              <li>☐ Certificat médical de moins de 12 mois</li>
              <li>☐ Tous les bilans joints</li>
              <li>☐ Projet de vie détaillé</li>
              <li>☐ Copie complète conservée</li>
              <li>☐ Envoi en recommandé</li>
            </ul>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Conclusion</h2>
          <p className="text-sm sm:text-base text-gray-700">
            Constituer un dossier MDPH demande du temps, mais c'est un investissement essentiel. La clé : être concret, exhaustif et organisé. Les professionnels NeuroCare peuvent vous fournir des bilans et attestations pour compléter votre dossier.
          </p>
        </div>

        {/* Author */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#027e7e' }}>
              NC
            </div>
            <div>
              <p className="font-semibold text-gray-900">Équipe NeuroCare</p>
              <p className="text-sm text-gray-500">Experts en accompagnement des personnes neuro-atypiques</p>
            </div>
          </div>
        </div>

        {/* Share */}
        <div className="mt-8 flex items-center gap-4">
          <span className="text-gray-600">Partager :</span>
          <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </button>
          <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </button>
          <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
            </svg>
          </button>
        </div>
      </article>

      {/* Related Articles */}
      <section className="bg-gray-50 py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-8">Articles similaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Link href="/blog/preparer-consultation" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/consultation.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Préparer une consultation</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Comment préparer son enfant à une première consultation.</p>
              </div>
            </Link>
            <Link href="/blog/psychomotricien" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/psychomotricien.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Que fait un psychomotricien ?</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Zoom sur cette profession méconnue.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 text-center text-gray-500 text-xs sm:text-sm">
        <p>© 2024 NeuroCare. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
