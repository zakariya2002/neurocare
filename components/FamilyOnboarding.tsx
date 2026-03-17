'use client';

import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';

interface FamilyOnboardingProps {
  familyId: string;
  userEmail?: string;
  onComplete?: () => void;
}

export default function FamilyOnboarding({ familyId, userEmail, onComplete }: FamilyOnboardingProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 480);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Vérifier si le tutoriel doit être lancé (uniquement après inscription OU relance manuelle)
  useEffect(() => {
    const pendingOnboarding = sessionStorage.getItem('pending_family_onboarding');
    const shouldRestart = localStorage.getItem(`restart_family_onboarding_${familyId}`);

    // Lancer le tutoriel si :
    // 1. C'est une nouvelle inscription
    // 2. OU l'utilisateur a demandé à relancer le tutoriel
    if (pendingOnboarding || shouldRestart) {
      // Nettoyer les flags
      sessionStorage.removeItem('pending_family_onboarding');
      localStorage.removeItem(`restart_family_onboarding_${familyId}`);

      // Délai pour laisser la page se charger
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [familyId, userEmail]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f4f4' }}>
            <svg className="w-10 h-10" fill="none" stroke="#027e7e" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#027e7e' }}>
            Bienvenue sur NeuroCare !
          </h2>
          <p className="text-gray-600">
            Découvrez les fonctionnalités principales pour accompagner votre enfant.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="menu-button"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Menu de navigation
          </h3>
          <p className="text-gray-600">
            Accédez à toutes les fonctionnalités de l'application depuis ce menu.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="appointments-section"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Vos prochains rendez-vous
          </h3>
          <p className="text-gray-600">
            Visualisez vos rendez-vous à venir en un coup d'œil.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-profile"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Mon profil
          </h3>
          <p className="text-gray-600">
            Gérez vos informations personnelles et vos préférences de compte.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-children"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Mes proches
          </h3>
          <p className="text-gray-600">
            Créez et gérez les profils de vos enfants. Accédez à leur dossier complet et leur PPA.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-bookings"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Mes rendez-vous
          </h3>
          <p className="text-gray-600">
            Consultez, confirmez ou annulez vos rendez-vous passés et à venir.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-search"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Recherche
          </h3>
          <p className="text-gray-600">
            Trouvez des professionnels qualifiés par spécialité, localisation et disponibilité.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-messages"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Mes messages
          </h3>
          <p className="text-gray-600">
            Communiquez directement avec les professionnels qui accompagnent votre enfant.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-favorites"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Mes favoris
          </h3>
          <p className="text-gray-600">
            Retrouvez rapidement les professionnels que vous avez ajoutés en favoris.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-receipts"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Mes reçus
          </h3>
          <p className="text-gray-600">
            Téléchargez vos reçus et factures pour vos démarches administratives.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-help"]',
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2" style={{ color: '#027e7e' }}>
            Aides financières
          </h3>
          <p className="text-gray-600">
            Découvrez les aides disponibles (AEEH, PCH, etc.) et simulez vos droits.
          </p>
        </div>
      ),
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f4f4' }}>
            <svg className="w-10 h-10" fill="none" stroke="#027e7e" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#027e7e' }}>
            Vous êtes prêt !
          </h2>
          <p className="text-gray-600">
            Explorez l'application. Relancez ce tutoriel depuis le menu si besoin.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      onComplete?.();
    }
  };

  // Fonction pour relancer le tutoriel (accessible via un bouton)
  const restartTutorial = () => {
    setStepIndex(0);
    setRun(true);
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer le tutoriel',
      }}
      styles={{
        options: {
          primaryColor: '#027e7e',
          backgroundColor: '#fdf9f4',
          textColor: '#374151',
          zIndex: 10000,
          width: isMobile ? 280 : 340,
        },
        tooltip: {
          borderRadius: 16,
          padding: isMobile ? 16 : 20,
          maxWidth: isMobile ? '90vw' : 340,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: isMobile ? 16 : 18,
          fontWeight: 700,
        },
        tooltipContent: {
          padding: '8px 0',
          fontSize: isMobile ? 13 : 14,
        },
        buttonNext: {
          backgroundColor: '#027e7e',
          borderRadius: 12,
          padding: isMobile ? '10px 16px' : '12px 24px',
          fontSize: isMobile ? 13 : 14,
          fontWeight: 600,
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 8,
          fontSize: isMobile ? 12 : 14,
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: isMobile ? 11 : 13,
        },
        spotlight: {
          borderRadius: 12,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        beacon: {
          display: 'none',
        },
        beaconInner: {
          backgroundColor: '#f0879f',
        },
        beaconOuter: {
          backgroundColor: 'rgba(240, 135, 159, 0.3)',
          borderColor: '#f0879f',
        },
      }}
      floaterProps={{
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
    />
  );
}

// Hook pour permettre de relancer le tutoriel depuis n'importe où
export const useFamilyOnboarding = (familyId: string) => {
  const restartTutorial = () => {
    // Utiliser le nouveau flag de relance
    localStorage.setItem(`restart_family_onboarding_${familyId}`, 'true');
    window.location.reload();
  };

  return { restartTutorial };
};
