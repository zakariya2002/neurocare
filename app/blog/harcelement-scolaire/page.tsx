import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Harcèlement scolaire et enfants TND : repérer et agir | NeuroCare',
  description:
    "Les enfants TSA/TDAH sont particulièrement exposés au harcèlement scolaire. Signaux d'alerte, démarches et recours pour protéger votre enfant.",
  alternates: { canonical: 'https://neuro-care.fr/blog/harcelement-scolaire' },
  openGraph: {
    title: 'Harcèlement scolaire et enfants TND : repérer et agir',
    description: "Comment détecter le harcèlement et défendre les droits d'un enfant TND à l'école.",
    url: 'https://neuro-care.fr/blog/harcelement-scolaire',
    type: 'article',
  },
};

export default function ArticleHarcelementScolaire() {
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
          style={{ backgroundImage: "url('/images/articles/harcelement.png')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <span className="px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)', color: '#027e7e' }}>
            Éducation
          </span>
          <span>15 décembre 2024</span>
          <span>•</span>
          <span>8 min de lecture</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
          Harcèlement scolaire et TSA : Comment protéger son enfant ?
        </h1>

        {/* Content */}
        <div className="prose prose-sm sm:prose-lg max-w-none">
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Les enfants avec un trouble du spectre de l'autisme (TSA) sont malheureusement plus exposés au harcèlement scolaire. Comprendre les mécanismes et connaître les stratégies de protection est essentiel pour les parents et les professionnels.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Pourquoi les enfants TSA sont-ils plus vulnérables ?</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Les difficultés de communication sociale, les comportements atypiques ou les centres d'intérêt spécifiques peuvent malheureusement faire des enfants autistes des cibles privilégiées. Leur difficulté à décoder les intentions des autres les rend également plus vulnérables aux manipulations.
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-6 text-sm sm:text-base text-gray-700 space-y-2">
            <li>Difficultés à comprendre les codes sociaux implicites</li>
            <li>Tendance à prendre les choses au premier degré</li>
            <li>Comportements ou intérêts perçus comme "différents"</li>
            <li>Isolement social qui peut les rendre plus vulnérables</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Les signes à surveiller</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Repérer le harcèlement peut être plus complexe chez un enfant autiste, car certains signes peuvent être confondus avec des manifestations du TSA. Soyez attentifs à :
          </p>
          <ul className="list-disc pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li>Un changement soudain de comportement (repli, agressivité)</li>
            <li>Un refus d'aller à l'école plus marqué qu'habituellement</li>
            <li>Des troubles du sommeil ou de l'alimentation</li>
            <li>Des affaires abîmées ou disparues</li>
            <li>Une augmentation des crises ou des comportements d'automutilation</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Stratégies de protection</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">1. Établir une communication ouverte</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Utilisez des supports visuels ou des scénarios sociaux pour aider votre enfant à identifier et exprimer les situations de harcèlement. Posez des questions concrètes : "Est-ce que quelqu'un t'a dit des mots méchants aujourd'hui ?"
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">2. Travailler avec l'école</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Impliquez l'équipe éducative dès le début de l'année. Demandez la mise en place d'un protocole de vigilance et identifiez un adulte référent que votre enfant peut solliciter.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">3. Développer les compétences sociales</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Les groupes d'habiletés sociales peuvent aider votre enfant à mieux comprendre les interactions et à développer des stratégies pour répondre aux moqueries.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 sm:mt-6 mb-2 sm:mb-3">4. Favoriser les amitiés protectrices</h3>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Encouragez les liens avec des camarades bienveillants. Un ou deux amis fidèles peuvent constituer un facteur de protection important.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Que faire en cas de harcèlement avéré ?</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            Si vous constatez une situation de harcèlement :
          </p>
          <ol className="list-decimal pl-5 sm:pl-6 mb-5 sm:mb-6 text-sm sm:text-base text-gray-700 space-y-1.5 sm:space-y-2">
            <li>Écoutez votre enfant sans minimiser ses ressentis</li>
            <li>Documentez les faits (dates, témoins, preuves)</li>
            <li>Alertez l'établissement par écrit</li>
            <li>Consultez un professionnel pour accompagner votre enfant</li>
            <li>Contactez les associations spécialisées si nécessaire</li>
          </ol>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 my-8 rounded-r-lg">
            <h4 className="font-bold text-teal-800 mb-2">Numéros utiles</h4>
            <p className="text-teal-700">
              <strong>3020</strong> - Numéro national contre le harcèlement scolaire (gratuit)<br />
              <strong>3018</strong> - Cyberharcèlement (gratuit)
            </p>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4">Conclusion</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-4">
            La prévention du harcèlement scolaire chez les enfants TSA passe par une vigilance accrue, une bonne communication avec l'école et un accompagnement adapté. N'hésitez pas à vous entourer de professionnels spécialisés pour vous accompagner.
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
            <Link href="/blog/nutrition" className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex-shrink-0" style={{ backgroundImage: "url('/images/articles/nutrition.png')", backgroundSize: 'cover' }} />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Nutrition et autisme</h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">Les bases d'une alimentation adaptée pour les personnes autistes.</p>
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
