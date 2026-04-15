import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Signes de l'autisme chez l'enfant : guide complet pour les parents | NeuroCare",
  description:
    "Repérez les premiers signes de l'autisme chez votre enfant : signaux à 6 mois, 12 mois, 2 ans et 3 ans. Quand consulter et quelles démarches entreprendre.",
  alternates: { canonical: 'https://neuro-care.fr/blog/signes-autisme-enfant' },
  openGraph: {
    title: "Quels sont les signes de l'autisme chez l'enfant ? Guide pour les parents",
    description: "Identifier les signes d'autisme par âge et savoir quand consulter un professionnel.",
    url: 'https://neuro-care.fr/blog/signes-autisme-enfant',
    type: 'article',
  },
};

export default function ArticleSignesAutisme() {
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
          style={{ backgroundImage: "url('/images/articles/signes-autisme.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            Diagnostic
          </span>
          <span>8 avril 2026</span>
          <span>•</span>
          <span>8 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Quels sont les signes de l'autisme chez l'enfant ? Guide pour les parents
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Vous avez remarqué que votre enfant ne réagit pas tout à fait comme les autres enfants de son âge ? Certains comportements vous interpellent sans que vous puissiez mettre un mot dessus ? Repérer les premiers signes de l'autisme (trouble du spectre de l'autisme, ou TSA) est essentiel pour agir tôt. Plus l'accompagnement est précoce, plus il est efficace. Voici un guide concret, âge par âge, pour vous aider à y voir plus clair.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Pourquoi le repérage précoce est-il important ?</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Le cerveau d'un jeune enfant possède une plasticité remarquable. Entre 0 et 5 ans, les connexions neuronales se forment à une vitesse incroyable. C'est pourquoi une intervention précoce -- même avant un diagnostic formel -- peut modifier significativement la trajectoire de développement d'un enfant autiste. En France, l'âge moyen du diagnostic tourne encore autour de 4 à 5 ans, alors que des signes peuvent être repérés dès les premiers mois de vie. Chaque mois gagné compte.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 sm:p-6 my-6 sm:my-8 rounded-r-lg">
            <h4 className="font-bold text-blue-800 mb-2 text-sm sm:text-base">Attention</h4>
            <p className="text-blue-700 text-sm sm:text-base">
              La présence d'un ou deux signes isolés ne signifie pas que votre enfant est autiste. C'est l'accumulation de plusieurs signes, leur persistance dans le temps et leur intensité qui doivent vous alerter. Seul un professionnel qualifié peut poser un diagnostic.
            </p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les signes entre 6 et 12 mois</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            À cet âge, les signes sont subtils et souvent difficiles à distinguer d'une simple variation dans le rythme de développement. Toutefois, certains comportements méritent une attention particulière :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Peu ou pas de contact visuel</strong> : le bébé ne cherche pas le regard de ses parents, détourne les yeux ou fixe des objets plutôt que des visages</li>
            <li><strong>Absence de sourire social</strong> : il ne sourit pas en réponse à un sourire ou à une interaction avec l'adulte</li>
            <li><strong>Pas de babillage</strong> : à 9 mois, le bébé ne produit pas de sons variés (ba-ba, ma-ma, da-da)</li>
            <li><strong>Pas de gestes communicatifs</strong> : il ne tend pas les bras pour être porté et ne pointe pas du doigt</li>
            <li><strong>Réactions inhabituelles aux sons</strong> : il ne se retourne pas quand on l'appelle par son prénom ou semble ne pas entendre certains bruits</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les signes entre 12 et 24 mois</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            C'est souvent à cet âge que les parents commencent à s'inquiéter, car les écarts de développement deviennent plus visibles par rapport aux autres enfants :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Retard de langage</strong> : pas de premiers mots à 16 mois, ou perte de mots déjà acquis (régression)</li>
            <li><strong>Absence de pointage proto-déclaratif</strong> : l'enfant ne montre pas du doigt pour partager un intérêt (un avion dans le ciel, un chien dans la rue)</li>
            <li><strong>Jeu répétitif</strong> : il aligne des objets, fait tourner des roues, ouvre et ferme une porte de manière répétitive plutôt que de jouer de façon variée</li>
            <li><strong>Peu d'intérêt pour les autres enfants</strong> : il ne cherche pas à interagir avec ses pairs, préfère jouer seul</li>
            <li><strong>Réactions sensorielles atypiques</strong> : il se bouche les oreilles, évite certaines textures alimentaires ou de vêtements, ou au contraire recherche intensément certaines sensations</li>
            <li><strong>Difficultés avec les changements</strong> : crises intenses lors d'un changement de routine ou d'environnement</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les signes entre 2 et 3 ans</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            À cet âge, les signes du TSA se précisent et d'autres comportements caractéristiques peuvent apparaître :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Langage atypique</strong> : écholalie (répétition de phrases entendues), inversion des pronoms (dit "tu" au lieu de "je"), ton de voix monotone ou chantant</li>
            <li><strong>Pas de jeu symbolique</strong> : ne fait pas semblant (nourrir une poupée, faire la cuisine, jouer au docteur)</li>
            <li><strong>Intérêts restreints et intenses</strong> : fascination exclusive pour un sujet (les chiffres, les dinosaures, les trains) au détriment d'autres activités</li>
            <li><strong>Difficultés dans les interactions sociales</strong> : ne comprend pas les émotions des autres, ne partage pas spontanément ses joies ou ses découvertes</li>
            <li><strong>Comportements stéréotypés</strong> : battements de mains (flapping), balancements, marche sur la pointe des pieds</li>
            <li><strong>Rigidité comportementale</strong> : besoin impérieux de suivre les mêmes routines, mêmes trajets, même assiette</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Quand consulter ?</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            N'attendez pas d'avoir la certitude pour agir. Si vous observez plusieurs de ces signes chez votre enfant, il est recommandé de consulter rapidement. Voici les étapes à suivre :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Votre médecin ou pédiatre</strong> : c'est le premier interlocuteur. Il pourra réaliser un bilan de développement et vous orienter vers un spécialiste</li>
            <li><strong>Le médecin de PMI</strong> : pour les enfants de moins de 6 ans, la Protection Maternelle et Infantile offre un suivi gratuit et peut repérer les troubles du développement</li>
            <li><strong>Un Centre de Ressources Autisme (CRA)</strong> : présent dans chaque région, il propose des évaluations diagnostiques pluridisciplinaires</li>
            <li><strong>Un neuropédiatre ou pédopsychiatre</strong> : pour un bilan approfondi et un diagnostic formel</li>
          </ul>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-6 my-6 sm:my-8 rounded-r-lg">
            <h4 className="font-bold text-amber-800 mb-2 text-sm sm:text-base">Conseil important</h4>
            <p className="text-amber-700 text-sm sm:text-base">
              Ne laissez personne vous dire "attendez, ça va venir" si votre instinct vous dit le contraire. Les parents sont souvent les premiers à percevoir que quelque chose est différent. Votre ressenti est légitime et mérite d'être entendu par un professionnel compétent.
            </p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Que faire en attendant le diagnostic ?</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Les délais pour obtenir un diagnostic peuvent être longs (parfois plus d'un an). Mais cela ne signifie pas qu'il faut rester inactif :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Commencez les prises en charge</strong> : orthophonie, psychomotricité, éducation spécialisée. Un diagnostic n'est pas nécessaire pour commencer un accompagnement</li>
            <li><strong>Documentez vos observations</strong> : notez les comportements qui vous interpellent avec des dates, prenez des vidéos. Cela sera précieux pour les professionnels</li>
            <li><strong>Renseignez-vous</strong> : informez-vous auprès de sources fiables (HAS, associations comme Autisme France, CRA de votre région)</li>
            <li><strong>Prenez soin de vous</strong> : le parcours diagnostic est éprouvant. N'hésitez pas à rejoindre des groupes de parents pour échanger et trouver du soutien</li>
          </ul>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 sm:p-6 my-6 sm:my-8 rounded-r-lg">
            <h4 className="font-bold text-teal-800 mb-2 text-sm sm:text-base">Trouvez un professionnel sur NeuroCare</h4>
            <p className="text-teal-700 text-sm sm:text-base mb-3">
              NeuroCare vous permet de trouver rapidement des professionnels spécialisés dans l'accompagnement des enfants TSA près de chez vous : orthophonistes, psychomotriciens, éducateurs spécialisés, psychologues et bien d'autres.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              Rechercher un professionnel
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Conclusion</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Repérer les signes précoces de l'autisme n'est pas toujours facile, mais c'est un acte essentiel pour offrir à votre enfant les meilleures chances de développement. Faites confiance à votre instinct, consultez sans attendre et n'hésitez pas à demander un deuxième avis si nécessaire. Le chemin peut sembler long, mais vous n'êtes pas seul : des professionnels compétents et des outils comme NeuroCare sont là pour vous accompagner à chaque étape.
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
            <Link href="/blog/quel-professionnel-choisir-tnd" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/choisir-professionnel.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Quel professionnel pour votre enfant TND ?</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Le guide complet pour choisir le bon professionnel.</p>
              </div>
            </Link>
            <Link href="/blog/preparer-consultation" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/consultation.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Préparer une première consultation</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Nos conseils pour bien préparer la première visite.</p>
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
