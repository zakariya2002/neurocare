'use client'

import Link from 'next/link'

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-violet-600 hover:text-violet-700 font-semibold text-xl">
            ← NeuroCare
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions Légales</h1>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          {/* Éditeur */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Éditeur du site</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Nom du site :</strong> NeuroCare</p>
              <p><strong>URL :</strong> https://neuro-care.fr</p>
              <p><strong>Statut juridique :</strong> Auto-entrepreneur</p>
              <p><strong>Nom du responsable :</strong> Nebbache Zakariya</p>
              <p><strong>Adresse :</strong> 401 Avenue de Monsieur Teste, 34070 Montpellier</p>
              <p><strong>Email :</strong> contact@neuro-care.fr</p>
              <p><strong>SIREN :</strong> 994 397 735</p>
            </div>
          </section>

          {/* Hébergeur */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Hébergement</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Hébergeur du site :</strong> Vercel Inc.</p>
              <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
              <p><strong>Site web :</strong> https://vercel.com</p>
              <p className="mt-4"><strong>Hébergeur des données :</strong> Supabase Inc.</p>
              <p><strong>Adresse :</strong> 970 Toa Payoh North #07-04, Singapore 318992</p>
              <p><strong>Site web :</strong> https://supabase.com</p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Propriété intellectuelle</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                L'ensemble du contenu du site NeuroCare (textes, images, graphismes, logo, icônes,
                sons, logiciels, etc.) est la propriété exclusive de l'éditeur, à l'exception des marques,
                logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
              </p>
              <p>
                Toute reproduction, distribution, modification, adaptation, retransmission ou publication,
                même partielle, de ces différents éléments est strictement interdite sans l'accord exprès
                par écrit de l'éditeur.
              </p>
            </div>
          </section>

          {/* Responsabilité */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Limitation de responsabilité</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                NeuroCare s'efforce de fournir des informations aussi précises que possible.
                Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des
                carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires
                qui lui fournissent ces informations.
              </p>
              <p>
                NeuroCare est une plateforme de mise en relation entre familles et professionnels
                spécialisés. Nous ne sommes pas responsables des prestations fournies par les professionnels
                référencés sur notre plateforme.
              </p>
              <p>
                Les professionnels présents sur la plateforme sont indépendants.
                NeuroCare vérifie les diplômes et certifications déclarés mais n'est pas
                responsable de la qualité des interventions réalisées.
              </p>
            </div>
          </section>

          {/* Liens hypertextes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Liens hypertextes</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Le site NeuroCare peut contenir des liens hypertextes vers d'autres sites.
                Cependant, l'éditeur n'a pas la possibilité de vérifier le contenu des sites ainsi
                visités et n'assumera en conséquence aucune responsabilité de ce fait.
              </p>
            </div>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Droit applicable</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Les présentes mentions légales sont régies par les lois françaises. En cas de litige,
                les tribunaux français seront seuls compétents.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contact</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Pour toute question ou demande d'information concernant le site, ou tout signalement
                de contenu ou d'activités illicites, l'utilisateur peut contacter l'éditeur à l'adresse
                email suivante : <a href="mailto:contact@neuro-care.fr" className="text-violet-600 hover:underline">contact@neuro-care.fr</a>
              </p>
            </div>
          </section>

          {/* Date de mise à jour */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Dernière mise à jour : 30 novembre 2024
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/politique-confidentialite" className="text-violet-600 hover:underline">
            Politique de confidentialité
          </Link>
          <Link href="/cgu" className="text-violet-600 hover:underline">
            Conditions générales d'utilisation
          </Link>
        </div>
      </main>
    </div>
  )
}
