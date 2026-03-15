'use client';

import Link from 'next/link';
import ProNavbar from '@/components/ProNavbar';

export default function ProHowItWorksPage() {

  const steps = [
    {
      number: '01',
      title: 'Créez votre profil',
      description: 'Inscrivez-vous gratuitement et complétez votre profil professionnel en quelques minutes. Ajoutez vos diplômes, certifications, expériences et disponibilités.',
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Background card */}
          <rect x="50" y="40" width="200" height="220" rx="16" fill="white" filter="url(#shadow1)"/>
          {/* Profile photo placeholder */}
          <circle cx="150" cy="100" r="45" fill="#f3e8ff"/>
          <circle cx="150" cy="90" r="18" fill="#41005c"/>
          <ellipse cx="150" cy="125" rx="25" ry="15" fill="#41005c"/>
          {/* Camera icon */}
          <circle cx="180" cy="130" r="14" fill="#f0879f"/>
          <rect x="173" y="125" width="14" height="10" rx="2" fill="white"/>
          <circle cx="180" cy="130" r="3" fill="#f0879f"/>
          {/* Form fields */}
          <rect x="75" y="165" width="150" height="12" rx="6" fill="#f3e8ff"/>
          <rect x="75" y="185" width="120" height="12" rx="6" fill="#f3e8ff"/>
          <rect x="75" y="205" width="100" height="12" rx="6" fill="#f3e8ff"/>
          {/* Progress indicator */}
          <rect x="75" y="235" width="150" height="8" rx="4" fill="#e5e7eb"/>
          <rect x="75" y="235" width="100" height="8" rx="4" fill="#41005c"/>
          <defs>
            <filter id="shadow1" x="0" y="0" width="300" height="300">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
            </filter>
          </defs>
        </svg>
      ),
      tips: ['Photo professionnelle', 'Biographie complète', 'Diplômes et certifications'],
    },
    {
      number: '02',
      title: 'Vérification du profil',
      description: 'Notre équipe vérifie vos informations et diplômes pour garantir la qualité de la plateforme. Une fois vérifié, vous obtenez le badge "Profil Vérifié".',
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Shield background */}
          <path d="M150 30 L250 70 L250 150 C250 210 150 270 150 270 C150 270 50 210 50 150 L50 70 Z" fill="white" filter="url(#shadow2)"/>
          <path d="M150 50 L230 82 L230 145 C230 195 150 245 150 245 C150 245 70 195 70 145 L70 82 Z" fill="#f3e8ff"/>
          {/* Checkmark */}
          <circle cx="150" cy="140" r="50" fill="#41005c"/>
          <path d="M125 140 L142 157 L178 121" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          {/* Badge */}
          <circle cx="210" cy="80" r="25" fill="#f0879f"/>
          <text x="210" y="87" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">✓</text>
          {/* Stars */}
          <text x="80" y="230" fill="#f0879f" fontSize="16">★</text>
          <text x="150" y="220" fill="#41005c" fontSize="20">★</text>
          <text x="220" y="230" fill="#f0879f" fontSize="16">★</text>
          <defs>
            <filter id="shadow2" x="0" y="0" width="300" height="300">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
            </filter>
          </defs>
        </svg>
      ),
      tips: ['Vérification sous 48h', 'Badge de confiance', 'Visibilité accrue'],
    },
    {
      number: '03',
      title: 'Recevez des demandes',
      description: 'Les familles vous trouvent via notre moteur de recherche. Elles peuvent consulter votre profil, vos disponibilités et vous contacter directement.',
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Phone frame */}
          <rect x="85" y="30" width="130" height="240" rx="20" fill="#1f2937" filter="url(#shadow3)"/>
          <rect x="92" y="45" width="116" height="210" rx="12" fill="white"/>
          {/* Notification 1 */}
          <rect x="102" y="60" width="96" height="50" rx="8" fill="#f3e8ff"/>
          <circle cx="122" cy="85" r="12" fill="#41005c"/>
          <rect x="140" y="75" width="50" height="8" rx="4" fill="#41005c"/>
          <rect x="140" y="88" width="35" height="6" rx="3" fill="#9ca3af"/>
          {/* Notification 2 */}
          <rect x="102" y="120" width="96" height="50" rx="8" fill="#fce7f3"/>
          <circle cx="122" cy="145" r="12" fill="#f0879f"/>
          <rect x="140" y="135" width="50" height="8" rx="4" fill="#f0879f"/>
          <rect x="140" y="148" width="35" height="6" rx="3" fill="#9ca3af"/>
          {/* Notification 3 */}
          <rect x="102" y="180" width="96" height="50" rx="8" fill="#f3e8ff"/>
          <circle cx="122" cy="205" r="12" fill="#41005c"/>
          <rect x="140" y="195" width="50" height="8" rx="4" fill="#41005c"/>
          <rect x="140" y="208" width="35" height="6" rx="3" fill="#9ca3af"/>
          {/* Bell notification */}
          <circle cx="220" cy="55" r="22" fill="#f0879f"/>
          <text x="220" y="62" textAnchor="middle" fill="white" fontSize="18">🔔</text>
          <circle cx="232" cy="43" r="10" fill="#41005c"/>
          <text x="232" y="48" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">3</text>
          <defs>
            <filter id="shadow3" x="0" y="0" width="300" height="300">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
            </filter>
          </defs>
        </svg>
      ),
      tips: ['Notifications instantanées', 'Messagerie sécurisée', 'Demandes de RDV'],
    },
    {
      number: '04',
      title: 'Gérez vos rendez-vous',
      description: 'Acceptez ou refusez les demandes en un clic. Gérez votre calendrier, vos disponibilités et vos interventions depuis votre tableau de bord.',
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Calendar */}
          <rect x="40" y="50" width="220" height="200" rx="16" fill="white" filter="url(#shadow4)"/>
          {/* Header */}
          <rect x="40" y="50" width="220" height="50" rx="16" fill="#41005c"/>
          <rect x="40" y="80" width="220" height="20" fill="#41005c"/>
          <text x="150" y="82" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">Décembre 2025</text>
          {/* Days header */}
          <text x="65" y="125" fill="#9ca3af" fontSize="10">LUN</text>
          <text x="97" y="125" fill="#9ca3af" fontSize="10">MAR</text>
          <text x="130" y="125" fill="#9ca3af" fontSize="10">MER</text>
          <text x="163" y="125" fill="#9ca3af" fontSize="10">JEU</text>
          <text x="197" y="125" fill="#9ca3af" fontSize="10">VEN</text>
          <text x="230" y="125" fill="#9ca3af" fontSize="10">SAM</text>
          {/* Calendar grid */}
          {[1,2,3,4,5,6].map((row, i) => (
            <g key={i}>
              {[0,1,2,3,4,5].map((col, j) => {
                const day = i * 6 + j + 1;
                if (day > 31) return null;
                const isBooked = [5, 12, 15, 19, 22, 26].includes(day);
                const isToday = day === 15;
                return (
                  <g key={j}>
                    <circle
                      cx={65 + col * 33}
                      cy={145 + i * 25}
                      r="12"
                      fill={isToday ? '#41005c' : isBooked ? '#fce7f3' : 'transparent'}
                    />
                    <text
                      x={65 + col * 33}
                      y={149 + i * 25}
                      textAnchor="middle"
                      fill={isToday ? 'white' : isBooked ? '#f0879f' : '#374151'}
                      fontSize="11"
                    >
                      {day <= 31 ? day : ''}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
          {/* Checkmark badge */}
          <circle cx="250" cy="60" r="20" fill="#10b981"/>
          <path d="M240 60 L247 67 L262 52" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <defs>
            <filter id="shadow4" x="0" y="0" width="300" height="300">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
            </filter>
          </defs>
        </svg>
      ),
      tips: ['Calendrier intégré', 'Rappels automatiques', 'Gestion simplifiée'],
    },
    {
      number: '05',
      title: 'Développez votre réputation',
      description: 'Après chaque intervention, les familles peuvent laisser un avis. Ces avis renforcent votre crédibilité et attirent de nouvelles familles.',
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      illustration: (
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Review card */}
          <rect x="40" y="60" width="220" height="180" rx="16" fill="white" filter="url(#shadow5)"/>
          {/* Profile */}
          <circle cx="85" cy="110" r="25" fill="#f3e8ff"/>
          <circle cx="85" cy="105" r="10" fill="#41005c"/>
          <ellipse cx="85" cy="120" rx="12" ry="8" fill="#41005c"/>
          {/* Stars */}
          <text x="120" y="100" fill="#f59e0b" fontSize="22">★★★★★</text>
          {/* Name */}
          <rect x="120" y="110" width="80" height="10" rx="5" fill="#41005c"/>
          {/* Review text */}
          <rect x="60" y="150" width="180" height="8" rx="4" fill="#e5e7eb"/>
          <rect x="60" y="165" width="160" height="8" rx="4" fill="#e5e7eb"/>
          <rect x="60" y="180" width="120" height="8" rx="4" fill="#e5e7eb"/>
          {/* Rating badge */}
          <circle cx="220" cy="205" r="25" fill="#41005c"/>
          <text x="220" y="202" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">4.9</text>
          <text x="220" y="218" textAnchor="middle" fill="#f0879f" fontSize="10">★★★★★</text>
          {/* Floating stars */}
          <text x="50" y="50" fill="#f59e0b" fontSize="24">★</text>
          <text x="240" y="45" fill="#f0879f" fontSize="20">★</text>
          <text x="270" y="150" fill="#f59e0b" fontSize="16">★</text>
          <defs>
            <filter id="shadow5" x="0" y="0" width="300" height="300">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
            </filter>
          </defs>
        </svg>
      ),
      tips: ['Avis vérifiés', 'Note moyenne visible', 'Confiance des familles'],
    },
  ];

  const benefits = [
    {
      title: 'Aucun frais d\'inscription',
      description: 'Créez votre profil et commencez à recevoir des demandes sans rien payer.',
      icon: '💰',
    },
    {
      title: 'Visibilité locale',
      description: 'Apparaissez dans les recherches des familles de votre région.',
      icon: '📍',
    },
    {
      title: 'Flexibilité totale',
      description: 'Définissez vos disponibilités et tarifs comme vous le souhaitez.',
      icon: '⏰',
    },
    {
      title: 'Support dédié',
      description: 'Notre équipe est là pour vous accompagner dans votre développement.',
      icon: '🤝',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <ProNavbar />

      {/* Hero */}
      <section className="py-10 sm:py-16 lg:py-20 relative overflow-hidden" style={{ backgroundColor: '#fdf9f4' }}>
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: 'rgba(65, 0, 92, 0.08)' }} aria-hidden="true"></div>
        <div className="absolute bottom-0 left-0 w-40 sm:w-80 h-40 sm:h-80 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: 'rgba(240, 135, 159, 0.15)' }} aria-hidden="true"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Comment ça{' '}
            <span style={{ color: '#41005c' }}>
              marche ?
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
            Découvrez comment NeuroCare vous aide à développer votre activité et à accompagner plus de familles.
          </p>
          <Link
            href="/auth/register-educator"
            className="inline-flex items-center gap-2 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-lg transition-all shadow-lg hover:shadow-xl hover:opacity-90"
            style={{ backgroundColor: '#41005c' }}
          >
            Créer mon profil gratuitement
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="py-10 sm:py-16 lg:py-20" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 sm:space-y-16">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content */}
                <div className="flex-1 w-full">
                  <div className="mb-4 sm:mb-5">
                    <div
                      className="relative inline-flex w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl sm:rounded-3xl items-center justify-center shadow-lg"
                      style={{
                        background: index % 2 === 0
                          ? 'linear-gradient(135deg, #41005c 0%, #6b21a8 100%)'
                          : 'linear-gradient(135deg, #f0879f 0%, #ec4899 100%)',
                      }}
                    >
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                        {step.number}
                      </span>
                      {/* Decorative ring */}
                      <div
                        className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 opacity-30"
                        style={{ borderColor: 'white' }}
                      />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">{step.title}</h2>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">{step.description}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {step.tips.map((tip, tipIndex) => (
                      <span
                        key={tipIndex}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium"
                        style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)', color: '#41005c' }}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {tip}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Illustration */}
                <div className="flex-1 w-full max-w-xs sm:max-w-sm lg:max-w-md">
                  <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 aspect-square flex items-center justify-center" style={{ backgroundColor: index % 2 === 0 ? 'rgba(65, 0, 92, 0.08)' : 'rgba(240, 135, 159, 0.12)' }}>
                    {step.illustration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-10 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Pourquoi rejoindre{' '}
              <span style={{ color: '#41005c' }}>NeuroCare</span>{' '}
              <span style={{ color: '#f0879f' }}>Pro</span> ?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">
              Des avantages concrets pour développer votre activité.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all hover:-translate-y-1"
                style={{ borderColor: 'transparent' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(65, 0, 92, 0.3)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-4">{benefit.icon}</div>
                <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-16 lg:py-20" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 lg:p-12 text-center text-white" style={{ backgroundColor: '#41005c' }}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Prêt à vous lancer ?
            </h2>
            <p className="text-sm sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 px-2">
              Créez votre profil gratuitement et commencez à recevoir des demandes de familles.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/auth/register-educator"
                className="px-5 sm:px-8 py-3 sm:py-4 bg-white rounded-xl hover:bg-gray-100 font-bold text-sm sm:text-lg shadow-xl transition-all"
                style={{ color: '#41005c' }}
              >
                Créer mon profil gratuit
              </Link>
              <Link
                href="/pro/pricing"
                className="px-5 sm:px-8 py-3 sm:py-4 text-white border-2 border-white/30 rounded-xl hover:bg-white/10 font-bold text-sm sm:text-lg transition-all"
                style={{ backgroundColor: 'rgba(240, 135, 159, 0.5)' }}
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-8 sm:py-12 px-4 sm:px-6" style={{ backgroundColor: '#41005c' }} role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
            {/* Logo et description */}
            <div className="col-span-2 sm:col-span-1">
              <Link href="/pro" className="inline-block mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo-neurocare.svg"
                    alt="Logo NeuroCare Pro"
                    className="h-12 sm:h-16 brightness-0 invert"
                  />
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ backgroundColor: '#f0879f' }}>
                    PRO
                  </span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                La plateforme de référence pour les professionnels de l'accompagnement des troubles neurodéveloppementaux.
              </p>
            </div>

            {/* Pour les pros */}
            <nav aria-labelledby="footer-nav-pros">
              <h3 id="footer-nav-pros" className="font-bold text-white mb-3 sm:mb-4 text-sm sm:text-base">Pour les pros</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/pro/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/pro/how-it-works" className="hover:text-white transition-colors">Comment ça marche</Link></li>
                <li><Link href="/pro/sap-accreditation" className="hover:text-white transition-colors">Guide SAP</Link></li>
                <li><Link href="/auth/register-educator" className="hover:text-white transition-colors">S'inscrire</Link></li>
              </ul>
            </nav>

            {/* Ressources */}
            <nav aria-labelledby="footer-nav-ressources">
              <h3 id="footer-nav-ressources" className="font-bold text-white mb-3 sm:mb-4 text-sm sm:text-base">Ressources</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </nav>

            {/* Familles */}
            <nav aria-labelledby="footer-nav-familles">
              <h3 id="footer-nav-familles" className="font-bold text-white mb-3 sm:mb-4 text-sm sm:text-base">Familles</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <li><Link href="/" className="hover:text-white transition-colors">Accueil familles</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un professionnel</Link></li>
                <li><Link href="/familles/aides-financieres" className="hover:text-white transition-colors">Aides financières</Link></li>
              </ul>
            </nav>
          </div>

          {/* Séparateur */}
          <div className="border-t pt-6 sm:pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              {/* Liens légaux */}
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
                  <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
                </div>
              </nav>

              {/* Copyright */}
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                © 2025 NeuroCare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
