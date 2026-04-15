'use client'

import Link from 'next/link'

export default function CGU() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions Générales d'Utilisation</h1>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          {/* Article 1 - Objet */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 1 - Objet</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les
                modalités d'accès et d'utilisation de la plateforme NeuroCare, accessible à
                l'adresse https://neuro-care.fr
              </p>
              <p>
                NeuroCare est une plateforme de mise en relation entre les familles ayant un
                enfant avec un Trouble du Spectre de l'Autisme (TSA) et les éducateurs spécialisés
                diplômés.
              </p>
            </div>
          </section>

          {/* Article 2 - Acceptation */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 2 - Acceptation des CGU</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                L'inscription sur la plateforme implique l'acceptation pleine et entière des présentes CGU.
                Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.
              </p>
              <p>
                NeuroCare se réserve le droit de modifier les présentes CGU à tout moment.
                Les utilisateurs seront informés de toute modification par email ou notification sur le site.
              </p>
            </div>
          </section>

          {/* Article 3 - Services */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 3 - Description des services</h2>
            <div className="text-gray-600 space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">3.1 Pour les familles (gratuit) :</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Création d'un profil famille</li>
                  <li>Recherche d'éducateurs spécialisés par localisation et compétences</li>
                  <li>Consultation des profils d'éducateurs vérifiés</li>
                  <li>Prise de contact et messagerie avec les éducateurs</li>
                  <li>Prise de rendez-vous en ligne</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">3.2 Pour les éducateurs :</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Création d'un profil professionnel</li>
                  <li>Visibilité auprès des familles</li>
                  <li>Gestion des disponibilités et des rendez-vous</li>
                  <li>Messagerie avec les familles</li>
                  <li>Commission de 12% prélevée sur les rendez-vous réservés et encaissés via la plateforme</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Article 4 - Inscription */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 4 - Inscription et compte utilisateur</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                <strong>4.1 Conditions d'inscription :</strong> L'inscription est réservée aux personnes
                majeures (18 ans minimum). Les familles s'inscrivent en leur nom propre pour le compte
                de leur enfant mineur.
              </p>
              <p>
                <strong>4.2 Exactitude des informations :</strong> L'utilisateur s'engage à fournir des
                informations exactes et à jour. Toute fausse déclaration peut entraîner la suspension
                ou la suppression du compte.
              </p>
              <p>
                <strong>4.3 Confidentialité du compte :</strong> L'utilisateur est responsable de la
                confidentialité de ses identifiants de connexion. Toute activité effectuée depuis son
                compte est présumée être de son fait.
              </p>
              <p>
                <strong>4.4 Un compte par personne :</strong> Chaque utilisateur ne peut créer qu'un
                seul compte sur la plateforme.
              </p>
            </div>
          </section>

          {/* Article 5 - Éducateurs */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 5 - Obligations spécifiques des éducateurs</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                <strong>5.1 Qualifications :</strong> Les éducateurs s'engagent à détenir les diplômes
                et certifications qu'ils déclarent sur leur profil. Les documents justificatifs seront
                vérifiés par notre équipe.
              </p>
              <p>
                <strong>5.2 Statut professionnel :</strong> Les éducateurs doivent être en règle avec
                leurs obligations légales (déclaration d'activité, assurance professionnelle, etc.).
              </p>
              <p>
                <strong>5.3 Indépendance :</strong> Les éducateurs exercent leur activité de manière
                indépendante. NeuroCare n'est pas leur employeur et n'intervient pas dans la
                relation contractuelle entre l'éducateur et la famille.
              </p>
              <p>
                <strong>5.4 Tarification :</strong> Les éducateurs fixent librement leurs tarifs.
                Une commission de 12% est prélevée sur les rendez-vous réservés via la plateforme.
              </p>
            </div>
          </section>

          {/* Article 6 - Familles */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 6 - Obligations spécifiques des familles</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                <strong>6.1 Informations sur l'enfant :</strong> Les familles s'engagent à fournir des
                informations exactes concernant les besoins de leur enfant afin de permettre un
                accompagnement adapté.
              </p>
              <p>
                <strong>6.2 Respect des rendez-vous :</strong> Les familles s'engagent à respecter les
                rendez-vous pris avec les éducateurs ou à les annuler dans un délai raisonnable
                (48h minimum).
              </p>
              <p>
                <strong>6.3 Paiement :</strong> Le paiement des prestations s'effectue directement
                entre la famille et l'éducateur, selon les modalités convenues entre eux.
              </p>
            </div>
          </section>

          {/* Article 7 - Modèle économique */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 7 - Modèle économique et paiements (Professionnels)</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                <strong>7.1 Utilisation gratuite :</strong> L'inscription, la création et la gestion du
                profil professionnel, la messagerie avec les familles ainsi que la gestion des
                rendez-vous (agenda, disponibilités, confirmations) sont entièrement gratuites pour
                le professionnel. Aucun abonnement n'est requis pour accéder aux fonctionnalités de
                la plateforme.
              </p>
              <p>
                <strong>7.2 Commission plateforme :</strong> NeuroCare se rémunère exclusivement par
                une commission de 12% TTC, prélevée automatiquement sur le montant de chaque
                rendez-vous réservé et encaissé via la plateforme. Cette commission est prélevée au
                moment de l'encaissement du paiement du bénéficiaire, via Stripe Connect. Aucune
                commission n'est due sur les rendez-vous non encaissés via la plateforme.
              </p>
              <p>
                <strong>7.3 Paiements des rendez-vous :</strong> Les paiements des familles sont
                encaissés via notre prestataire de paiement Stripe Connect. Après déduction de la
                commission mentionnée à l'article 7.2, le solde est reversé au professionnel sur son
                compte bancaire associé à son compte Stripe, dans les délais de versement standards
                appliqués par Stripe. Le professionnel reconnaît avoir pris connaissance et accepté
                les conditions générales de Stripe applicables à son compte Connect.
              </p>
              <p>
                <strong>7.4 Facturation :</strong> Pour chaque transaction encaissée via la plateforme,
                le professionnel reçoit une facture automatique détaillant le montant brut du
                rendez-vous, la commission prélevée par NeuroCare et le montant net reversé. Ces
                documents sont accessibles depuis le tableau de bord du professionnel.
              </p>
              <p>
                <strong>7.5 Résiliation du compte :</strong> Le professionnel peut fermer son compte
                à tout moment et sans frais depuis son tableau de bord. La fermeture du compte
                entraîne la cessation de l'accès aux services de la plateforme. Les rendez-vous déjà
                encaissés et les obligations de reversement associées demeurent régis par les
                présentes CGU jusqu'à leur complet dénouement.
              </p>
            </div>
          </section>

          {/* Article 8 - Comportement */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 8 - Règles de conduite</h2>
            <div className="text-gray-600 space-y-3">
              <p>Les utilisateurs s'engagent à :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Respecter les autres utilisateurs et adopter un comportement courtois</li>
                <li>Ne pas publier de contenu illicite, diffamatoire ou offensant</li>
                <li>Ne pas utiliser la plateforme à des fins commerciales non autorisées</li>
                <li>Ne pas tenter de contourner les mesures de sécurité</li>
                <li>Ne pas collecter des données personnelles d'autres utilisateurs</li>
                <li>Signaler tout comportement inapproprié à l'équipe NeuroCare</li>
              </ul>
            </div>
          </section>

          {/* Article 9 - Responsabilité */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 9 - Responsabilité</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                <strong>9.1 Rôle d'intermédiaire :</strong> NeuroCare agit uniquement en qualité
                d'intermédiaire technique. Nous ne sommes pas partie aux contrats conclus entre les
                familles et les éducateurs.
              </p>
              <p>
                <strong>9.2 Vérification des profils :</strong> Nous vérifions les diplômes et
                certifications des éducateurs mais ne garantissons pas la qualité des prestations
                fournies.
              </p>
              <p>
                <strong>9.3 Disponibilité :</strong> Nous nous efforçons d'assurer la disponibilité
                de la plateforme mais ne garantissons pas un accès ininterrompu.
              </p>
              <p>
                <strong>9.4 Limitation :</strong> La responsabilité d'NeuroCare ne peut excéder
                le montant des sommes versées par l'utilisateur au cours des 12 derniers mois.
              </p>
            </div>
          </section>

          {/* Article 10 - Données personnelles */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 10 - Données personnelles</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Le traitement des données personnelles est régi par notre{' '}
                <Link href="/politique-confidentialite" className="text-violet-600 hover:underline">
                  Politique de Confidentialité
                </Link>
                , qui fait partie intégrante des présentes CGU.
              </p>
            </div>
          </section>

          {/* Article 11 - Propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 11 - Propriété intellectuelle</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                La marque NeuroCare, le logo, le design et l'ensemble des contenus du site
                sont protégés par les droits de propriété intellectuelle. Toute reproduction non
                autorisée est interdite.
              </p>
              <p>
                Les utilisateurs conservent leurs droits sur le contenu qu'ils publient mais
                accordent à NeuroCare une licence d'utilisation pour l'affichage sur la plateforme.
              </p>
            </div>
          </section>

          {/* Article 12 - Suspension */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 12 - Suspension et résiliation</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                NeuroCare se réserve le droit de suspendre ou supprimer tout compte en cas de :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Non-respect des présentes CGU</li>
                <li>Fausse déclaration ou usurpation d'identité</li>
                <li>Comportement portant atteinte aux autres utilisateurs</li>
                <li>Utilisation frauduleuse de la plateforme</li>
              </ul>
              <p className="mt-4">
                L'utilisateur peut à tout moment demander la suppression de son compte en contactant
                notre support.
              </p>
            </div>
          </section>

          {/* Article 13 - Droit applicable */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 13 - Droit applicable et litiges</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Les présentes CGU sont régies par le droit français. En cas de litige, une solution
                amiable sera recherchée avant toute action judiciaire.
              </p>
              <p>
                Conformément aux dispositions du Code de la consommation, vous pouvez recourir
                gratuitement au service de médiation de la consommation.
              </p>
              <p>
                À défaut de résolution amiable, les tribunaux français seront seuls compétents.
              </p>
            </div>
          </section>

          {/* Article 14 - Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article 14 - Contact</h2>
            <div className="text-gray-600 space-y-3">
              <p>
                Pour toute question concernant ces CGU, contactez-nous à :{' '}
                <a href="mailto:contact@neuro-care.fr" className="text-violet-600 hover:underline">
                  contact@neuro-care.fr
                </a>
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
          <Link href="/mentions-legales" className="text-violet-600 hover:underline">
            Mentions légales
          </Link>
          <Link href="/politique-confidentialite" className="text-violet-600 hover:underline">
            Politique de confidentialité
          </Link>
        </div>
      </main>
    </div>
  )
}
