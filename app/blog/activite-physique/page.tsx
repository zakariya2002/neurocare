import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Activité physique et enfants TND : bouger pour mieux grandir | NeuroCare',
  description:
    "Pourquoi l'activité physique est essentielle pour les enfants TND (TSA, TDAH) : bénéfices, sports adaptés et conseils pratiques pour les familles.",
  alternates: { canonical: 'https://neuro-care.fr/blog/activite-physique' },
  openGraph: {
    title: 'Activité physique et enfants TND : bouger pour mieux grandir',
    description: "Bénéfices de l'activité physique pour les enfants TSA/TDAH et conseils de sports adaptés.",
    url: 'https://neuro-care.fr/blog/activite-physique',
    type: 'article',
  },
};

export default function ArticleActivitePhysique() {
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
          style={{ backgroundImage: "url('/images/articles/sport.png')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            Bien-être
          </span>
          <span>5 décembre 2024</span>
          <span>•</span>
          <span>7 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Sport et autisme : Les bienfaits de l'activité physique adaptée
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8">
            L'activité physique offre de nombreux bénéfices pour les personnes avec un trouble du spectre de l'autisme. Bien choisie et adaptée, elle peut améliorer le bien-être physique et mental, tout en développant les compétences sociales.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les bienfaits prouvés de l'activité physique</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Sur le plan physique</h3>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li>Amélioration de la coordination motrice et de l'équilibre</li>
            <li>Renforcement musculaire et meilleure posture</li>
            <li>Régulation du sommeil</li>
            <li>Gestion du poids et prévention des problèmes de santé</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Sur le plan psychologique</h3>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li>Réduction de l'anxiété et du stress</li>
            <li>Meilleure gestion des émotions</li>
            <li>Augmentation de l'estime de soi</li>
            <li>Diminution des comportements répétitifs</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Sur le plan social</h3>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li>Apprentissage des règles et du tour de rôle</li>
            <li>Développement des interactions avec les pairs</li>
            <li>Sentiment d'appartenance à un groupe</li>
            <li>Opportunités de créer des liens d'amitié</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Quels sports privilégier ?</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Le choix du sport dépend des préférences et du profil sensoriel de chaque personne. Voici quelques pistes :
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Sports individuels</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Souvent préférés car ils permettent de progresser à son rythme sans pression sociale :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Natation</strong> : L'eau procure un effet apaisant et la pression hydrostatique peut être régulante</li>
            <li><strong>Vélo</strong> : Excellente activité cardiovasculaire, procure une sensation de liberté</li>
            <li><strong>Course à pied</strong> : Activité régulière et prévisible, peut être pratiquée seul</li>
            <li><strong>Arts martiaux</strong> : Structure claire, rituels, respect des règles, maîtrise de soi</li>
            <li><strong>Escalade</strong> : Concentration, résolution de problèmes, gestion de la peur</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Sports avec animaux</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Le contact avec les animaux peut être très bénéfique :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Équitation</strong> : L'équithérapie combine bienfaits physiques et relationnels</li>
            <li><strong>Agility</strong> : Complicité avec un chien, parcours structuré</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Sports collectifs adaptés</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Si l'enfant est intéressé, certains sports d'équipe peuvent être envisagés avec des adaptations :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Football</strong> : Certains clubs proposent des créneaux adaptés</li>
            <li><strong>Basketball</strong> : Règles relativement simples à comprendre</li>
            <li><strong>Tennis en double</strong> : Travail d'équipe avec un partenaire unique</li>
          </ul>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 sm:p-6 my-6 sm:my-8 rounded-r-lg">
            <h4 className="font-bold text-green-800 mb-2 text-sm sm:text-base">Le saviez-vous ?</h4>
            <p className="text-green-700 text-sm sm:text-base">
              Le label "Autisme Sport" existe dans plusieurs fédérations sportives françaises pour identifier les clubs formés à l'accueil des personnes autistes.
            </p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Comment adapter la pratique ?</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">1. Préparer la séance</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Utilisez des supports visuels pour expliquer le déroulement : vestiaire, échauffement, exercices, fin de séance. La prévisibilité rassure.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">2. Adapter l'environnement</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Privilégiez les horaires calmes, évitez la surcharge sensorielle (musique trop forte, éclairage agressif). Prévoyez un espace de repli si nécessaire.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">3. Communiquer clairement</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Donnez des consignes courtes et précises. Démontrez plutôt que d'expliquer longuement. Utilisez le prénom avant de donner une instruction.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">4. Respecter le rythme</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Acceptez que certains jours soient moins productifs. Proposez des pauses régulières. Ne forcez jamais la participation.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">5. Valoriser les progrès</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Chaque petit progrès compte. Utilisez des renforcements positifs adaptés aux intérêts de la personne.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Activités physiques à la maison</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Pas besoin d'un club pour bouger ! Voici des idées d'activités à faire à la maison :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li>Parcours moteurs avec coussins, cerceaux, tunnels</li>
            <li>Yoga adapté avec des vidéos pour enfants</li>
            <li>Trampoline (excellent pour l'intégration sensorielle)</li>
            <li>Jeux vidéo actifs (Just Dance, Ring Fit Adventure...)</li>
            <li>Ballon de gym pour travailler l'équilibre</li>
            <li>Promenades quotidiennes avec un itinéraire fixe</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Trouver le bon encadrement</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            L'accompagnement par des professionnels formés fait toute la différence. Recherchez :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li>Des éducateurs sportifs APA (Activités Physiques Adaptées)</li>
            <li>Des clubs labellisés "Sport et Handicap" ou "Autisme Sport"</li>
            <li>Des psychomotriciens pour un travail plus individualisé</li>
            <li>Des associations proposant des activités spécifiques TSA</li>
          </ul>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 sm:p-6 my-6 sm:my-8 rounded-r-lg">
            <h4 className="font-bold text-teal-800 mb-2 text-sm sm:text-base">Sur NeuroCare</h4>
            <p className="text-teal-700 text-sm sm:text-base">
              Retrouvez des professionnels spécialisés en activités physiques adaptées près de chez vous sur notre plateforme. Filtrez par spécialité "Psychomotricité" ou "Sport adapté".
            </p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Conclusion</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            L'activité physique est un formidable outil pour améliorer la qualité de vie des personnes autistes. L'essentiel est de trouver l'activité qui correspond aux goûts et au profil de chacun, dans un environnement bienveillant et adapté. N'hésitez pas à essayer plusieurs sports avant de trouver le bon !
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
            <Link href="/blog/nutrition" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/nutrition.png')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Nutrition et autisme</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Les bases d'une alimentation adaptée.</p>
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
