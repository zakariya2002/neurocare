import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nutrition et troubles du neurodéveloppement : ce qui marche | NeuroCare',
  description:
    "Alimentation et enfants TSA/TDAH : sélectivité alimentaire, régimes sans gluten, compléments, approche pragmatique pour les familles.",
  alternates: { canonical: 'https://neuro-care.fr/blog/nutrition' },
  openGraph: {
    title: 'Nutrition et troubles du neurodéveloppement : ce qui marche',
    description: "Comprendre la sélectivité alimentaire et adapter l'alimentation d'un enfant TND.",
    url: 'https://neuro-care.fr/blog/nutrition',
    type: 'article',
  },
};

export default function ArticleNutrition() {
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
          style={{ backgroundImage: "url('/images/articles/nutrition.png')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            Santé
          </span>
          <span>10 décembre 2024</span>
          <span>•</span>
          <span>6 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Nutrition et autisme : Les bases d'une alimentation adaptée
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8">
            L'alimentation joue un rôle crucial dans le bien-être des personnes autistes. Entre sensibilités sensorielles, sélectivité alimentaire et besoins nutritionnels spécifiques, découvrez comment adapter l'alimentation au quotidien.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Comprendre les particularités alimentaires</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            De nombreuses personnes autistes présentent des particularités alimentaires qui peuvent être liées à plusieurs facteurs :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Sensibilités sensorielles</strong> : textures, couleurs, odeurs ou températures peuvent être difficiles à tolérer</li>
            <li><strong>Besoin de routine</strong> : préférence pour des aliments familiers et présentés de manière identique</li>
            <li><strong>Troubles gastro-intestinaux</strong> : plus fréquents chez les personnes TSA</li>
            <li><strong>Difficultés motrices</strong> : mastication ou déglutition parfois compliquées</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les nutriments essentiels à surveiller</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Les oméga-3</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Ces acides gras essentiels jouent un rôle important dans le développement cérébral et la régulation de l'inflammation. On les trouve dans les poissons gras (saumon, maquereau, sardines), les noix et les graines de lin.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Le magnésium</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Souvent déficitaire chez les personnes autistes, le magnésium contribue à la régulation du système nerveux. Sources : légumes verts, chocolat noir, amandes, bananes.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">La vitamine D</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Essentielle pour l'immunité et le bien-être mental, elle est souvent insuffisante. L'exposition au soleil et certains aliments (poissons gras, œufs) peuvent aider.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Le zinc</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Important pour la fonction cognitive et immunitaire. On le trouve dans la viande, les fruits de mer, les légumineuses et les graines de courge.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Stratégies pour diversifier l'alimentation</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">1. Introduire progressivement</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Ne proposez qu'un nouvel aliment à la fois, en petite quantité, sans pression. Plusieurs expositions (parfois 15 à 20) peuvent être nécessaires avant l'acceptation.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">2. Jouer sur les présentations</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Un même aliment peut être mieux accepté sous une forme différente : cru vs cuit, mixé vs entier, en purée vs en morceaux.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">3. Impliquer l'enfant</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Participer à la préparation des repas peut aider à familiariser avec les aliments. Commencez par des tâches simples : laver les légumes, mélanger...
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">4. Créer un environnement calme</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Réduisez les stimulations sensorielles pendant les repas : lumière douce, musique calme ou silence, pas de télévision.
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-6 my-6 sm:my-8 rounded-r-lg">
            <h4 className="font-bold text-amber-800 mb-2 text-sm sm:text-base">À retenir</h4>
            <p className="text-amber-700 text-sm sm:text-base">
              Chaque personne autiste est unique. Ce qui fonctionne pour l'une peut ne pas convenir à une autre. N'hésitez pas à consulter un nutritionniste spécialisé pour un accompagnement personnalisé.
            </p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les régimes spécifiques : que dit la science ?</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Certains régimes sont parfois proposés dans le cadre de l'autisme :
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Régime sans gluten et sans caséine (SGSC)</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Bien que certaines familles rapportent des améliorations, les études scientifiques ne montrent pas de bénéfice systématique. Ce régime peut être essayé sous supervision médicale, en veillant à ne pas créer de carences.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Régime pauvre en sucres</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Réduire les sucres raffinés peut améliorer la stabilité de l'humeur et de l'énergie chez certaines personnes.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Exemple de journée alimentaire équilibrée</h2>
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 my-5 sm:my-6">
            <p className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3"><strong>Petit-déjeuner :</strong> Porridge aux flocons d'avoine avec banane et amandes</p>
            <p className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3"><strong>Déjeuner :</strong> Filet de poulet, riz complet, carottes vapeur, compote de pommes</p>
            <p className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3"><strong>Goûter :</strong> Yaourt nature avec un peu de miel, quelques noix</p>
            <p className="text-sm sm:text-base text-gray-700"><strong>Dîner :</strong> Saumon, purée de patates douces, haricots verts, fruit frais</p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Conclusion</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            L'alimentation des personnes autistes demande patience et adaptation. L'objectif n'est pas la perfection mais de tendre vers un équilibre qui respecte les particularités de chacun tout en assurant les apports nutritionnels essentiels.
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
            <Link href="/blog/harcelement-scolaire" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/harcelement.png')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Harcèlement scolaire et TSA</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Comment protéger son enfant du harcèlement scolaire.</p>
              </div>
            </Link>
            <Link href="/blog/activite-physique" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/sport.png')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Sport et autisme</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Les bienfaits de l'activité physique adaptée.</p>
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
