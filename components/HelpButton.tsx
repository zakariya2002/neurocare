'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function HelpButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  // Bouton d'aide visible pour tous les utilisateurs

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <Link
        href="/support"
        className="group flex items-center gap-0 transition-all duration-300 ease-out"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        {/* Texte qui apparaît au hover */}
        <div className="overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-300 ease-out">
          <div className="flex items-center gap-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-0 group-hover:px-6 py-4 rounded-l-full shadow-lg whitespace-nowrap">
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight">Besoin d'aide ?</span>
              <span className="text-xs text-white/90 leading-tight">Nous sommes là pour vous</span>
            </div>
          </div>
        </div>

        {/* Bouton icône (toujours visible) */}
        <div className="relative">
          {/* Effet de glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>

          {/* Bouton principal */}
          <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 rounded-full shadow-2xl group-hover:shadow-primary-500/50 transition-all duration-300 group-hover:scale-110 active:scale-95 ring-4 ring-white group-hover:ring-6">
            {/* Icône */}
            <svg
              className="w-8 h-8 text-white transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            {/* Animation pulse */}
            <span className="absolute inset-0 rounded-full bg-primary-300 animate-ping opacity-20 group-hover:opacity-0 transition-opacity"></span>
          </div>

          {/* Badge "Nouveau" ou point de notification (optionnel) */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white animate-pulse"></span>
        </div>
      </Link>
    </div>
  );
}
