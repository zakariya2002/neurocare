'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { professions } from '@/lib/professions-config';
import { trackEvent as trackMetaEvent } from '@/lib/meta-pixel';
import { openCookiePreferences } from '@/lib/cookie-consent';
import CommunityPreview from '@/components/community/CommunityPreview';
import BetaModal from '@/components/BetaModal';
import SocialLinks from '@/components/SocialLinks';

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

const faqItems = [
  {
    q: 'NeuroCare est-il gratuit ?',
    a: 'Oui, la recherche et la mise en relation sont 100% gratuites pour les familles. Aucun frais caché, aucun engagement.',
  },
  {
    q: 'Comment les professionnels sont-ils vérifiés ?',
    a: 'Nous vérifions les diplômes, certifications et numéro RPPS/ADELI de chaque professionnel avant la mise en ligne de son profil.',
  },
  {
    q: 'Mon enfant n\'a pas encore de diagnostic, puis-je utiliser NeuroCare ?',
    a: 'Bien sûr. Vous pouvez rechercher des professionnels par type de trouble ou par besoin, même sans diagnostic formel.',
  },
  {
    q: 'Quels types de professionnels sont disponibles ?',
    a: 'Éducateurs spécialisés, psychologues, orthophonistes, psychomotriciens, ergothérapeutes, neuropsychologues et plus encore.',
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: 'Oui. Vos données sont hébergées en France, protégées par chiffrement et conformes au RGPD. Nous ne les partageons jamais.',
  },
  {
    q: 'Comment contacter un professionnel ?',
    a: 'Une fois le profil trouvé, vous pouvez envoyer un message directement via la plateforme. Le professionnel vous répondra dans les meilleurs délais.',
  },
];

const professionTypes = [
  { label: 'Éducateurs spécialisés', value: 'educator', desc: 'Autisme, TDAH, habiletés sociales', icon: '🧑‍🏫', color: '#027e7e', bg: '#e6f5f5' },
  { label: 'Psychologues', value: 'psychologist', desc: 'Bilans, thérapies, guidance parentale', icon: '🧠', color: '#6b21a8', bg: '#f3e8ff' },
  { label: 'Orthophonistes', value: 'speech_therapist', desc: 'Langage, communication, troubles DYS', icon: '💬', color: '#0369a1', bg: '#e0f2fe' },
  { label: 'Psychomotriciens', value: 'psychomotricist', desc: 'Motricité, régulation sensorielle', icon: '🤸', color: '#b45309', bg: '#fef3c7' },
  { label: 'Ergothérapeutes', value: 'occupational_therapist', desc: 'Autonomie, adaptation du quotidien', icon: '✋', color: '#059669', bg: '#d1fae5' },
  { label: 'Neuropsychologues', value: 'neuropsychologist', desc: 'Bilans neuropsychologiques, TDAH', icon: '🔬', color: '#dc2626', bg: '#fee2e2' },
];

const testimonials = [
  {
    text: 'Après 8 mois de recherche, j\'ai trouvé un éducateur spécialisé en autisme à 15 minutes de chez nous. Mon fils a enfin un suivi adapté.',
    author: 'Marie',
    detail: 'Maman de Lucas, 6 ans (TSA)',
    initials: 'M',
    color: '#027e7e',
  },
  {
    text: 'On ne savait même pas quel type de professionnel chercher. NeuroCare nous a aidés à y voir clair et à trouver la bonne personne.',
    author: 'Karim et Sophie',
    detail: 'Parents de Léa, 4 ans (TDAH)',
    initials: 'K',
    color: '#6b21a8',
  },
  {
    text: 'Le profil détaillé m\'a rassurée : je pouvais voir les diplômes, les méthodes utilisées. J\'ai pu choisir en confiance.',
    author: 'Isabelle',
    detail: 'Maman d\'Emma, 9 ans (DYS)',
    initials: 'I',
    color: '#E8747C',
  },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'educator' | 'family' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Avis plateforme
  const [platformReviews, setPlatformReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', authorName: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  // États pour la recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    fetchPlatformReviews();

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

  // Fermeture sidebar avec Escape + bloquer scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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

  const fetchPlatformReviews = async () => {
    try {
      const res = await fetch('/api/platform-reviews');
      const data = await res.json();
      if (Array.isArray(data)) setPlatformReviews(data);
    } catch (e) { /* silently fail */ }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      const res = await fetch('/api/platform-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewMessage(data.message);
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '', authorName: '' });
    } catch (err: any) {
      setReviewMessage(err.message || 'Erreur');
    } finally {
      setReviewSubmitting(false);
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

    professions.forEach(prof => {
      if (prof.label.toLowerCase().includes(queryLower)) {
        results.push({ type: 'profession', label: prof.label, value: prof.value, icon: '👨‍⚕️' });
      }
    });

    tndList.forEach(tnd => {
      if (tnd.label.toLowerCase().includes(queryLower)) {
        results.push({ type: 'tnd', label: tnd.label, value: tnd.value, icon: '🧠' });
      }
    });

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&type=municipality`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        data.features.forEach((feature: any) => {
          results.push({ type: 'city', label: feature.properties.label, value: feature.properties.label, icon: '📍' });
        });
      }
    } catch (error) {
      console.error('Erreur recherche ville:', error);
    }

    setSuggestions(results.slice(0, 8));
    setShowSuggestions(results.length > 0);
    setIsSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchSuggestions(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setSearchQuery('');
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#fdf9f4' }}>
      <BetaModal variant="family" />

      {/* ═══════════════════════════════════════════ */}
      {/* HEADER / NAVBAR                            */}
      {/* ═══════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Mobile Layout */}
          <div className="flex lg:hidden items-center justify-between h-14">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-1.5 text-white z-[60]"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu de navigation"}
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[9px]' : ''}`} />
                <span className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                <span className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`} />
              </div>
            </button>

            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2" aria-label="Retour à l'accueil NeuroCare">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-16" />
            </Link>

            <div className="w-8" />
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center h-14 xl:h-16">
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

            <Link href="/" className="flex-shrink-0 mx-6 xl:mx-10" aria-label="Retour à l'accueil NeuroCare">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-12 xl:h-14" />
            </Link>

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
                Forum
              </Link>
              <Link href="/ressources/lieux-adaptes" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Lieux TND
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
                    className="ml-3 xl:ml-4 px-4 py-2 text-xs xl:text-sm font-medium rounded-lg transition-all hover:opacity-90 whitespace-nowrap"
                    style={{ backgroundColor: '#fdf9f4', color: '#027e7e' }}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => trackMetaEvent('InitiateCheckout', { source: 'header_desktop' })}
                    className="ml-2 xl:ml-3 px-5 xl:px-6 py-2 text-xs xl:text-sm text-white font-semibold rounded-lg transition-all hover:opacity-90 whitespace-nowrap"
                    style={{ backgroundColor: '#f0879f' }}
                  >
                    Inscription
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Overlay sombre */}
        <div
          className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[55] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar mobile */}
        <div
          className={`lg:hidden fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-white z-[56] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
        >
          <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 flex-shrink-0">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-10" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer le menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2" role="navigation" aria-label="Menu principal">
            <div className="px-4">
              <Link href="/search" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Rechercher un professionnel
              </Link>
              <Link href="/about" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                À propos
              </Link>
              <Link href="/familles/aides-financieres" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Aides financières
              </Link>
              <Link href="/contact" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Contact
              </Link>
            </div>

            <div className="my-1 mx-6 border-t border-gray-100" />

            <div className="px-4">
              <Link href="/blog" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                Blog
              </Link>
              <Link href="/community" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Forum
              </Link>
              <Link href="/ressources/lieux-adaptes" className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Lieux de prise en charge TND
              </Link>
            </div>

            <div className="my-1 mx-6 border-t border-gray-100" />

            <div className="px-6 py-2">
              <Link href="/pro" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }} onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Espace professionnel
              </Link>
            </div>
          </nav>

          <div className="flex-shrink-0 px-6 pb-8 pt-4 border-t border-gray-100 space-y-2.5">
            {user ? (
              <Link href={getDashboardLink()} className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white w-full hover:opacity-90 transition-colors" style={{ backgroundColor: '#027e7e' }} onClick={() => setMobileMenuOpen(false)}>
                Mon compte
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold w-full border-2 transition-colors" style={{ borderColor: '#027e7e', color: '#027e7e' }} onClick={() => setMobileMenuOpen(false)}>
                  Se connecter
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold text-white w-full hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#027e7e' }}
                  onClick={() => {
                    trackMetaEvent('InitiateCheckout', { source: 'header_mobile' });
                    setMobileMenuOpen(false);
                  }}
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO                                       */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] mt-14 xl:mt-16 flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.webp"
            alt="Professionnels accompagnant un enfant avec des besoins neurodéveloppementaux"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        <div className="relative w-full px-6 text-center py-10">
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4 max-w-md lg:max-w-3xl mx-auto leading-snug" style={{ fontFamily: 'Verdana, sans-serif', textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}>
            Trouvez le professionnel adapté pour accompagner votre enfant
          </h1>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-6 lg:mb-8 max-w-lg lg:max-w-2xl mx-auto" style={{ fontFamily: "'Open Sans', sans-serif", textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            Autisme, TDAH, troubles DYS... NeuroCare vous aide à trouver des professionnels qualifiés et vérifiés, près de chez vous.
          </p>

          {/* Barre de recherche */}
          <div className="w-full max-w-md lg:max-w-2xl mx-auto relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} role="search" aria-label="Recherche de professionnels">
              <div className="flex items-center bg-white rounded-full shadow-xl overflow-hidden">
                <input
                  type="text"
                  placeholder="Éducateur, orthophoniste, ville, trouble..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="flex-1 px-5 py-3 lg:py-3.5 text-sm lg:text-base text-gray-700 outline-none"
                  aria-label="Rechercher un professionnel"
                  aria-autocomplete="list"
                  aria-controls={showSuggestions ? "search-suggestions" : undefined}
                  aria-expanded={showSuggestions}
                />
                <button type="submit" className="px-5 lg:px-6 self-stretch text-white transition-colors" style={{ backgroundColor: '#027e7e' }} aria-label="Lancer la recherche">
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" role="status" aria-label="Recherche en cours" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            <p className="text-white/70 text-xs mt-2.5">Recherche gratuite, sans inscription</p>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div id="search-suggestions" className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50" role="listbox">
                <div className="max-h-80 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${index}`}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
                      role="option"
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

      {/* ═══════════════════════════════════════════ */}
      {/* BANDEAU DE CONFIANCE                       */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-5 lg:py-6 border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-6 sm:gap-10 lg:gap-16">
          {[
            { icon: (
              <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            ), text: 'Professionnels vérifiés' },
            { icon: (
              <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ), text: '100% gratuit' },
            { icon: (
              <svg className="w-5 h-5" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            ), text: 'Données protégées' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              {item.icon}
              <span className="text-sm font-medium text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* COMMENT ÇA MARCHE — 3 ÉTAPES              */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-12 lg:py-16 px-6" aria-labelledby="how-it-works">
        <div className="max-w-5xl mx-auto">
          <h2 id="how-it-works" className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-3" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>
            Trouver un professionnel en 3 étapes
          </h2>
          <p className="text-center text-gray-500 text-sm lg:text-base mb-10 max-w-lg mx-auto">
            Simple, rapide, et pensé pour les parents.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                step: '1',
                title: 'Recherchez',
                desc: 'Indiquez le type de professionnel, le trouble de votre enfant ou votre ville.',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                ),
              },
              {
                step: '2',
                title: 'Comparez',
                desc: 'Consultez les profils détaillés : diplômes, spécialisations, méthodes, tarifs.',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                ),
              },
              {
                step: '3',
                title: 'Contactez',
                desc: 'Échangez directement avec le professionnel qui correspond à vos besoins.',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#027e7e' }}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* TYPES DE PROFESSIONNELS                    */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-10 lg:py-14 px-6 bg-white" aria-labelledby="profession-types">
        <div className="max-w-5xl mx-auto">
          <h2 id="profession-types" className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-2" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>
            Des professionnels pour chaque besoin
          </h2>
          <p className="text-center text-gray-500 text-sm lg:text-base mb-8 max-w-lg mx-auto">
            Tous les métiers du neurodéveloppement, regroupés sur une seule plateforme.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {professionTypes.map((prof) => (
              <Link
                key={prof.label}
                href={`/search?profession=${encodeURIComponent(prof.value)}`}
                className="group p-4 sm:p-5 rounded-xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all"
                style={{ backgroundColor: prof.bg }}
              >
                <span className="text-2xl sm:text-3xl block mb-2">{prof.icon}</span>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 group-hover:underline">{prof.label}</h3>
                <p className="text-xs text-gray-500">{prof.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* POURQUOI NEUROCARE                         */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-12 lg:py-16 px-6" aria-labelledby="why-neurocare">
        <div className="max-w-5xl mx-auto">
          <h2 id="why-neurocare" className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-10" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>
            Pourquoi les familles nous font confiance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {[
              {
                title: 'Moins d\'errance',
                desc: 'Fini les recherches sans fin. Tous les professionnels TND sont ici, avec leurs spécialisations clairement affichées.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                ),
              },
              {
                title: 'Des pros vérifiés',
                desc: 'Chaque professionnel est vérifié : diplômes, certifications, expérience. Vous savez à qui vous confiez votre enfant.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                ),
              },
              {
                title: 'Un accompagnement humain',
                desc: 'Nous ne sommes pas un simple annuaire. Notre équipe est disponible pour vous orienter si vous ne savez pas par où commencer.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                ),
              },
              {
                title: 'Gratuit, sans engagement',
                desc: 'La recherche et la mise en relation sont entièrement gratuites pour les familles. Toujours.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-xl bg-white shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#e6f5f5', color: '#027e7e' }}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* TÉMOIGNAGES                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-10 lg:py-14 px-6 bg-white" aria-labelledby="testimonials">
        <div className="max-w-5xl mx-auto">
          <h2 id="testimonials" className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-2" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>
            Ce que pensent nos utilisateurs
          </h2>
          <p className="text-center text-gray-500 text-sm lg:text-base mb-6 max-w-md mx-auto">
            Partagez votre expérience et aidez d'autres familles.
          </p>

          {/* Bouton laisser un avis */}
          <div className="text-center mb-8">
            {user ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: '#027e7e' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {showReviewForm ? 'Annuler' : 'Laisser un avis'}
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: '#027e7e' }}
              >
                Connectez-vous pour laisser un avis
              </Link>
            )}
          </div>

          {/* Formulaire */}
          {showReviewForm && user && (
            <form onSubmit={submitReview} className="max-w-lg mx-auto mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Votre prénom ou pseudo</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={reviewForm.authorName}
                  onChange={(e) => setReviewForm({ ...reviewForm, authorName: e.target.value })}
                  placeholder="Ex: Marie"
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                      className="text-2xl transition-transform hover:scale-110"
                    >
                      {n <= reviewForm.rating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Votre avis</label>
                <textarea
                  required
                  maxLength={1000}
                  rows={3}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Partagez votre expérience avec NeuroCare..."
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
              </div>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#027e7e' }}
              >
                {reviewSubmitting ? 'Envoi...' : 'Envoyer mon avis'}
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">Votre avis sera publié après validation par notre équipe.</p>
            </form>
          )}

          {/* Message de confirmation */}
          {reviewMessage && (
            <div className="max-w-lg mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-sm text-green-800">{reviewMessage}</p>
            </div>
          )}

          {/* Avis publiés */}
          {platformReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {platformReviews.map((review) => (
                <div key={review.id} className="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#027e7e' }}>
                        {review.author_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.author_name}</p>
                        <p className="text-xs text-gray-500">{review.author_role === 'educator' ? 'Professionnel' : 'Famille'}</p>
                      </div>
                    </div>
                    <div className="text-sm" style={{ color: '#f0879f' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{review.comment}"</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">Soyez le premier à laisser un avis !</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ENGAGEMENTS & SÉCURITÉ                     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-10 lg:py-14 px-6" aria-labelledby="security">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#e6f5f5' }}>
            <svg className="w-7 h-7" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 id="security" className="text-xl sm:text-2xl font-bold mb-3" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>
            Vos données sont en sécurité
          </h2>
          <p className="text-sm lg:text-base text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
            Vos informations personnelles ne sont jamais partagées avec des tiers. NeuroCare ne monétise pas vos données.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {[
              { label: 'Conforme RGPD', icon: '🇪🇺' },
              { label: 'Hébergé en France', icon: '🇫🇷' },
              { label: 'Échanges chiffrés', icon: '🔒' },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-100">
                <span className="text-lg">{badge.icon}</span>
                <span className="text-sm font-medium text-gray-700">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* AIDE FINANCIÈRE                            */}
      {/* ═══════════════════════════════════════════ */}
      <section className="px-4 lg:px-8 py-6 lg:py-10" aria-labelledby="aide-financiere">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-6 lg:p-10 text-white lg:flex lg:items-center lg:justify-between lg:gap-10" style={{ backgroundColor: '#027e7e' }}>
            <div className="text-center lg:text-left lg:flex-1">
              <h2 id="aide-financiere" className="text-lg lg:text-2xl font-bold mb-2">
                Des aides existent pour financer l'accompagnement
              </h2>
              <p className="text-teal-50 text-sm lg:text-base mb-5 lg:mb-0 leading-relaxed lg:max-w-xl">
                AEEH, PCH, CESU... Découvrez les aides auxquelles vous avez droit en 2 minutes.
              </p>
            </div>
            <div className="text-center lg:flex-shrink-0">
              <Link
                href="/familles/aides-financieres"
                className="inline-block bg-[#E8747C] hover:bg-[#d65f67] text-white font-semibold text-sm px-6 lg:px-8 py-3 lg:py-3.5 rounded-full transition-colors lg:text-base"
              >
                Simuler mes aides
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* COMMUNAUTÉ                                 */}
      {/* ═══════════════════════════════════════════ */}
      <CommunityPreview />

      {/* ═══════════════════════════════════════════ */}
      {/* FAQ                                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-10 lg:py-14 px-6 bg-white" aria-labelledby="faq">
        <div className="max-w-3xl mx-auto">
          <h2 id="faq" className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-8" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>
            Questions fréquentes
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={openFaq === index}
                >
                  <span className="font-semibold text-gray-900 text-sm lg:text-base pr-4">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA FINAL                                  */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-12 lg:py-16 px-6" aria-labelledby="final-cta">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="final-cta" className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>
            Prêt à trouver le bon professionnel ?
          </h2>
          <p className="text-gray-600 text-sm lg:text-base mb-8 max-w-md mx-auto">
            Rejoignez les familles qui ont déjà trouvé un accompagnement adapté pour leur enfant.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl transition-all hover:opacity-90 hover:shadow-lg text-sm lg:text-base"
              style={{ backgroundColor: '#027e7e' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Rechercher un professionnel
            </Link>
            <Link
              href="/familles/aides-financieres"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold rounded-xl border-2 transition-all hover:shadow-lg text-sm lg:text-base"
              style={{ borderColor: '#027e7e', color: '#027e7e' }}
            >
              Comprendre les aides financières
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER                                     */}
      {/* ═══════════════════════════════════════════ */}
      <footer className="text-white py-8 lg:py-12 px-6 lg:px-8" style={{ backgroundColor: '#027e7e' }} role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 mb-8 lg:mb-10">
            <div className="lg:pr-6">
              <Link href="/" className="inline-block mb-3 lg:mb-4" aria-label="Retour à l'accueil NeuroCare">
                <img src="/images/logo-neurocare.svg" alt="Logo NeuroCare" className="h-16 lg:h-20 brightness-0 invert" />
              </Link>
              <p className="text-xs lg:text-sm leading-relaxed text-teal-100 mb-4">
                La plateforme qui connecte les familles avec des professionnels du neurodéveloppement vérifiés et qualifiés.
              </p>
              <SocialLinks variant="light" />
            </div>

            <nav aria-labelledby="footer-nav-1">
              <h3 id="footer-nav-1" className="font-bold text-white mb-3 lg:mb-4 text-sm lg:text-base">Navigation</h3>
              <ul className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm text-teal-100">
                <li><Link href="/search" className="hover:text-white transition-colors">Trouver un professionnel</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </nav>

            <nav aria-labelledby="footer-nav-2">
              <h3 id="footer-nav-2" className="font-bold text-white mb-3 lg:mb-4 text-sm lg:text-base">Familles</h3>
              <ul className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm text-teal-100">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Créer un compte</Link></li>
                <li><Link href="/familles/aides-financieres" className="hover:text-white transition-colors">Aides financières</Link></li>
                <li><Link href="/ressources/lieux-adaptes" className="hover:text-white transition-colors">Lieux de prise en charge TND</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Forum</Link></li>
              </ul>
            </nav>

            <nav aria-labelledby="footer-nav-3">
              <h3 id="footer-nav-3" className="font-bold text-white mb-3 lg:mb-4 text-sm lg:text-base">Professionnels</h3>
              <ul className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm text-teal-100">
                <li><Link href="/pro" className="hover:text-white transition-colors">Espace Pro</Link></li>
                <li><Link href="/pro/devenir-liberal" className="hover:text-white transition-colors">Devenir libéral</Link></li>
                <li><Link href="/auth/register-educator" className="hover:text-white transition-colors">Rejoindre NeuroCare</Link></li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-teal-500 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-4 text-sm text-teal-100">
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                  <Link href="/privacy" className="hover:text-white transition-colors">Politique de confidentialité</Link>
                  <Link href="/terms" className="hover:text-white transition-colors">CGU</Link>
                  <button
                    type="button"
                    onClick={openCookiePreferences}
                    className="hover:text-white transition-colors underline-offset-2 hover:underline"
                  >
                    Gérer mes cookies
                  </button>
                </div>
              </nav>
              <p className="text-sm text-teal-200">
                © {new Date().getFullYear()} NeuroCare. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
