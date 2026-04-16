'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ProNavbar from '@/components/ProNavbar';

export default function DevenirLiberalPage() {
  // Simulateur
  const [heures, setHeures] = useState(20);
  const [tarif, setTarif] = useState(55);
  const [statut, setStatut] = useState<'micro' | 'ei'>('micro');

  const simulation = useMemo(() => {
    const semainesAn = 44; // 8 semaines congés
    const caBrut = heures * tarif * semainesAn;
    const tauxCharges = statut === 'micro' ? 0.256 : 0.44;
    const charges = caBrut * tauxCharges;
    const netAnnuel = caBrut - charges;
    const netMensuel = Math.round(netAnnuel / 12);
    const caMensuel = Math.round(caBrut / 12);
    return { caBrut: Math.round(caBrut), caMensuel, charges: Math.round(charges), netAnnuel: Math.round(netAnnuel), netMensuel };
  }, [heures, tarif, statut]);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Checklist
  const [checks, setChecks] = useState<boolean[]>(new Array(10).fill(false));
  const toggleCheck = (i: number) => {
    const next = [...checks];
    next[i] = !next[i];
    setChecks(next);
  };
  const score = checks.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD FAQPage pour rich snippets Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Combien gagne un éducateur spécialisé libéral ?', acceptedAnswer: { '@type': 'Answer', text: 'Un éducateur libéral en micro-entreprise gagne en moyenne 2 700 € net/mois à 15h/semaine, 3 600 € à 20h/semaine et 5 400 € à 30h/semaine (tarif moyen 55 €/h, 44 semaines/an, charges 25,6%).' }},
            { '@type': 'Question', name: 'Quel statut juridique pour éducateur libéral ?', acceptedAnswer: { '@type': 'Answer', text: 'La micro-entreprise (auto-entrepreneur) est recommandée pour débuter : 25,6% de charges sur le CA en 2026, inscription gratuite, comptabilité simplifiée. Plafond : 77 700 €/an.' }},
            { '@type': 'Question', name: 'Faut-il un agrément MDPH pour exercer en libéral ?', acceptedAnswer: { '@type': 'Answer', text: 'Non, aucun agrément MDPH n\'est nécessaire. Le diplôme d\'État d\'éducateur spécialisé (DEES) suffit. Être référencé auprès des MDPH locales est cependant un excellent levier commercial.' }},
            { '@type': 'Question', name: 'Comment trouver ses premiers clients en libéral ?', acceptedAnswer: { '@type': 'Answer', text: 'Créez votre profil sur NeuroCare pour être visible auprès des familles de votre ville. Les éducateurs NeuroCare reçoivent leurs premières demandes en moyenne sous 7 jours. Complétez avec votre réseau MDPH/CMP.' }},
            { '@type': 'Question', name: 'Quelles sont les charges URSSAF éducateur libéral 2026 ?', acceptedAnswer: { '@type': 'Answer', text: 'En micro-entreprise BNC : 25,6% du chiffre d\'affaires en 2026 (tout inclus : maladie, retraite, CSG-CRDS). Avec l\'ACRE la 1ère année : environ 12,8%. Déclarations trimestrielles sur autoentrepreneur.urssaf.fr.' }},
            { '@type': 'Question', name: 'Combien coûte l\'assurance RC Pro éducateur ?', acceptedAnswer: { '@type': 'Answer', text: 'La RC Pro (Responsabilité Civile Professionnelle) coûte entre 150 et 350 € par an. Elle est indispensable pour exercer auprès d\'un public vulnérable.' }},
            { '@type': 'Question', name: 'Peut-on cumuler salarié et libéral éducateur ?', acceptedAnswer: { '@type': 'Answer', text: 'Oui, le cumul est possible et recommandé pour la transition. Vérifiez l\'absence de clause d\'exclusivité dans votre contrat. Commencez par 5-10h/semaine en libéral, puis passez à 100% quand votre agenda est rempli.' }},
            { '@type': 'Question', name: 'Qu\'est-ce que l\'ACRE pour éducateur libéral ?', acceptedAnswer: { '@type': 'Answer', text: 'L\'ACRE offre 50% de réduction sur les charges sociales la 1ère année (taux réduit à ~12,8%). Conditions 2026 : demandeur d\'emploi 6+ mois, bénéficiaire RSA/ASS, ou moins de 26 ans. Demande obligatoire sous 60 jours.' }},
          ]
        })}}
      />
      <ProNavbar />

      <main className="mt-14 xl:mt-16">

        {/* ════════════════════════════════════════════ */}
        {/* HERO                                        */}
        {/* ════════════════════════════════════════════ */}
        <section className="relative overflow-hidden min-h-[85vh] flex items-center" style={{ background: 'linear-gradient(135deg, #41005c 0%, #2d0040 50%, #1a0026 100%)' }}>
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10 bg-pink-400 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full opacity-10 bg-purple-300 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                  <span className="text-sm text-white/90 font-medium">Guide complet 2026</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                  Devenir éducateur{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10" style={{ color: '#f0879f' }}>libéral</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-pink-500/20 rounded-full" aria-hidden="true" />
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-white/80 mb-6 leading-relaxed">
                  Passez de <strong className="text-white">1 800 € net/mois salarié</strong> à{' '}
                  <strong className="text-white">4 800 € net/mois en libéral</strong>.
                  Le guide étape par étape pour vous lancer en toute sérénité.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { value: '+200%', label: 'de revenus possibles' },
                    { value: '100%', label: 'autonomie' },
                    { value: '90 j', label: 'pour démarrer' },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                      <p className="text-xl sm:text-2xl font-extrabold text-white">{s.value}</p>
                      <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="#simulateur"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: '#f0879f', color: '#fff' }}
                  >
                    Simuler mes revenus
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </a>
                  <Link
                    href="/auth/register-educator"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-lg border-2 border-white/30 text-white transition-all hover:bg-white/10"
                  >
                    Créer mon profil
                  </Link>
                </div>
              </div>

              {/* Image côté droit (au-dessus en mobile) */}
              <div className="relative order-first lg:order-last">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/images/educatrice-enfant-high-five.jpg"
                    alt="Éducatrice célébrant une réussite avec un enfant"
                    className="w-full h-auto max-h-[260px] sm:max-h-[360px] lg:max-h-none object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent" />
                </div>
                <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-white rounded-xl shadow-xl p-4 items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">4 800 € net/mois</p>
                    <p className="text-xs text-gray-500">20h/semaine en libéral</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* CHECKLIST DIAGNOSTIC (masquée)              */}
        {/* ════════════════════════════════════════════ */}
        {/*
        <section id="checklist" className="py-16 sm:py-20 lg:py-24 bg-white scroll-mt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Suis-je prêt à{' '}
                <span style={{ color: '#41005c' }}>me lancer ?</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500">
                Cochez les affirmations qui vous correspondent. Plus de 6/10 ? Vous êtes prêt.
              </p>
            </div>

            <div className="space-y-3">
              {[
                'J\'ai au moins 3 ans d\'expérience en accompagnement éducatif',
                'Je maîtrise au moins une méthode reconnue (ABA, TEACCH, PECS, Denver...)',
                'J\'ai déjà un réseau de familles ou de professionnels qui pourraient me recommander',
                'Je suis capable de gérer mon emploi du temps de manière autonome',
                'Je suis à l\'aise avec l\'idée de fixer mes propres tarifs',
                'J\'ai une épargne de sécurité d\'au moins 3 mois de charges (ou droit ARE/ARCE)',
                'Je me sens limité(e) par mon salaire actuel (< 2 200 € net)',
                'Je veux choisir les familles que j\'accompagne et les méthodes que j\'utilise',
                'Je suis prêt(e) à gérer un minimum d\'administratif (facturation, déclarations)',
                'Je suis motivé(e) pour développer mon activité sur les 6 prochains mois',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => toggleCheck(i)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    checks[i]
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                    checks[i] ? 'bg-green-500' : 'bg-white border-2 border-gray-300'
                  }`}>
                    {checks[i] && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${checks[i] ? 'text-green-800' : 'text-gray-700'}`}>{q}</span>
                </button>
              ))}
            </div>

            <div className={`mt-8 p-6 rounded-2xl text-center transition-all ${
              score >= 7 ? 'bg-green-50 border-2 border-green-200' :
              score >= 4 ? 'bg-yellow-50 border-2 border-yellow-200' :
              'bg-gray-50 border-2 border-gray-200'
            }`}>
              <p className="text-3xl font-extrabold mb-2" style={{ color: score >= 7 ? '#059669' : score >= 4 ? '#d97706' : '#6b7280' }}>
                {score}/10
              </p>
              <p className="text-sm font-medium text-gray-700">
                {score >= 7
                  ? 'Vous avez le profil idéal pour vous lancer en libéral. Passez à l\'action !'
                  : score >= 4
                  ? 'Vous avez de bonnes bases. Quelques préparatifs et vous serez prêt(e).'
                  : 'Prenez encore un peu d\'expérience. Le libéral sera là quand vous serez prêt(e).'}
              </p>
              {score >= 4 && (
                <Link
                  href="/auth/register-educator"
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: '#41005c' }}
                >
                  Créer mon profil NeuroCare gratuitement
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              )}
            </div>
          </div>
        </section>
        */}

        {/* ════════════════════════════════════════════ */}
        {/* TABLEAU COMPARATIF STATUTS                  */}
        {/* ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Quel statut{' '}
                <span style={{ color: '#41005c' }}>choisir ?</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                Comparatif 2026 des statuts juridiques pour éducateur libéral.
              </p>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-4 font-bold text-gray-900 bg-gray-50 rounded-tl-xl">Critère</th>
                    <th className="p-4 font-bold text-white rounded-tr-none" style={{ backgroundColor: '#41005c' }}>
                      <div className="flex items-center gap-2">
                        Micro-entreprise
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-pink-400 text-white">RECOMMANDÉ</span>
                      </div>
                    </th>
                    <th className="p-4 font-bold text-gray-900 bg-gray-50">EI au réel</th>
                    <th className="p-4 font-bold text-gray-900 bg-gray-50 rounded-tr-xl">SASU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Charges sociales', micro: '25,6% du CA', ei: '~44% du bénéfice', sasu: '~78% du salaire net' },
                    { label: 'Plafond CA', micro: '77 700 €/an', ei: 'Illimité', sasu: 'Illimité' },
                    { label: 'Comptabilité', micro: 'Livre de recettes', ei: 'Comptabilité complète', sasu: 'Comptabilité complète' },
                    { label: 'TVA', micro: 'Franchise (< 36 800 €)', ei: 'Assujetti', sasu: 'Assujetti' },
                    { label: 'Responsabilité', micro: 'Patrimoine perso protégé', ei: 'Patrimoine perso protégé', sasu: 'Limitée aux apports' },
                    { label: 'Coût création', micro: 'Gratuit', ei: 'Gratuit', sasu: '200-500 €' },
                    { label: 'Complexité', micro: 'Très simple', ei: 'Moyenne', sasu: 'Complexe' },
                    { label: 'Idéal pour', micro: 'Débuter (< 77 700 €)', ei: 'Beaucoup de charges déductibles', sasu: 'CA > 100 000 € + dividendes' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-gray-900">{row.label}</td>
                      <td className="p-4 text-gray-700 font-medium" style={{ backgroundColor: 'rgba(65, 0, 92, 0.03)' }}>{row.micro}</td>
                      <td className="p-4 text-gray-600">{row.ei}</td>
                      <td className="p-4 text-gray-600">{row.sasu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              <p className="text-sm text-purple-800">
                <strong>Notre recommandation :</strong> commencez en micro-entreprise. C'est gratuit, simple, et vous pouvez basculer en EI au réel quand votre CA dépasse le plafond. 90% des éducateurs libéraux débutent avec ce statut.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* TABLEAU REVENUS SALARIÉ VS LIBÉRAL          */}
        {/* ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Combien gagne un éducateur{' '}
                <span style={{ color: '#41005c' }}>libéral ?</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500">
                Chiffres réalistes 2026, basés sur un tarif moyen de 55 €/h en micro-entreprise (25,6% de charges).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Salarié */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">Salarié (Conv. 66)</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Débutant (0-2 ans)', value: '1 500 € net/mois', sub: '35h/semaine' },
                    { label: 'Confirmé (3-5 ans)', value: '1 800 € net/mois', sub: '35h/semaine' },
                    { label: 'Expérimenté (9+ ans)', value: '2 100 € net/mois', sub: '35h/semaine' },
                    { label: 'Fin de carrière (28 ans)', value: '2 550 € net/mois', sub: '35h/semaine' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{row.label}</p>
                        <p className="text-xs text-gray-400">{row.sub}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-600">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Libéral */}
              <div className="rounded-2xl border-2 p-6 sm:p-8" style={{ borderColor: '#c084fc', background: 'linear-gradient(135deg, rgba(65, 0, 92, 0.02), rgba(107, 33, 168, 0.05))' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
                    <svg className="w-5 h-5" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: '#41005c' }}>Libéral</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: '15h/semaine', value: '2 700 € net/mois', sub: '55 €/h · mi-temps', highlight: false },
                    { label: '20h/semaine', value: '3 600 € net/mois', sub: '55 €/h · 4 jours', highlight: true },
                    { label: '25h/semaine', value: '4 500 € net/mois', sub: '55 €/h · 5 jours', highlight: true },
                    { label: '30h/semaine', value: '5 400 € net/mois', sub: '55 €/h · 5 jours plein', highlight: false },
                  ].map((row) => (
                    <div key={row.label} className={`flex items-center justify-between p-3 rounded-lg ${row.highlight ? 'bg-white shadow-sm border border-purple-100' : 'bg-white/50'}`}>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{row.label}</p>
                        <p className="text-xs text-gray-400">{row.sub}</p>
                      </div>
                      <p className="text-sm font-extrabold" style={{ color: '#41005c' }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <p className="text-sm text-green-800">
                <strong>Calcul :</strong> 55 €/h x 20h/semaine x 44 semaines = 48 400 € CA/an. Après charges micro (25,6%) = 36 010 € net/an soit <strong>3 000 € net/mois</strong>. Avec l'ACRE la 1ère année (~12,8%) : <strong>3 600 € net/mois</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* SIMULATEUR INTERACTIF                       */}
        {/* ════════════════════════════════════════════ */}
        <section id="simulateur" className="py-16 sm:py-20 lg:py-24 bg-white scroll-mt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Simulez vos{' '}
                <span style={{ color: '#41005c' }}>revenus libéraux</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500">
                Ajustez les curseurs pour estimer votre revenu net mensuel.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-purple-200 p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, rgba(65, 0, 92, 0.02), rgba(107, 33, 168, 0.04))' }}>
              {/* Statut */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Statut juridique</label>
                <div className="flex gap-3">
                  {[
                    { id: 'micro' as const, label: 'Micro-entreprise (25,6%)' },
                    { id: 'ei' as const, label: 'EI au réel (~44%)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatut(s.id)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        statut === s.id
                          ? 'text-white shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                      style={statut === s.id ? { backgroundColor: '#41005c', borderColor: '#41005c' } : {}}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heures */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">Heures de séances / semaine</label>
                  <span className="text-lg font-extrabold" style={{ color: '#41005c' }}>{heures}h</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={heures}
                  onChange={(e) => setHeures(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: '#41005c' }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5h</span><span>15h</span><span>25h</span><span>40h</span>
                </div>
              </div>

              {/* Tarif */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">Tarif horaire</label>
                  <span className="text-lg font-extrabold" style={{ color: '#41005c' }}>{tarif} €/h</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={90}
                  step={5}
                  value={tarif}
                  onChange={(e) => setTarif(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: '#41005c' }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>35 €</span><span>55 €</span><span>75 €</span><span>90 €</span>
                </div>
              </div>

              {/* Résultats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1">CA mensuel brut</p>
                  <p className="text-xl font-extrabold text-gray-800">{simulation.caMensuel.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1">Charges ({statut === 'micro' ? '25,6%' : '~44%'})</p>
                  <p className="text-xl font-extrabold text-red-500">-{Math.round(simulation.charges / 12).toLocaleString('fr-FR')} €</p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl p-4 border-2 text-center" style={{ borderColor: '#41005c', backgroundColor: 'rgba(65, 0, 92, 0.05)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#41005c' }}>Revenu net mensuel</p>
                  <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#41005c' }}>{simulation.netMensuel.toLocaleString('fr-FR')} €</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Estimation sur 44 semaines travaillées/an (8 semaines de congés). Hors CFE et formation professionnelle.
              </p>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/auth/register-educator"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#41005c' }}
              >
                Créer mon profil et recevoir mes 1ers RDV
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* 5 ÉTAPES TIMELINE                           */}
        {/* ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Libéral en{' '}
                <span style={{ color: '#41005c' }}>5 étapes</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                Un plan d'action simple pour passer de salarié à libéral.
              </p>
            </div>

            <div className="space-y-0">
              {[
                {
                  num: '1',
                  title: 'Choisir votre statut',
                  duration: 'Semaine 1',
                  desc: 'Micro-entreprise pour démarrer simplement (25,6% de charges, inscription gratuite en ligne). Déclarations URSSAF trimestrielles sur autoentrepreneur.urssaf.fr.',
                  gradient: 'linear-gradient(135deg, #41005c, #6b21a8)',
                },
                {
                  num: '2',
                  title: 'Souscrire une RC Pro',
                  duration: 'Semaine 1-2',
                  desc: 'Obligatoire pour exercer auprès d\'un public vulnérable. Coût : 150 à 350 €/an selon les garanties.',
                  gradient: 'linear-gradient(135deg, #f0879f, #ec4899)',
                },
                {
                  num: '3',
                  title: 'Préparer matériel et lieu',
                  duration: 'Semaine 3-4',
                  desc: 'Budget : 500 à 2 000 €. Exercice au domicile des familles, en cabinet partagé ou chez vous. Matériel de base : supports pédagogiques, tablette, classeurs de suivi.',
                  gradient: 'linear-gradient(135deg, #41005c, #6b21a8)',
                },
                {
                  num: '4',
                  title: 'Trouver vos premiers clients via NeuroCare',
                  duration: 'Semaine 4-8',
                  desc: 'Créez votre profil pour être visible immédiatement auprès des familles de votre ville. Complétez avec votre réseau (MDPH, CMP, CAMSP, pédiatres).',
                  gradient: 'linear-gradient(135deg, #f0879f, #ec4899)',
                },
                {
                  num: '5',
                  title: 'Facturer, encaisser et développer',
                  duration: 'Mois 2-6',
                  desc: 'Facturation automatique et paiement sécurisé via NeuroCare (88% reversés après chaque séance). Montez progressivement en charge et diversifiez (bilans, groupes, supervision).',
                  gradient: 'linear-gradient(135deg, #41005c, #6b21a8)',
                },
              ].map((step, i) => (
                <div key={step.num} className="relative flex gap-5 sm:gap-8">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white shadow-lg flex-shrink-0 z-10"
                      style={{ background: step.gradient }}
                    >
                      {step.num}
                    </div>
                    {i < 4 && <div className="w-0.5 flex-1 min-h-[40px]" style={{ backgroundColor: '#e9d5ff' }} />}
                  </div>

                  <div className="flex-1 pb-8 sm:pb-10">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{step.title}</h3>
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}>
                          {step.duration}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-4">
              <Link
                href="/auth/register-educator"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#41005c' }}
              >
                Créer mon profil NeuroCare
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* TÉMOIGNAGES                                 */}
        {/* ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Ils ont fait le{' '}
                <span style={{ color: '#41005c' }}>saut</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500">
                Des éducateurs qui sont passés de salarié à libéral avec NeuroCare.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Amina K.',
                  role: 'Éducatrice ABA — Marseille',
                  before: '1 900 € salarié',
                  after: '4 200 € libéral',
                  months: '4 mois',
                  quote: 'J\'ai quitté mon IME après 5 ans. En 4 mois sur NeuroCare, j\'ai rempli mon agenda à 22h/semaine. Je gagne plus du double en travaillant moins, et surtout je choisis mes familles.',
                  emoji: '👩‍⚕️',
                  gradient: 'linear-gradient(135deg, #f0879f, #ec4899)',
                },
                {
                  name: 'Thomas L.',
                  role: 'Éducateur TEACCH — Lyon',
                  before: '2 100 € salarié',
                  after: '5 100 € libéral',
                  months: '6 mois',
                  quote: 'Le plus dur c\'est de se décider. Après, tout va vite. NeuroCare m\'a apporté 70% de mes RDV sans aucune prospection. La facturation auto, c\'est un gain de temps énorme.',
                  emoji: '👨‍💼',
                  gradient: 'linear-gradient(135deg, #41005c, #6b21a8)',
                },
                {
                  name: 'Claire M.',
                  role: 'Éducatrice — Bordeaux',
                  before: '1 750 € salarié',
                  after: '3 800 € libéral',
                  months: '3 mois',
                  quote: 'Je travaille 18h/semaine, je suis dispo pour mes enfants, et je gagne plus qu\'en CDI. L\'ACRE m\'a permis de payer presque rien en charges la 1ère année.',
                  emoji: '👩‍🔬',
                  gradient: 'linear-gradient(135deg, #6b21a8, #9333ea)',
                },
              ].map((t) => (
                <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md flex-shrink-0" style={{ background: t.gradient }}>
                      <span>{t.emoji}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>

                  {/* Before/After */}
                  <div className="flex items-center gap-2 mb-4 bg-gray-50 rounded-lg p-3">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-400">Avant</p>
                      <p className="text-sm font-bold text-gray-500 line-through">{t.before}</p>
                    </div>
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-400">Après ({t.months})</p>
                      <p className="text-sm font-extrabold" style={{ color: '#059669' }}>{t.after}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* GUIDE PRATIQUE (accordéon)                  */}
        {/* ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Guide pratique{' '}
                <span style={{ color: '#41005c' }}>éducateur libéral</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500">
                Tout ce qu'il faut savoir pour exercer en libéral en tant qu'éducateur spécialisé.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Faut-il un agrément MDPH pour exercer en libéral ?',
                  content: 'Non, aucun agrément MDPH n\'est nécessaire pour exercer en tant qu\'éducateur spécialisé libéral. Votre diplôme d\'État (DEES) suffit. En revanche, être référencé auprès des MDPH locales est un excellent levier commercial : les familles ayant une notification MDPH cherchent activement des professionnels. Vous pouvez aussi vous inscrire auprès des Plateformes de Coordination et d\'Orientation (PCO) pour recevoir des orientations.',
                },
                {
                  title: 'Quel code APE/NAF et code URSSAF utiliser ?',
                  content: 'Le code APE le plus courant est 88.99B (Action sociale sans hébergement n.c.a.) ou 86.90F (Activités de santé humaine non classées ailleurs). Lors de votre inscription sur le guichet des formalités, décrivez votre activité comme "Éducation spécialisée et accompagnement de personnes en situation de handicap". L\'URSSAF vous classera en profession libérale non réglementée (BNC), affiliée au régime SSI.',
                },
                {
                  title: 'Quels tarifs pratiquer en 2026 ?',
                  content: 'Les tarifs moyens constatés en 2026 pour un éducateur libéral : séance individuelle (1h, domicile ou cabinet) : 48 à 65 €. En Île-de-France et grandes métropoles : 55 à 75 €. Bilans éducatifs (2-3h) : 120 à 200 €. Séances de groupe (4-6 enfants) : 25 à 35 € par enfant. Supervision/formation parentale : 60 à 80 €/h. Le CESU (Chèque Emploi Service Universel) n\'est pas applicable en libéral — il concerne le statut salarié du particulier employeur.',
                },
                {
                  title: 'Comment bénéficier de l\'ACRE en 2026 ?',
                  content: 'L\'ACRE (Aide à la Création ou Reprise d\'Entreprise) offre une réduction de 50% sur vos charges sociales la première année (taux micro-BNC réduit à ~12,8% au lieu de 25,6%). Conditions : être demandeur d\'emploi inscrit à France Travail, ou bénéficiaire RSA/ASS, ou avoir moins de 26 ans, ou être reconnu handicapé. Attention : depuis 2026, la demande doit être déposée auprès de l\'URSSAF dans les 60 jours suivant le début d\'activité (ce n\'est plus automatique).',
                },
                {
                  title: 'ARCE ou ARE : que choisir ?',
                  content: 'Si vous êtes au chômage (ARE), deux options : l\'ARCE = recevoir 60% de vos droits restants en capital (50% immédiatement, 50% après 6 mois). Ou le maintien ARE = continuer à percevoir vos allocations mensuelles, diminuées de vos revenus libéraux. L\'ARCE est idéale si vous avez besoin d\'un capital de départ (matériel, local). Le maintien ARE est préférable si vous voulez un filet de sécurité mensuel pendant la montée en charge. Le choix est irréversible.',
                },
                {
                  title: 'Quelles aides financières pour les familles ?',
                  content: 'Les familles peuvent financer vos séances via : l\'AEEH (Allocation d\'Éducation de l\'Enfant Handicapé) et son complément, le PCH (Prestation de Compensation du Handicap) — volet aide humaine, certaines mutuelles qui remboursent partiellement les séances éducatives, et le crédit d\'impôt SAP (Services à la Personne) si vous êtes agréé SAP (50% de remboursement). NeuroCare aide les familles à identifier leurs droits via notre guide dédié.',
                },
                {
                  title: 'Peut-on cumuler libéral et salarié ?',
                  content: 'Oui, c\'est même recommandé pour la transition. Vous pouvez exercer en libéral en parallèle d\'un poste salarié, sous conditions : vérifiez l\'absence de clause d\'exclusivité dans votre contrat, informez votre employeur (obligation de loyauté), et respectez les repos obligatoires. Stratégie classique : commencez par 5-10h/semaine en libéral le soir/week-end, puis passez à temps partiel salarié, puis 100% libéral quand votre agenda est rempli.',
                },
              ].map((item, i) => (
                <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100">
                  <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-gray-900 text-sm sm:text-base">
                    {item.title}
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                    {item.content}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* FAQ                                         */}
        {/* ════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: '#faf8fc' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
              Questions fréquentes
            </h2>

            <div className="space-y-3">
              {[
                { q: 'Combien de temps pour avoir mon 1er client ?', a: 'Avec NeuroCare, les éducateurs reçoivent en moyenne leurs premières demandes sous 7 jours. Le profil est visible immédiatement après validation. En parallèle, activez votre réseau (anciens collègues, MDPH, CMP, pédiatres, orthophonistes) pour accélérer.' },
                { q: 'Dois-je avoir un local pour commencer ?', a: 'Non. 70% des éducateurs libéraux exercent au domicile des familles, ce qui élimine le coût d\'un local. Quand votre activité sera stable, vous pourrez envisager un cabinet partagé (300-600 €/mois) ou une sous-location ponctuelle.' },
                { q: 'Quelles assurances sont obligatoires ?', a: 'La RC Pro (Responsabilité Civile Professionnelle) est indispensable : 150-350 €/an. Elle couvre les dommages causés lors de vos interventions. Optionnellement : mutuelle TNS (~100-150 €/mois), prévoyance (~30-80 €/mois).' },
                { q: 'Comment sont calculées les charges URSSAF ?', a: 'En micro-entreprise BNC : 25,6% de votre chiffre d\'affaires en 2026 (tout compris : maladie, retraite, CSG-CRDS). Vous déclarez et payez trimestriellement sur autoentrepreneur.urssaf.fr. Avec l\'ACRE : ~12,8% la 1ère année.' },
                { q: 'Faut-il un diplôme spécifique ?', a: 'Le DEES (Diplôme d\'État d\'Éducateur Spécialisé) est la base. Les formations complémentaires (ABA, TEACCH, PECS, Denver, Montessori adapté) ne sont pas obligatoires légalement mais fortement recommandées pour votre crédibilité et vos tarifs.' },
                { q: 'Comment NeuroCare m\'aide concrètement ?', a: 'Profil professionnel visible par les familles de votre ville, réservation et paiement sécurisé en ligne (88% reversés), facturation automatique (compatible URSSAF/CESU), agenda en ligne, messagerie famille-pro, dossier PPA intégré. Le tout 100% gratuit à l\'inscription.' },
                { q: 'Puis-je revenir au salariat si ça ne marche pas ?', a: 'Oui. Vous pouvez suspendre ou fermer votre micro-entreprise à tout moment, gratuitement, en ligne. Si vous avez opté pour le maintien ARE, vos droits restants sont récupérables. Le risque financier est quasi nul si vous démarrez en parallèle d\'un poste.' },
                { q: 'Quel chiffre d\'affaires maximum en micro-entreprise ?', a: '77 700 € HT/an en 2026 pour les activités BNC. Au-delà, vous basculez automatiquement en EI au réel l\'année suivante. En pratique, à 55 €/h et 25h/semaine (44 semaines), vous atteignez 60 500 € — vous restez largement dans les clous.' },
              ].map((faq, i) => (
                <details key={i} className="group bg-white rounded-xl border border-gray-100">
                  <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-gray-900 text-sm sm:text-base">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* CTA FINAL                                   */}
        {/* ════════════════════════════════════════════ */}
        <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #41005c 0%, #2d0040 100%)' }}>
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full opacity-10 bg-pink-400 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full opacity-10 bg-purple-300 blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Prêt à vous lancer en libéral ?
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Créez votre profil NeuroCare en 2 minutes. Recevez vos premiers RDV sous 7 jours.
              C'est gratuit, sans engagement, et les éducateurs les plus rapides remplissent leur agenda en moins d'un mois.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/auth/register-educator"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#f0879f', color: '#fff' }}
              >
                Créer mon profil gratuitement
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <a
                href="#simulateur"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg border-2 border-white/30 text-white transition-all hover:bg-white/10"
              >
                Simuler mes revenus
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white/60">
              <span>100% gratuit</span>
              <span>Sans engagement</span>
              <span>Profil visible en 2 min</span>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="text-white py-10 px-4 sm:px-6" style={{ backgroundColor: '#41005c' }} role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link href="/pro" className="flex items-center gap-2">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare Pro" className="h-10 brightness-0 invert" />
              <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ backgroundColor: '#f0879f' }}>PRO</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-4 text-xs text-white/70">
              <Link href="/pro" className="hover:text-white transition-colors">Accueil Pro</Link>
              <Link href="/pro/sap-accreditation" className="hover:text-white transition-colors">Guide SAP</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            </nav>
            <p className="text-xs text-white/50">© {new Date().getFullYear()} NeuroCare</p>
          </div>
        </div>
      </footer>
    </div>
  );
}