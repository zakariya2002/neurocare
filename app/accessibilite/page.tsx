import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Déclaration d\'accessibilité',
  description: 'Déclaration d\'accessibilité du site NeuroCare conforme au RGAA 4.1, schéma pluriannuel 2026-2029 et plan d\'action 2026.',
  alternates: { canonical: '/accessibilite' },
};

export default function AccessibilitePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="px-6 pt-24 pb-12 lg:pt-28 lg:pb-16" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#027e7e' }}>
            Engagement RGAA 4.1
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Déclaration d&apos;accessibilité
          </h1>
          <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
            NeuroCare s&apos;engage à rendre son site accessible aux personnes en situation de handicap, conformément à l&apos;article 47 de la loi n° 2005-102 du 11 février 2005.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 lg:py-16">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* État de conformité */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">État de conformité</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Le site <strong>neuro-care.fr</strong> est en conformité <strong>partielle</strong> avec le Référentiel Général d&apos;Amélioration de l&apos;Accessibilité (<abbr title="Référentiel Général d'Amélioration de l'Accessibilité">RGAA</abbr>) version 4.1, en raison des non-conformités et des dérogations énumérées ci-dessous.
            </p>
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#f0fafa', borderColor: '#02787833' }}>
              <p className="text-sm font-semibold text-gray-900 mb-1">Niveau de conformité estimé</p>
              <p className="text-2xl font-bold" style={{ color: '#027e7e' }}>~92 % (niveau AA partiel)</p>
              <p className="text-xs text-gray-500 mt-2">Audit interne — mai 2026</p>
            </div>
          </div>

          {/* Résultats des tests */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Résultats des tests</h2>
            <p className="text-gray-700 leading-relaxed">
              L&apos;audit d&apos;accessibilité a été réalisé en interne en mai 2026 selon les critères du <abbr title="Référentiel Général d'Amélioration de l'Accessibilité">RGAA</abbr> 4.1. Les pages auditées comprennent l&apos;accueil, l&apos;inscription, la connexion, la recherche, le contact, l&apos;espace professionnel, le blog et le forum communautaire.
            </p>
          </div>

          {/* Contenus non accessibles */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Contenus non accessibles</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Malgré les efforts engagés, certains contenus ne sont pas encore totalement conformes :
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#027e7e' }} />
                <span>Les tests utilisateurs avec lecteurs d&apos;écran (VoiceOver, NVDA, JAWS) sont à finaliser au troisième trimestre 2026.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#027e7e' }} />
                <span>L&apos;audit des contrastes mesurés sur les pages rendues (et non sur les classes Tailwind) reste à effectuer avec des outils comme axe-core ou Lighthouse.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#027e7e' }} />
                <span>Les tests sur technologies d&apos;assistance réelles (logiciels de synthèse vocale, plage braille, contacteurs) sont programmés pour 2027 dans le cadre d&apos;un audit externe certifié.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#027e7e' }} />
                <span>Certains documents bureautiques (PDF de bilans téléchargés depuis l&apos;espace professionnel) ne sont pas encore garantis accessibles.</span>
              </li>
            </ul>
          </div>

          {/* Voies de recours */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Voies de recours</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Si vous constatez un défaut d&apos;accessibilité vous empêchant d&apos;accéder à un contenu ou une fonctionnalité du site, merci de nous contacter pour qu&apos;une alternative vous soit proposée.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>
                <strong>Contact :</strong>{' '}
                <a href="mailto:accessibilite@neuro-care.fr" className="font-medium underline underline-offset-2" style={{ color: '#027e7e' }}>
                  accessibilite@neuro-care.fr
                </a>
              </li>
              <li>
                <strong>Formulaire :</strong>{' '}
                <Link href="/contact" className="font-medium underline underline-offset-2" style={{ color: '#027e7e' }}>
                  page de contact
                </Link>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Si vous constatez un défaut d&apos;accessibilité vous empêchant d&apos;accéder à un contenu ou une fonctionnalité du site, que vous nous le signalez et que vous ne parvenez pas à obtenir une réponse rapide de notre part, vous êtes en droit de faire parvenir vos doléances ou une demande de saisine au Défenseur des droits.
            </p>
            <ul className="space-y-2 text-gray-700 mt-3">
              <li>
                <a
                  href="https://www.defenseurdesdroits.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                  style={{ color: '#027e7e' }}
                >
                  Défenseur des droits
                </a>
              </li>
              <li>
                <a
                  href="https://formulaire.defenseurdesdroits.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                  style={{ color: '#027e7e' }}
                >
                  Formulaire de saisine en ligne
                </a>
              </li>
              <li>Par courrier : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07</li>
            </ul>
          </div>

          {/* Schéma pluriannuel */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Schéma pluriannuel d&apos;accessibilité 2026-2029</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              NeuroCare s&apos;engage dans une démarche progressive et durable de mise en accessibilité de l&apos;ensemble de ses services numériques.
            </p>
            <div className="space-y-4">
              <div className="rounded-xl p-5 border border-gray-100" style={{ backgroundColor: '#fdf9f4' }}>
                <h3 className="font-semibold text-gray-900 mb-2">Année 1 — 2026</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Audit RGAA 4.1 complet du site public</li>
                  <li>• Corrections des non-conformités prioritaires (P0 et P1)</li>
                  <li>• Sensibilisation et formation de l&apos;équipe technique</li>
                  <li>• Publication de la déclaration d&apos;accessibilité</li>
                </ul>
              </div>
              <div className="rounded-xl p-5 border border-gray-100" style={{ backgroundColor: '#fdf9f4' }}>
                <h3 className="font-semibold text-gray-900 mb-2">Année 2 — 2027</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Tests utilisateurs avec personnes en situation de handicap</li>
                  <li>• Audit externe certifié par un cabinet RGAA agréé</li>
                  <li>• Mise en accessibilité de l&apos;espace professionnel et du dashboard</li>
                  <li>• Documentation accessible des bilans PDF générés</li>
                </ul>
              </div>
              <div className="rounded-xl p-5 border border-gray-100" style={{ backgroundColor: '#fdf9f4' }}>
                <h3 className="font-semibold text-gray-900 mb-2">Année 3 — 2028-2029</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Maintien de la conformité <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> AA sur les nouvelles fonctionnalités</li>
                  <li>• Intégration systématique des tests d&apos;accessibilité dans le cycle de développement</li>
                  <li>• Mise à jour annuelle de la déclaration et du plan d&apos;action</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Plan d'action 2026 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Plan d&apos;action 2026</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#f0fafa', color: '#027e7e' }}>Q2</span>
                <span>Corrections techniques RGAA : focus visible, attributs <code>aria-live</code>, contrastes des textes, alternatives textuelles des images, navigation clavier ✓ <em>(en cours)</em></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#f0fafa', color: '#027e7e' }}>Q3</span>
                <span>Audit des contrastes mesurés sur pages rendues, tests de navigation au clavier complète et tests avec lecteurs d&apos;écran (VoiceOver, NVDA).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#f0fafa', color: '#027e7e' }}>Q4</span>
                <span>Intégration de <code>axe-core</code> dans le pipeline d&apos;intégration continue, formation des contributeurs et mise à jour de la déclaration.</span>
              </li>
            </ul>
          </div>

          {/* Technologies utilisées */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Technologies utilisées</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              L&apos;accessibilité du site repose sur les technologies suivantes :
            </p>
            <ul className="space-y-1 text-gray-700">
              <li>• <abbr title="HyperText Markup Language">HTML5</abbr> sémantique</li>
              <li>• <abbr title="Web Accessible Rich Internet Applications">WAI-ARIA</abbr> 1.2</li>
              <li>• <abbr title="Cascading Style Sheets">CSS</abbr> 3 (Tailwind CSS)</li>
              <li>• JavaScript (React, Next.js)</li>
            </ul>
          </div>

          {/* Date */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Cette déclaration a été établie le <strong className="text-gray-700">9 mai 2026</strong>. Dernière mise à jour : <strong className="text-gray-700">9 mai 2026</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
