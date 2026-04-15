import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quel professionnel pour votre enfant autiste ou TDAH ? | NeuroCare',
  description:
    "Psychologue, orthophoniste, psychomotricien, ergothérapeute, neuropsychologue, éducateur spécialisé : le guide complet pour choisir le bon professionnel TND.",
  alternates: { canonical: 'https://neuro-care.fr/blog/quel-professionnel-choisir-tnd' },
  openGraph: {
    title: 'Quel professionnel pour votre enfant autiste ou TDAH ? Le guide complet',
    description: 'Comparatif des professionnels du neurodéveloppement pour orienter au mieux votre enfant.',
    url: 'https://neuro-care.fr/blog/quel-professionnel-choisir-tnd',
    type: 'article',
  },
};

export default function ArticleQuelProfessionnel() {
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
          style={{ backgroundImage: "url('/images/articles/choisir-professionnel.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            Professionnels
          </span>
          <span>8 avril 2026</span>
          <span>•</span>
          <span>9 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Quel professionnel pour votre enfant autiste ou TDAH ? Le guide complet
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Votre enfant vient de recevoir un diagnostic de TSA, TDAH ou trouble DYS -- ou vous êtes en cours de démarche. La question qui revient le plus souvent est : "Par quel professionnel commencer ?" Entre éducateur spécialisé, psychologue, orthophoniste et psychomotricien, il n'est pas toujours facile de s'y retrouver. Ce guide vous aide à comprendre le rôle de chacun pour faire le meilleur choix.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">L'éducateur spécialisé : le pilier du quotidien</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            L'éducateur spécialisé intervient au coeur du quotidien de votre enfant. Son rôle est d'accompagner le développement de l'autonomie, des habiletés sociales et des compétences adaptatives. Il travaille souvent à domicile, à l'école ou dans un lieu de vie, en situation concrète.
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Quand consulter :</strong> difficultés dans les gestes du quotidien (habillage, repas, hygiène), problèmes de comportement, besoin de structurer les routines</li>
            <li><strong>Méthodes utilisées :</strong> ABA, TEACCH, PECS, scénarios sociaux, renforcement positif</li>
            <li><strong>Fréquence type :</strong> 2 à 10 heures par semaine selon les besoins</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Le psychologue : comprendre et accompagner</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Le psychologue (clinicien ou neuropsychologue) joue un rôle central dans l'évaluation et le suivi psychologique. Il peut réaliser des bilans cognitifs, accompagner l'enfant sur le plan émotionnel et guider les parents dans leur compréhension du trouble.
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Quand consulter :</strong> anxiété, difficultés émotionnelles, besoin d'un bilan psychométrique (QI), accompagnement parental</li>
            <li><strong>Spécificité du neuropsychologue :</strong> il évalue les fonctions cognitives (attention, mémoire, fonctions exécutives) et pose un profil précis des forces et difficultés</li>
            <li><strong>Fréquence type :</strong> 1 séance par semaine à 1 par mois selon l'objectif</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">L'orthophoniste : bien au-delà du langage</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            On pense souvent que l'orthophoniste ne s'occupe que de la prononciation. En réalité, ce professionnel intervient sur l'ensemble de la communication : langage oral, langage écrit, compréhension, pragmatique du langage (savoir utiliser le langage en contexte social) et même l'alimentation (troubles de l'oralité).
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Quand consulter :</strong> retard de langage, difficultés de compréhension, troubles de la lecture ou de l'écriture (dyslexie, dysorthographie), troubles de l'oralité alimentaire</li>
            <li><strong>Pour les enfants non-verbaux :</strong> mise en place de moyens de communication alternatifs (pictogrammes, tablettes, PECS, Makaton)</li>
            <li><strong>Remboursement :</strong> sur prescription médicale, pris en charge par la Sécurité sociale</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Le psychomotricien : le corps comme outil</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Le psychomotricien travaille sur le lien entre le corps et l'esprit. Il aide l'enfant à mieux percevoir son corps, à réguler ses émotions par le mouvement et à développer sa motricité fine et globale. C'est un professionnel particulièrement indiqué pour les enfants avec des particularités sensorielles.
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Quand consulter :</strong> maladresse motrice, difficultés d'écriture (dysgraphie), agitation, difficultés de régulation émotionnelle, hypersensibilité ou hyposensibilité sensorielle</li>
            <li><strong>Particulièrement adapté pour :</strong> le TDAH (régulation de l'impulsivité par le corps), le TSA (intégration sensorielle), la dyspraxie</li>
            <li><strong>Remboursement :</strong> non remboursé par la Sécurité sociale, mais possible via la MDPH ou certaines mutuelles</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">L'ergothérapeute : adapter l'environnement</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            L'ergothérapeute se concentre sur l'adaptation de l'environnement et des outils pour favoriser l'autonomie de l'enfant. Il analyse les situations de vie concrètes (école, maison, loisirs) et propose des aménagements et des stratégies compensatoires.
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Quand consulter :</strong> difficultés scolaires liées à la motricité fine (découpage, écriture), besoin d'aménagements scolaires, difficultés dans les activités du quotidien</li>
            <li><strong>Apports spécifiques :</strong> recommandations d'outils (logiciels, supports adaptés), aménagements du poste de travail scolaire, dossier pour la MDPH</li>
            <li><strong>Remboursement :</strong> non remboursé par la Sécurité sociale, financement possible via l'AEEH ou la PCH</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Le neuropsychologue : cartographier le fonctionnement cognitif</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Le neuropsychologue réalise des bilans approfondis des fonctions cognitives : attention, mémoire de travail, vitesse de traitement, fonctions exécutives (planification, flexibilité, inhibition). Son bilan est souvent indispensable pour affiner le diagnostic et orienter les prises en charge.
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Quand consulter :</strong> suspicion de TDAH, difficultés scolaires inexpliquées, besoin de comprendre le profil cognitif de l'enfant pour adapter les apprentissages</li>
            <li><strong>Son bilan permet :</strong> de poser ou confirmer un diagnostic de TDAH, de mettre en évidence un haut potentiel, de repérer des troubles DYS associés</li>
            <li><strong>Fréquence :</strong> généralement un bilan initial puis un bilan de suivi tous les 2-3 ans</li>
          </ul>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 sm:p-6 my-6 sm:my-8 rounded-r-lg">
            <h4 className="font-bold text-purple-800 mb-2 text-sm sm:text-base">Tableau récapitulatif</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-gray-700 mt-2">
                <thead>
                  <tr className="border-b border-purple-200">
                    <th className="text-left py-2 pr-3 font-semibold text-purple-900">Professionnel</th>
                    <th className="text-left py-2 pr-3 font-semibold text-purple-900">Idéal pour</th>
                    <th className="text-left py-2 font-semibold text-purple-900">Remboursé</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-purple-100">
                    <td className="py-2 pr-3">Éducateur spécialisé</td>
                    <td className="py-2 pr-3">Autonomie, comportement, habiletés sociales</td>
                    <td className="py-2">MDPH / PCH</td>
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="py-2 pr-3">Psychologue</td>
                    <td className="py-2 pr-3">Émotions, anxiété, guidance parentale</td>
                    <td className="py-2">MonPsy / mutuelle</td>
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="py-2 pr-3">Orthophoniste</td>
                    <td className="py-2 pr-3">Langage, communication, oralité</td>
                    <td className="py-2">Sécurité sociale</td>
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="py-2 pr-3">Psychomotricien</td>
                    <td className="py-2 pr-3">Motricité, sensoriel, régulation</td>
                    <td className="py-2">MDPH / mutuelle</td>
                  </tr>
                  <tr className="border-b border-purple-100">
                    <td className="py-2 pr-3">Ergothérapeute</td>
                    <td className="py-2 pr-3">Adaptations scolaires, autonomie quotidienne</td>
                    <td className="py-2">MDPH / AEEH</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Neuropsychologue</td>
                    <td className="py-2 pr-3">Bilan cognitif, diagnostic TDAH/DYS</td>
                    <td className="py-2">Non (sauf hôpital)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Comment choisir ? Nos conseils pratiques</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Il n'y a pas de réponse universelle. Le bon professionnel dépend des besoins spécifiques de votre enfant. Voici quelques principes pour vous guider :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li><strong>Partez des besoins prioritaires :</strong> votre enfant ne parle pas ? Commencez par l'orthophoniste. Il est très agité et maladroit ? Le psychomotricien sera un bon point de départ</li>
            <li><strong>Demandez l'avis du médecin coordinateur :</strong> votre pédiatre ou le médecin du CRA peut vous aider à prioriser les prises en charge</li>
            <li><strong>Vérifiez la spécialisation :</strong> un professionnel formé aux TND fera une différence considérable. Demandez quelle est son expérience avec l'autisme, le TDAH ou les troubles DYS</li>
            <li><strong>Ne surchargez pas l'emploi du temps :</strong> mieux vaut 2-3 prises en charge bien ciblées qu'un planning surchargé qui épuise l'enfant et la famille</li>
            <li><strong>Faites confiance au feeling :</strong> le lien entre le professionnel et votre enfant est essentiel. Si ça ne "matche" pas après quelques séances, n'hésitez pas à changer</li>
          </ul>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 sm:p-6 my-6 sm:my-8 rounded-r-lg">
            <h4 className="font-bold text-teal-800 mb-2 text-sm sm:text-base">NeuroCare vous aide à trouver le bon professionnel</h4>
            <p className="text-teal-700 text-sm sm:text-base mb-3">
              Sur NeuroCare, vous pouvez rechercher des professionnels par spécialité, par localisation et par type de trouble accompagné. Chaque profil indique clairement les méthodes utilisées, l'expérience et les créneaux disponibles. Fini le parcours du combattant pour trouver le bon accompagnement.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              Trouver un professionnel près de chez vous
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Conclusion</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Chaque professionnel apporte une pièce du puzzle dans l'accompagnement de votre enfant. L'idéal est souvent une approche pluridisciplinaire, où chacun intervient dans son domaine de compétence et communique avec les autres. Ne vous sentez pas obligé de tout mettre en place d'un coup : avancez étape par étape, en fonction des priorités et des capacités de votre enfant. Et surtout, n'oubliez pas que vous, parents, êtes les experts de votre enfant. Votre voix compte dans chaque décision.
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
            <Link href="/blog/signes-autisme-enfant" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/signes-autisme.jpg')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Signes de l'autisme chez l'enfant</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Repérez les premiers signes âge par âge.</p>
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
