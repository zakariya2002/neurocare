import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gérer les crises sensorielles : techniques et outils pratiques | NeuroCare',
  description:
    "Comprendre et apaiser les crises sensorielles chez l'enfant TND : signaux d'alerte, techniques d'apaisement et outils concrets pour les parents.",
  alternates: { canonical: 'https://neuro-care.fr/blog/crises-sensorielles' },
  openGraph: {
    title: 'Gérer les crises sensorielles : techniques et outils pratiques',
    description: 'Guide pour identifier, anticiper et apaiser les crises sensorielles chez les enfants TSA et TDAH.',
    url: 'https://neuro-care.fr/blog/crises-sensorielles',
    type: 'article',
  },
};

export default function ArticleCrisesSensorielles() {
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
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: "url('/images/articles/crises-sensorielles.jpg')", backgroundPosition: 'center 30%' }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', color: '#e85d7c' }}>
            Vie quotidienne
          </span>
          <span>25 décembre 2024</span>
          <span>•</span>
          <span>8 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Gérer les crises sensorielles : techniques et outils pratiques
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Les crises sensorielles sont fréquentes chez les enfants présentant un TSA, un TDAH ou d'autres TND. Contrairement aux "caprices", ces crises sont une réponse involontaire à une surcharge sensorielle. Comprendre leurs mécanismes permet de mieux les accompagner.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Comprendre la surcharge sensorielle</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Une crise sensorielle survient lorsque le système nerveux est submergé par les stimuli. Elle peut se manifester par :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Des cris, des pleurs intenses</li>
            <li>De l'agitation ou des comportements d'automutilation</li>
            <li>Une fuite ou un repli sur soi (mutisme, prostration)</li>
            <li>Des gestes répétitifs intensifiés (stéréotypies)</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les signes avant-coureurs</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Avant une crise, l'enfant montre souvent des signes de tension :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>Corporels</strong> : Raidissement, mains sur les oreilles, mouvements répétitifs accélérés</li>
            <li><strong>Comportementaux</strong> : Irritabilité croissante, difficulté à se concentrer</li>
            <li><strong>Verbaux</strong> : Répétition de phrases, ton de voix qui change</li>
            <li><strong>Émotionnels</strong> : Anxiété visible, regard fuyant</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Pendant la crise : les bons réflexes</h2>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 my-8 rounded-r-lg">
            <h4 className="font-bold text-teal-800 mb-2">Ce qu'il faut faire</h4>
            <ul className="text-teal-700 space-y-1">
              <li>• Rester calme - votre état influence celui de votre enfant</li>
              <li>• Assurer la sécurité en éloignant les objets dangereux</li>
              <li>• Réduire les stimuli (lumières, bruits)</li>
              <li>• Parler peu et doucement</li>
              <li>• Proposer un objet apaisant</li>
            </ul>
          </div>

          <div className="bg-red-50 border-l-4 border-red-400 p-6 my-8 rounded-r-lg">
            <h4 className="font-bold text-red-800 mb-2">Ce qu'il faut éviter</h4>
            <ul className="text-red-700 space-y-1">
              <li>• Ne pas punir - l'enfant ne contrôle pas sa crise</li>
              <li>• Ne pas raisonner - ce n'est pas le moment</li>
              <li>• Ne pas crier - cela amplifie la surcharge</li>
              <li>• Ne pas forcer le contact physique</li>
            </ul>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les outils pratiques au quotidien</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Le kit de survie sensorielle</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">Préparez un sac contenant :</p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Casque anti-bruit ou bouchons d'oreilles</li>
            <li>Lunettes de soleil pour atténuer la lumière</li>
            <li>Fidgets variés (balles, cubes, tangle)</li>
            <li>Couverture lestée format voyage</li>
            <li>Casque audio avec playlist calmante</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Les techniques d'autorégulation</h3>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>Respiration carrée</strong> : inspirer 4 sec, retenir 4 sec, expirer 4 sec, retenir 4 sec</li>
            <li><strong>Pressions profondes</strong> : presser ses mains l'une contre l'autre</li>
            <li><strong>Grounding</strong> : nommer 5 choses qu'on voit, 4 qu'on entend, 3 qu'on touche...</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Quand consulter un professionnel ?</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">N'hésitez pas à consulter si :</p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Les crises sont très fréquentes (quotidiennes)</li>
            <li>L'enfant se met en danger</li>
            <li>Vous vous sentez dépassé(e)</li>
            <li>Les stratégies ne fonctionnent plus</li>
          </ul>
          <p className="text-sm sm:text-base text-gray-700">
            Les psychomotriciens et ergothérapeutes peuvent vous aider à mettre en place un programme sensoriel adapté à votre enfant.
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
            <Link href="/blog/bien-etre-aidants" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/bien-etre-aidants.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Prendre soin de soi</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">L'importance du répit pour les parents aidants.</p>
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
