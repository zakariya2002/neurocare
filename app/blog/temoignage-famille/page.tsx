import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Portrait de famille : "NeuroCare a changé notre quotidien" | Blog NeuroCare',
  description:
    "Émilie et Thomas, parents de Théo (7 ans, TSA et TDAH), racontent leur parcours et comment NeuroCare a transformé leur quotidien.",
  alternates: { canonical: 'https://neuro-care.fr/blog/temoignage-famille' },
  openGraph: {
    title: 'Portrait de famille : "NeuroCare a changé notre quotidien"',
    description: "Témoignage d'une famille accompagnée par des professionnels NeuroCare.",
    url: 'https://neuro-care.fr/blog/temoignage-famille',
    type: 'article',
  },
};

export default function ArticleTemoignageFamille() {
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
          style={{ backgroundImage: "url('/images/articles/temoignage-famille.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', color: '#e85d7c' }}>
            Témoignages
          </span>
          <span>25 décembre 2024</span>
          <span>•</span>
          <span>6 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Portrait de famille : "NeuroCare a changé notre quotidien"
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 italic">
            Émilie et Thomas sont les parents de Théo, 7 ans, diagnostiqué TSA et TDAH. Après des mois d'errance pour trouver des professionnels adaptés, ils ont découvert NeuroCare. Ils nous racontent leur parcours.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Le début du parcours : l'errance diagnostique</h2>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <p className="text-sm sm:text-base text-gray-700 italic mb-4">
              "Théo a toujours été un enfant 'différent'. Dès la crèche, on nous disait qu'il était dans son monde. Au début, on se disait que ça allait venir, qu'il était juste timide."
            </p>
            <p className="text-sm text-gray-500 text-right">— Émilie</p>
          </div>

          <p className="text-sm sm:text-base text-gray-700 mb-4">
            L'entrée en maternelle a tout déclenché. Les crises quotidiennes, les convocations hebdomadaires... Le médecin traitant les a orientés vers un pédopsychiatre. Délai d'attente : 18 mois.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">La quête de professionnels : un parcours du combattant</h2>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <p className="text-sm sm:text-base text-gray-700 italic mb-4">
              "On a passé des heures sur Internet. À chaque fois, soit les listes d'attente étaient interminables, soit les professionnels n'étaient pas formés aux TND. Comment savoir à qui faire confiance ?"
            </p>
            <p className="text-sm text-gray-500 text-right">— Thomas</p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">La découverte de NeuroCare</h2>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 my-8 rounded-r-lg">
            <p className="text-teal-700 italic">
              "C'est une maman d'un groupe Facebook qui m'a parlé de NeuroCare. En quelques clics, on a trouvé une psychomotricienne à 15 minutes de chez nous, spécialisée TSA et TDAH, avec des avis excellents. Pour la première fois, on savait à qui on allait confier notre fils."
            </p>
            <p className="text-teal-600 text-right mt-2">— Émilie</p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">L'équipe qui accompagne Théo aujourd'hui</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">Grâce à NeuroCare, Théo est maintenant suivi par :</p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>Marie</strong>, psychomotricienne spécialisée TSA/TDAH</li>
            <li><strong>Sophie</strong>, orthophoniste formée aux particularités de communication</li>
            <li><strong>Julien</strong>, éducateur spécialisé qui intervient à domicile</li>
          </ul>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <p className="text-sm sm:text-base text-gray-700 italic mb-4">
              "Ce qui est génial, c'est que tous les professionnels se coordonnent. On a enfin une vraie équipe autour de Théo, pas des intervenants isolés. Et pour nous, la gestion est simplifiée : tout est sur l'application."
            </p>
            <p className="text-sm text-gray-500 text-right">— Thomas</p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les progrès de Théo</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">En un an de suivi, les progrès sont remarquables :</p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Théo reconnaît ses émotions et demande de l'aide</li>
            <li>Les crises sont beaucoup moins fréquentes</li>
            <li>Il utilise seul ses techniques de respiration</li>
            <li>À l'école, il a même un copain !</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Ce qui a changé pour toute la famille</h2>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <p className="text-sm sm:text-base text-gray-700 italic mb-4">
              "On a retrouvé une vie de famille. Avant, tout tournait autour de la gestion des crises. Aujourd'hui, on peut faire des sorties, partir en week-end. Et moi, j'ai repris une activité professionnelle."
            </p>
            <p className="text-sm text-gray-500 text-right">— Émilie</p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Leur message aux autres familles</h2>

          <div className="bg-pink-50 border-l-4 border-pink-400 p-6 my-8 rounded-r-lg">
            <p className="text-pink-800 mb-4">
              <strong>"N'attendez pas d'être épuisés pour chercher de l'aide. Des solutions existent, des professionnels compétents existent. Il faut parfois chercher, mais ils sont là."</strong>
            </p>
            <p className="text-pink-800 mb-4">
              "Faites confiance à votre instinct de parent. Vous connaissez votre enfant mieux que personne."
            </p>
            <p className="text-pink-800">
              "Et surtout, prenez soin de vous. On ne peut pas accompagner son enfant si on est au bout du rouleau."
            </p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Le mot de la fin</h2>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <p className="text-sm sm:text-base text-gray-700 italic">
              "Théo restera toujours autiste et TDAH. Ce n'est pas une maladie à guérir, c'est une façon différente de fonctionner. Mais aujourd'hui, il a les outils pour vivre avec ses particularités, et nous avons les ressources pour l'accompagner. C'est tout ce qu'on demandait."
            </p>
            <p className="text-sm text-gray-500 text-right mt-2">— Émilie & Thomas</p>
          </div>
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
            <Link href="/blog/bien-etre-aidants" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/bien-etre-aidants.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Prendre soin de soi</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">L'importance du répit pour les parents aidants.</p>
              </div>
            </Link>
            <Link href="/blog/preparer-consultation" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/consultation.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Préparer une consultation</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Comment préparer son enfant.</p>
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
