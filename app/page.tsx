'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { professions } from '@/lib/professions-config';
import CommunityPreview from '@/components/community/CommunityPreview';

// Types de suggestions pour la recherche
type SuggestionType = 'profession' | 'city' | 'tnd';

interface SearchSuggestion {
  type: SuggestionType;
  label: string;
  value: string;
  icon: string;
}

// Liste des TNDs/Spécialisations
const tndList = [
  { label: 'Troubles du spectre autistique (TSA)', value: 'TSA' },
  { label: 'Autisme', value: 'autisme' },
  { label: 'TDAH', value: 'TDAH' },
  { label: 'Troubles DYS', value: 'DYS' },
  { label: 'Dyslexie', value: 'dyslexie' },
  { label: 'Dyspraxie', value: 'dyspraxie' },
  { label: 'Troubles du comportement', value: 'comportement' },
  { label: 'Habiletés sociales', value: 'habiletes-sociales' },
  { label: 'Intégration sensorielle', value: 'sensoriel' },
  { label: 'Communication alternative (PECS, Makaton)', value: 'communication' },
  { label: 'Méthode ABA', value: 'ABA' },
  { label: 'Méthode TEACCH', value: 'TEACCH' },
  { label: 'Guidance parentale', value: 'guidance-parentale' },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'educator' | 'family' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // États pour la recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setUserType(null);
      } else if (session?.user) {
        setUser(session.user);
        checkUserType(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserType = async (userId: string) => {
    const { data: educator } = await supabase
      .from('educator_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (educator) {
      setUserType('educator');
    } else {
      setUserType('family');
    }
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      checkUserType(session.user.id);
    } else {
      setUser(null);
      setUserType(null);
    }
  };

  const getDashboardLink = () => {
    if (userType === 'educator') return '/dashboard/educator';
    if (userType === 'family') return '/dashboard/family';
    return '/auth/login';
  };

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche de suggestions
  const searchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const queryLower = query.toLowerCase();
    const results: SearchSuggestion[] = [];

    // 1. Rechercher dans les professions
    professions.forEach(prof => {
      if (prof.label.toLowerCase().includes(queryLower)) {
        results.push({
          type: 'profession',
          label: prof.label,
          value: prof.value,
          icon: '👨‍⚕️'
        });
      }
    });

    // 2. Rechercher dans les TNDs/Spécialisations
    tndList.forEach(tnd => {
      if (tnd.label.toLowerCase().includes(queryLower)) {
        results.push({
          type: 'tnd',
          label: tnd.label,
          value: tnd.value,
          icon: '🧠'
        });
      }
    });

    // 3. Rechercher les villes via l'API
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&type=municipality`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        data.features.forEach((feature: any) => {
          results.push({
            type: 'city',
            label: feature.properties.label,
            value: feature.properties.label,
            icon: '📍'
          });
        });
      }
    } catch (error) {
      console.error('Erreur recherche ville:', error);
    }

    setSuggestions(results.slice(0, 8));
    setShowSuggestions(results.length > 0);
    setIsSearching(false);
  };

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchSuggestions(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sélection d'une suggestion
  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setSearchQuery('');

    // Rediriger vers la page recherche avec le bon filtre
    switch (suggestion.type) {
      case 'profession':
        router.push(`/search?profession=${encodeURIComponent(suggestion.value)}`);
        break;
      case 'city':
        router.push(`/search?location=${encodeURIComponent(suggestion.value)}`);
        break;
      case 'tnd':
        router.push(`/search?specialization=${encodeURIComponent(suggestion.label)}`);
        break;
    }
  };

  // Recherche directe (entrée)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Articles pour le carrousel
  const articles = [
    {
      id: 1,
      title: "Préparer son enfant à une première consultation",
      image: "/images/articles/consultation.jpg",
      link: "/blog/preparer-consultation"
    },
    {
      id: 2,
      title: "Gérer les crises sensorielles : techniques pratiques",
      image: "/images/articles/crises-sensorielles.jpg",
      imagePosition: "center 30%",
      link: "/blog/crises-sensorielles"
    },
    {
      id: 3,
      title: "MDPH : constituer son dossier efficacement",
      image: "/images/articles/mdph.jpg",
      link: "/blog/mdph-dossier"
    },
    {
      id: 4,
      title: "Que fait un psychomotricien ?",
      image: "/images/articles/psychomotricien.jpg",
      link: "/blog/psychomotricien"
    },
    {
      id: 5,
      title: "Prendre soin de soi quand on est parent aidant",
      image: "/images/articles/bien-etre-aidants.jpg",
      link: "/blog/bien-etre-aidants"
    }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Mobile Layout */}
          <div className="flex lg:hidden items-center justify-between h-14">
            {/* Mobile: Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-white"
              aria-label="Ouvrir le menu de navigation"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile: Logo centré */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2" aria-label="Retour à l'accueil NeuroCare">
              <img
                src="/images/logo-neurocare.svg"
                alt="NeuroCare"
                className="h-16"
              />
            </Link>

            {/* Mobile: Espace vide pour équilibrer */}
            <div className="w-8"></div>
          </div>

          {/* Desktop Layout - Logo centré */}
          <div className="hidden lg:flex items-center h-14 xl:h-16">
            {/* Gauche: Rechercher, À propos, Contact */}
            <nav className="flex-1 flex items-center justify-end gap-0.5 xl:gap-1" role="navigation" aria-label="Navigation principale gauche">
              <Link href="/search" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </Link>
              <Link href="/about" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                À propos
              </Link>
              <Link href="/contact" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </Link>
              {!user && (
                <Link href="/blog" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                  <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Blog
                </Link>
              )}
            </nav>

            {/* Centre: Logo */}
            <Link href="/" className="flex-shrink-0 mx-6 xl:mx-10" aria-label="Retour à l'accueil NeuroCare">
              <img
                src="/images/logo-neurocare.svg"
                alt="NeuroCare - Plateforme de mise en relation avec des professionnels du neurodéveloppement"
                className="h-12 xl:h-14"
              />
            </Link>

            {/* Droite: Blog (si connecté), Communauté, Espace Pro / Mon compte, Connexion, Inscription */}
            <nav className="flex-1 flex items-center justify-start gap-0.5 xl:gap-1" role="navigation" aria-label="Navigation principale droite">
              {user && (
                <Link href="/blog" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                  <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Blog
                </Link>
              )}
              <Link href="/community" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Communauté
              </Link>
              {user ? (
                <Link
                  href={getDashboardLink()}
                  className="group ml-1 xl:ml-2 flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm text-white font-semibold rounded-md transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: '#f0879f' }}
                >
                  <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Mon compte
                </Link>
              ) : (
                <>
                  <Link
                    href="/pro"
                    className="group ml-1 flex items-center gap-0.5 px-2 xl:px-2.5 py-1 xl:py-1.5 text-[10px] xl:text-xs rounded font-semibold transition-all hover:opacity-90 whitespace-nowrap"
                    style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}
                  >
                    <svg className="w-3 h-3 xl:w-3.5 xl:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Espace Pro
                  </Link>
                  <Link
                    href="/auth/login"
                    className="ml-4 xl:ml-6 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white font-medium transition-all whitespace-nowrap"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="ml-1 xl:ml-2 px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm text-white font-semibold rounded-md transition-all hover:opacity-90 whitespace-nowrap"
                    style={{ backgroundColor: '#f0879f' }}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-50">
            <nav className="px-3 py-3 space-y-0.5" role="navigation" aria-label="Menu principal">
              <Link
                href="/search"
                className="block py-2 text-sm font-medium text-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Rechercher un professionnel
              </Link>
              <Link
                href="/about"
                className="block py-2 text-sm font-medium text-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                À propos
              </Link>
              <Link
                href="/familles/aides-financieres"
                className="block py-2 text-sm font-medium text-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Aides financières
              </Link>
              <Link
                href="/contact"
                className="block py-2 text-sm font-medium text-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/pro"
                className="block py-2 px-3 rounded-lg text-xs font-semibold text-center my-2"
                style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Vous êtes professionnel ?
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-2 py-2 text-sm font-medium text-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Blog
              </Link>
              <Link
                href="/community"
                className="flex items-center gap-2 py-2 text-sm font-medium text-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Communauté
              </Link>
              {user ? (
                <Link
                  href={getDashboardLink()}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-white mt-2"
                  style={{ backgroundColor: '#f0879f' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Mon compte
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block py-2 px-3 text-sm text-white rounded-lg text-center font-semibold mt-2"
                    style={{ backgroundColor: '#f0879f' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block py-2 px-3 text-sm text-white rounded-lg text-center font-semibold mt-1.5"
                    style={{ backgroundColor: '#027e7e' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-[280px] sm:h-[350px] lg:h-[420px] mt-14 xl:mt-16">
        {/* Image de fond avec fallback gradient pour desktop */}
        <div className="absolute inset-0">
          {/* Gradient de fond (fallback pour grands écrans) */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-teal-400"></div>
          {/* Image par-dessus avec opacity réduite sur desktop */}
          <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center lg:bg-top lg:opacity-80"></div>
          {/* Overlay pour améliorer la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 lg:from-black/30 lg:to-black/40"></div>
        </div>

        {/* Contenu */}
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium mb-6 lg:mb-10 max-w-md lg:max-w-3xl leading-relaxed">
            Trouvez le professionnel idéal pour accompagner votre enfant
          </h1>

          {/* Barre de recherche */}
          <div className="w-full max-w-md lg:max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} role="search" aria-label="Recherche de professionnels">
              <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden">
                <input
                  type="text"
                  placeholder="Profession, ville ou TND..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="flex-1 px-5 py-3 text-gray-700 outline-none"
                  aria-label="Rechercher un professionnel par profession, ville ou trouble neurodéveloppemental"
                  aria-autocomplete="list"
                  aria-controls={showSuggestions ? "search-suggestions" : undefined}
                  aria-expanded={showSuggestions}
                />
                <button type="submit" className="px-4 py-3 text-gray-400 hover:text-teal-600 transition-colors" aria-label="Lancer la recherche">
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" role="status" aria-label="Recherche en cours"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {/* Dropdown des suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div id="search-suggestions" className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50" role="listbox" aria-label="Suggestions de recherche">
                <div className="max-h-80 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${index}`}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
                      role="option"
                      aria-label={`${suggestion.label} - ${suggestion.type === 'profession' ? 'Profession' : suggestion.type === 'city' ? 'Ville' : 'Spécialisation / TND'}`}
                    >
                      <span className="text-xl" aria-hidden="true">{suggestion.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium truncate">{suggestion.label}</p>
                        <p className="text-xs text-gray-500">
                          {suggestion.type === 'profession' && 'Profession'}
                          {suggestion.type === 'city' && 'Ville'}
                          {suggestion.type === 'tnd' && 'Spécialisation / TND'}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section Professionnels de confiance */}
      <section className="py-10 lg:py-16 px-6" aria-labelledby="section-professionnels">
        <div className="max-w-7xl mx-auto">
          {/* Icône centrée en haut */}
          <div className="flex justify-center mb-6 lg:mb-8">
            <img
              src="/images/icons/pro-badge.svg"
              alt="Badge de vérification des professionnels - Tous nos professionnels sont vérifiés"
              className="w-20 h-20 lg:w-32 lg:h-32 object-contain"
            />
          </div>

          <h2 id="section-professionnels" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2" style={{ color: '#027e7e' }}>
            Des professionnels de confiance
          </h2>
          {/* Barre décorative élargie */}
          <div className="flex justify-center mb-6 lg:mb-10" aria-hidden="true">
            <div className="w-full max-w-lg lg:max-w-2xl h-[1px] bg-gray-300"></div>
          </div>

          {/* Texte centré */}
          <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14">
            <p className="text-gray-600 text-lg sm:text-xl lg:text-2xl mb-4 leading-relaxed">
              Nous savons à quel point le choix d'un professionnel peut s'avérer compliqué.
            </p>

            <p className="text-gray-600 text-lg sm:text-xl lg:text-2xl leading-relaxed">
              Sur <span className="font-bold text-gray-800">NeuroCare</span> tous les professionnels sont soigneusement sélectionnés et vérifiés pour répondre à vos besoins.
            </p>
          </div>

          {/* Logos des organismes centrés */}
          <div className="flex justify-center items-center gap-6 lg:gap-12 flex-wrap" role="list" aria-label="Organismes de vérification">
            {/* RPPS / Annuaire Santé */}
            <div className="w-24 h-24 lg:w-36 lg:h-36 rounded-full shadow-md flex items-center justify-center overflow-hidden" role="listitem">
              <img
                src="/images/logos/rpps-logo.svg"
                alt="RPPS - Répertoire Partagé des Professionnels de Santé"
                className="w-full h-full object-cover"
              />
            </div>
            {/* ARS */}
            <div className="w-24 h-24 lg:w-36 lg:h-36 rounded-full shadow-md flex items-center justify-center overflow-hidden" role="listitem">
              <img
                src="/images/logos/ars-logo.svg"
                alt="ARS - Agence Régionale de Santé"
                className="w-full h-full object-cover"
              />
            </div>
            {/* France Compétences / RNCP */}
            <div className="w-24 h-24 lg:w-36 lg:h-36 rounded-full shadow-md flex items-center justify-center overflow-hidden" role="listitem">
              <img
                src="/images/logos/france-competences-logo.svg"
                alt="France Compétences - Certification professionnelle"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section Articles - Carrousel sur mobile, Grid sur desktop */}
      <section className="py-8 lg:py-16 px-4 sm:px-0" aria-labelledby="section-articles">
        <div className="max-w-7xl mx-auto">
          <h2 id="section-articles" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8" style={{ color: '#027e7e' }}>
            Nos derniers articles
          </h2>

          {/* Mobile: Carrousel */}
          <div
            ref={carouselRef}
            className="lg:hidden flex gap-4 overflow-x-auto pl-4 pr-6 sm:px-8 pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role="region"
            aria-label="Carrousel d'articles"
          >
            {articles.map((article: any) => (
              <Link
                key={article.id}
                href={article.link}
                className="flex-shrink-0 w-[48%] sm:w-[32%] snap-start"
                aria-label={`Lire l'article: ${article.title}`}
              >
                <div className="relative h-36 sm:h-44 rounded-xl md:rounded-2xl overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400">
                    <div
                      className="absolute inset-0 bg-cover"
                      style={{
                        backgroundImage: `url('${article.image}')`,
                        backgroundPosition: article.imagePosition || 'center'
                      }}
                    ></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white text-sm font-semibold leading-tight line-clamp-3">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Grid - Affiche les 3 premiers articles */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-8 px-8">
            {articles.slice(0, 3).map((article: any) => (
              <Link
                key={article.id}
                href={article.link}
                className="group"
                aria-label={`Lire l'article: ${article.title}`}
              >
                <div className="relative h-64 rounded-xl md:rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400">
                    <div
                      className="absolute inset-0 bg-cover group-hover:scale-105 transition-transform duration-300"
                      style={{
                        backgroundImage: `url('${article.image}')`,
                        backgroundPosition: article.imagePosition || 'center'
                      }}
                    ></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white text-lg font-semibold leading-tight">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-6 lg:mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-medium lg:text-lg px-6 py-3 rounded-xl transition-all hover:bg-teal-50"
              style={{ color: '#027e7e' }}
            >
              Voir tous les articles
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Nos engagements */}
      <section className="py-10 lg:py-16 px-6" aria-labelledby="section-engagements">
        <div className="max-w-7xl mx-auto">
          <div className="lg:flex lg:items-center lg:gap-16">
            {/* Gauche: Icône */}
            <div className="hidden lg:flex lg:flex-1 lg:justify-center">
              <img
                src="/images/icons/handshake-badge.svg"
                alt="Symbole de confiance et engagement - Nous nous engageons à protéger vos données"
                className="w-40 h-40 object-contain"
              />
            </div>

            {/* Droite: Texte */}
            <div className="lg:flex-1 text-center lg:text-left">
              <h2 id="section-engagements" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>
                Nos engagements
              </h2>
              <p className="text-xl sm:text-2xl lg:text-3xl font-medium mb-4" style={{ color: '#E8747C', fontFamily: "'Open Sans', sans-serif" }}>
                Confidentialité et sécurité
              </p>
              {/* Petite barre décorative */}
              <div className="flex justify-center lg:justify-start mb-6" aria-hidden="true">
                <div className="w-80 h-[1px] bg-gray-300"></div>
              </div>

              <p className="text-gray-600 max-w-sm mx-auto lg:mx-0 lg:max-w-lg lg:text-lg mb-6 leading-relaxed">
                Vos données personnelles sont protégées. Nous garantissons des échanges sécurisés et une totale transparence.
              </p>

              {/* Icône poignée de main - mobile only */}
              <div className="flex justify-center lg:hidden">
                <img
                  src="/images/icons/handshake-badge.svg"
                  alt="Symbole de confiance et engagement - Nous nous engageons à protéger vos données"
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Aide financière */}
      <section className="px-4 lg:px-8 py-8 lg:py-16" aria-labelledby="section-aide-financiere">
        <div className="max-w-7xl mx-auto">
          <div className="bg-teal-600 rounded-3xl p-6 lg:p-12 text-white max-w-md lg:max-w-none mx-auto lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="text-center lg:text-left lg:flex-1">
              <h2 id="section-aide-financiere" className="text-xl lg:text-3xl font-bold mb-1">
                Aide financière
              </h2>
              <p className="text-teal-100 mb-4 lg:text-xl">
                Quels sont mes droits ?
              </p>

              <p className="text-sm lg:text-base text-teal-50 mb-6 lg:mb-0 leading-relaxed lg:max-w-xl">
                Plusieurs aides existent pour financer l'accompagnement de votre proche. Chèque CESU, AEEH, PCH, ... consulter votre éligibilité.
              </p>
            </div>

            <div className="text-center lg:flex-shrink-0">
              <Link
                href="/familles/aides-financieres"
                className="inline-block bg-[#E8747C] hover:bg-[#d65f67] text-white font-semibold px-6 lg:px-10 py-3 lg:py-4 rounded-full transition-colors lg:text-lg"
                aria-label="Accéder au simulateur d'aides financières"
              >
                Simulateur d'aide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section Communauté */}
      <CommunityPreview />

      {/* Section Vous êtes aidants / professionnel */}
      <section className="py-10 lg:py-16 px-4 lg:px-8" aria-labelledby="section-cta">
        <h2 id="section-cta" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 lg:mb-12" style={{ color: '#027e7e' }}>
          Rejoignez NeuroCare
        </h2>
        <div className="max-w-lg lg:max-w-6xl mx-auto space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Card Aidants */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
                <svg className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Vous êtes aidants ?</h3>
            </div>

            <ul className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#027e7e' }}>
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 lg:text-lg">Trouvez des professionnels qualifiés près de chez vous</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#027e7e' }}>
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 lg:text-lg">Consultez leurs profils et compétences</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#027e7e' }}>
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 lg:text-lg">Échangez en toute confiance</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#027e7e' }}>
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 lg:text-lg">100% gratuit, sans engagement</span>
              </li>
            </ul>

            <Link
              href="/search"
              className="block w-full text-center text-white font-semibold py-3.5 lg:py-4 lg:text-lg rounded-xl transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: '#027e7e' }}
            >
              Commencer ma recherche
            </Link>
          </div>

          {/* Card Professionnels */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                <svg className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Vous êtes un professionnel ?</h3>
            </div>

            <ul className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 lg:text-lg">Valorisez votre expertise et vos diplômes</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 lg:text-lg">Développez votre activité à votre rythme</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 lg:text-lg">Gagnez du temps sur l'administratif</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 lg:text-lg">Gérez vos revenus facilement</span>
              </li>
            </ul>

            <Link
              href="/pro/pricing"
              className="block w-full text-center text-white font-semibold py-3.5 lg:py-4 lg:text-lg rounded-xl transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: '#41005c' }}
            >
              Découvrir les offres
            </Link>
          </div>
        </div>
      </section>

      {/* Footer complet */}
      <footer className="text-white py-12 lg:py-16 px-6 lg:px-8" style={{ backgroundColor: '#027e7e' }} role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10 lg:mb-14">
            {/* Logo et description */}
            <div className="lg:pr-8">
              <Link href="/" className="inline-block mb-4 lg:mb-6" aria-label="Retour à l'accueil NeuroCare">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="Logo NeuroCare"
                  className="h-20 lg:h-24 brightness-0 invert"
                />
              </Link>
              <p className="text-sm lg:text-base leading-relaxed text-teal-100">
                La plateforme qui connecte les familles avec des professionnels du neurodéveloppement vérifiés et qualifiés.
              </p>
            </div>

            {/* Navigation */}
            <nav aria-labelledby="footer-nav-1">
              <h3 id="footer-nav-1" className="font-bold text-white mb-4 lg:mb-6 lg:text-lg">Navigation</h3>
              <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-teal-100">
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un professionnel</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </nav>

            {/* Familles */}
            <nav aria-labelledby="footer-nav-2">
              <h3 id="footer-nav-2" className="font-bold text-white mb-4 lg:mb-6 lg:text-lg">Familles</h3>
              <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-teal-100">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Créer un compte</Link></li>
                <li><Link href="/familles/aides-financieres" className="hover:text-white transition-colors">Aides financières</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </nav>

            {/* Professionnels */}
            <nav aria-labelledby="footer-nav-3">
              <h3 id="footer-nav-3" className="font-bold text-white mb-4 lg:mb-6 lg:text-lg">Professionnels</h3>
              <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-teal-100">
                <li><Link href="/pro" className="hover:text-white transition-colors">Espace Pro</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Rejoindre neurocare</Link></li>
              </ul>
            </nav>
          </div>

          {/* Séparateur */}
          <div className="border-t border-teal-500 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Liens légaux */}
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-4 text-sm text-teal-100">
                  <Link href="/mentions-legales" className="hover:text-white transition-colors" aria-label="Consulter les mentions légales">
                    Mentions légales
                  </Link>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors" aria-label="Consulter la politique de confidentialité et RGPD">
                    Politique de confidentialité
                  </Link>
                  <Link href="/cgu" className="hover:text-white transition-colors" aria-label="Consulter les conditions générales d'utilisation">
                    CGU
                  </Link>
                </div>
              </nav>

              {/* Copyright */}
              <p className="text-sm text-teal-200">
                © 2024 neurocare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
