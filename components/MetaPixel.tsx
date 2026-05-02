'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import {
  COOKIE_CONSENT_EVENT,
  type CookieConsent,
  readConsent,
} from '@/lib/cookie-consent';
import { META_PIXEL_ID } from '@/lib/meta-pixel';

// Composant injecté dans `app/layout.tsx`. Il :
//   1. ne charge le snippet Pixel que si l'utilisateur a accordé son
//      consentement marketing (catégorie "Marketing/publicité" du bandeau) ;
//   2. utilise le mode consent v2 de Meta (`fbq('consent', 'revoke'/'grant')`)
//      pour respecter les recommandations de Meta dans l'EEE ;
//   3. déclenche un `PageView` à chaque navigation client (App Router ne
//      recharge pas la page entre les routes, on doit le faire à la main).

function MetaPixelInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);

  // Synchronisation initiale + écoute des changements de consentement
  useEffect(() => {
    const sync = () => setMarketingConsent(readConsent()?.marketing === true);
    sync();

    const onConsentChanged = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsent>).detail;
      const granted = detail?.marketing === true;
      setMarketingConsent(granted);

      if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
      window.fbq('consent', granted ? 'grant' : 'revoke');
      if (granted) {
        // Au passage opt-out → opt-in après ouverture de la page, on rejoue un
        // PageView pour ne pas perdre la visite courante.
        window.fbq('track', 'PageView');
      }
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentChanged);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentChanged);
  }, []);

  // PageView sur changement de route une fois le script chargé et consentement OK
  useEffect(() => {
    if (!scriptLoaded || !marketingConsent) return;
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    window.fbq('track', 'PageView');
  }, [pathname, searchParams, scriptLoaded, marketingConsent]);

  if (!META_PIXEL_ID) return null;
  if (!marketingConsent) return null;

  return (
    <>
      <Script
        id="meta-pixel-base"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('consent', 'grant');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

export default function MetaPixel() {
  // useSearchParams() exige une frontière Suspense (cf. Next.js docs).
  return (
    <Suspense fallback={null}>
      <MetaPixelInner />
    </Suspense>
  );
}
