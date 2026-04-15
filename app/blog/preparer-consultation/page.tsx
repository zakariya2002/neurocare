import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Préparer son enfant à une première consultation | NeuroCare',
  description:
    "Comment préparer votre enfant (et vous-même) à une première consultation avec un psychologue, psychomotricien ou éducateur spécialisé.",
  alternates: { canonical: 'https://neuro-care.fr/blog/preparer-consultation' },
  openGraph: {
    title: 'Préparer son enfant à une première consultation',
    description: 'Nos conseils pour aborder sereinement une première consultation avec un professionnel TND.',
    url: 'https://neuro-care.fr/blog/preparer-consultation',
    type: 'article',
  },
};

export default function ArticlePreparerConsultation() {
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
          style={{ backgroundImage: "url('/images/articles/consultation.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)', color: '#027e7e' }}>
            Guides pratiques
          </span>
          <span>25 décembre 2024</span>
          <span>•</span>
          <span>7 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Comment préparer son enfant à une première consultation avec un professionnel TND
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8">
            La première consultation avec un professionnel spécialisé dans les troubles du neurodéveloppement peut être source d'appréhension, tant pour les parents que pour l'enfant. Ce guide vous accompagne pas à pas pour que cette première rencontre se déroule dans les meilleures conditions.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Avant le rendez-vous : la préparation</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Expliquer le rendez-vous à son enfant</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Adaptez votre explication à l'âge et à la compréhension de votre enfant :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>Pour les plus jeunes (3-6 ans)</strong> : "On va rencontrer quelqu'un qui aide les enfants à se sentir mieux. Il/elle va te proposer des jeux et discuter avec toi."</li>
            <li><strong>Pour les enfants plus grands (7-12 ans)</strong> : "Ce professionnel est spécialisé pour aider les enfants qui pensent ou ressentent les choses différemment."</li>
            <li><strong>Pour les adolescents</strong> : Impliquez-les dans la démarche et demandez-leur s'ils ont des questions.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Utiliser des supports visuels</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Pour les enfants qui ont besoin de prévisibilité :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Montrez une photo du cabinet ou du professionnel (souvent disponible sur leur profil NeuroCare)</li>
            <li>Créez un planning visuel de la journée incluant le rendez-vous</li>
            <li>Utilisez des pictogrammes pour illustrer les différentes étapes</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Préparer un dossier complet</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Rassemblez les documents utiles :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Carnet de santé</li>
            <li>Bilans précédents (orthophoniste, psychologue, médecin...)</li>
            <li>Bulletins scolaires ou observations des enseignants</li>
            <li>Liste des médicaments éventuels</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Le jour J : conseils pratiques</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Gérer le timing</h3>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>Prévoyez large</strong> : Arrivez 10-15 minutes en avance pour éviter le stress</li>
            <li><strong>Choisissez le bon moment</strong> : Programmez le rendez-vous quand votre enfant est généralement de bonne humeur</li>
            <li><strong>Anticipez le trajet</strong> : Faites le trajet une première fois si nécessaire</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Apporter des objets rassurants</h3>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Doudou ou objet transitionnel</li>
            <li>Casque anti-bruit si sensibilité auditive</li>
            <li>Fidgets ou objets à manipuler</li>
            <li>Collation et eau</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Pendant la consultation</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">Votre rôle en tant que parent</h3>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li><strong>Soyez authentique</strong> : Décrivez les difficultés sans minimiser ni dramatiser</li>
            <li><strong>Apportez des exemples concrets</strong> : "Le matin, il met 45 minutes à s'habiller seul"</li>
            <li><strong>Parlez aussi des forces</strong> : Les professionnels ont besoin d'une vision complète</li>
            <li><strong>Posez vos questions</strong> : Aucune question n'est stupide</li>
          </ul>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 my-8 rounded-r-lg">
            <h4 className="font-bold text-teal-800 mb-2">Ce à quoi s'attendre</h4>
            <p className="text-teal-700">
              Une première consultation dure généralement entre 45 minutes et 1h30. Elle peut inclure un entretien avec les parents, des observations de l'enfant en situation de jeu, et des questionnaires à remplir.
            </p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Après la consultation</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Prenez quelques minutes pour :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Débriefer avec votre enfant et valoriser sa participation</li>
            <li>Noter les points clés et recommandations</li>
            <li>Planifier le suivi si nécessaire</li>
            <li>Demander un compte-rendu écrit</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Conclusion</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Une première consultation bien préparée permet d'établir une relation de confiance avec le professionnel. N'oubliez pas que ce rendez-vous est le début d'un parcours : il n'y a pas d'urgence à tout comprendre immédiatement.
          </p>
          <p className="text-sm sm:text-base text-gray-700">
            Chez NeuroCare, tous nos professionnels sont vérifiés et spécialisés dans l'accompagnement des troubles du neurodéveloppement. Vous pouvez consulter leur profil et lire les avis d'autres familles avant de prendre rendez-vous.
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
            <Link href="/blog/crises-sensorielles" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/crises-sensorielles.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Gérer les crises sensorielles</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Techniques et outils pratiques pour accompagner votre enfant.</p>
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
