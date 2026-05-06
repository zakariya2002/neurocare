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

type SuggestionType = 'profession' | 'city' | 'tnd';

interface SearchSuggestion {
  type: SuggestionType;
  label: string;
  value: string;
  icon: string;
}

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
  { q: 'NeuroCare est-il gratuit ?', a: 'Oui, la recherche et la mise en relation sont 100% gratuites pour les familles. Aucun frais caché, aucun engagement.' },
  { q: 'Comment les professionnels sont-ils vérifiés ?', a: 'Nous vérifions les diplômes, certifications et numéro RPPS/ADELI de chaque professionnel avant la mise en ligne de son profil.' },
  { q: "Mon enfant n'a pas encore de diagnostic, puis-je utiliser NeuroCare ?", a: 'Bien sûr. Vous pouvez rechercher des professionnels par type de trouble ou par besoin, même sans diagnostic formel.' },
  { q: 'Quels types de professionnels sont disponibles ?', a: 'Éducateurs spécialisés, psychologues, orthophonistes, psychomotriciens, ergothérapeutes, neuropsychologues et plus encore.' },
  { q: 'Mes données sont-elles protégées ?', a: 'Oui. Vos données sont hébergées en France, protégées par chiffrement et conformes au RGPD. Nous ne les partageons jamais.' },
  { q: 'Comment contacter un professionnel ?', a: 'Une fois le profil trouvé, vous pouvez envoyer un message directement via la plateforme. Le professionnel vous répondra dans les meilleurs délais.' },
];

const professionTypes = [
  { label: 'Éducateurs spécialisés', value: 'educator', desc: 'Autisme, TDAH, habiletés sociales', color: '#027e7e', bg: '#f0fafa',
    iconPath: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5' },
  { label: 'Psychologues', value: 'psychologist', desc: 'Bilans, thérapies, guidance parentale', color: '#6b21a8', bg: '#faf5ff',
    iconPath: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
  { label: 'Orthophonistes', value: 'speech_therapist', desc: 'Langage, communication, troubles DYS', color: '#0369a1', bg: '#f0f9ff',
    iconPath: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' },
  { label: 'Psychomotriciens', value: 'psychomotricist', desc: 'Motricité, régulation sensorielle', color: '#b45309', bg: '#fffbeb',
    iconPath: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z' },
  { label: 'Ergothérapeutes', value: 'occupational_therapist', desc: 'Autonomie, adaptation du quotidien', color: '#059669', bg: '#f0fdf4',
    iconPath: 'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z' },
  { label: 'Neuropsychologues', value: 'neuropsychologist', desc: 'Bilans neuropsychologiques, TDAH', color: '#dc2626', bg: '#fef2f2',
    iconPath: 'M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z' },
];

const testimonials = [
  { text: "Après 8 mois de recherche, j'ai trouvé un éducateur spécialisé en autisme à 15 minutes de chez nous. Mon fils a enfin un suivi adapté.", author: 'Marie', detail: 'Maman de Lucas, 6 ans (TSA)', initials: 'M', color: '#027e7e' },
  { text: "On ne savait même pas quel type de professionnel chercher. NeuroCare nous a aidés à y voir clair et à trouver la bonne personne.", author: 'Karim et Sophie', detail: 'Parents de Léa, 4 ans (TDAH)', initials: 'K', color: '#6b21a8' },
  { text: "Le profil détaillé m'a rassurée : je pouvais voir les diplômes, les méthodes utilisées. J'ai pu choisir en confiance.", author: 'Isabelle', detail: "Maman d'Emma, 9 ans (DYS)", initials: 'I', color: '#E8747C' },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'educator' | 'family' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [platformReviews, setPlatformReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', authorName: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    fetchPlatformReviews();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) { setUser(null); setUserType(null); }
      else if (session?.user) { setUser(session.user); checkUserType(session.user.id); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    if (mobileMenuOpen) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const checkUserType = async (userId: string) => {
    const { data: educator } = await supabase.from('educator_profiles').select('id').eq('user_id', userId).single();
    setUserType(educator ? 'educator' : 'family');
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
      const res = await fetch('/api/platform-reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewForm) });
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
    if (session?.user) { setUser(session.user); checkUserType(session.user.id); }
    else { setUser(null); setUserType(null); }
  };

  const getDashboardLink = () => {
    if (userType === 'educator') return '/dashboard/educator';
    if (userType === 'family') return '/dashboard/family';
    return '/auth/login';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchSuggestions = async (query: string) => {
    if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setIsSearching(true);
    const queryLower = query.toLowerCase();
    const results: SearchSuggestion[] = [];
    professions.forEach(prof => {
      if (prof.label.toLowerCase().includes(queryLower)) results.push({ type: 'profession', label: prof.label, value: prof.value, icon: '' });
    });
    tndList.forEach(tnd => {
      if (tnd.label.toLowerCase().includes(queryLower)) results.push({ type: 'tnd', label: tnd.label, value: tnd.value, icon: '' });
    });
    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&type=municipality`);
      const data = await response.json();
      if (data.features?.length > 0) {
        data.features.forEach((feature: any) => results.push({ type: 'city', label: feature.properties.label, value: feature.properties.label, icon: '' }));
      }
    } catch (error) { console.error('Erreur recherche ville:', error); }
    setSuggestions(results.slice(0, 8));
    setShowSuggestions(results.length > 0);
    setIsSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery) searchSuggestions(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setSearchQuery('');
    switch (suggestion.type) {
      case 'profession': router.push(`/search?profession=${encodeURIComponent(suggestion.value)}`); break;
      case 'city': router.push(`/search?location=${encodeURIComponent(suggestion.value)}`); break;
      case 'tnd': router.push(`/search?specialization=${encodeURIComponent(suggestion.label)}`); break;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <BetaModal variant="family" />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#027e7e' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Mobile */}
          <div className="flex lg:hidden items-center justify-between h-14">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="relative p-1.5 text-white z-[60]" aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileMenuOpen}>
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

          {/* Desktop */}
          <div className="hidden lg:flex items-center h-14 xl:h-16">
            <nav className="flex-1 flex items-center justify-end gap-0.5 xl:gap-1" aria-label="Navigation principale gauche">
              <Link href="/search" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Rechercher
              </Link>
              <Link href="/about" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                À propos
              </Link>
              <Link href="/contact" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Contact
              </Link>
              {!user && (
                <Link href="/blog" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                  <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  Blog
                </Link>
              )}
            </nav>

            <Link href="/" className="flex-shrink-0 mx-6 xl:mx-10" aria-label="Retour à l'accueil NeuroCare">
              <img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-12 xl:h-14" />
            </Link>

            <nav className="flex-1 flex items-center justify-start gap-0.5 xl:gap-1" aria-label="Navigation principale droite">
              {user && (
                <Link href="/blog" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                  <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  Blog
                </Link>
              )}
              <Link href="/community" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Forum
              </Link>
              <Link href="/ressources/lieux-adaptes" className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs xl:text-sm text-white/90 hover:text-white hover:bg-white/15 rounded-md font-medium transition-all whitespace-nowrap">
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Lieux TND
              </Link>
              {user ? (
                <Link href={getDashboardLink()} className="group ml-1 xl:ml-2 flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3.5 py-1.5 xl:py-2 text-xs xl:text-sm text-white font-semibold rounded-md transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: '#f0879f' }}>
                  <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  Mon compte
                </Link>
              ) : (
                <>
                  <Link href="/pro" className="group ml-1 flex items-center gap-0.5 px-2 xl:px-2.5 py-1 xl:py-1.5 text-[10px] xl:text-xs rounded font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}>
                    <svg className="w-3 h-3 xl:w-3.5 xl:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Espace Pro
                  </Link>
                  <Link href="/auth/login" className="ml-3 xl:ml-4 px-4 py-2 text-xs xl:text-sm font-medium rounded-lg transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: '#fdf9f4', color: '#027e7e' }}>
                    Connexion
                  </Link>
                  <Link href="/auth/signup" onClick={() => trackMetaEvent('InitiateCheckout', { source: 'header_desktop' })} className="ml-2 xl:ml-3 px-5 xl:px-6 py-2 text-xs xl:text-sm text-white font-semibold rounded-lg transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: '#f0879f' }}>
                    Inscription
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Mobile overlay */}
        <div className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[55] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />

        {/* Mobile sidebar */}
        <div className={`lg:hidden fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-white z-[56] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 flex-shrink-0">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}><img src="/images/logo-neurocare.svg" alt="NeuroCare" className="h-10" /></Link>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-gray-600" aria-label="Fermer le menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-4">
            {[
              { href: '/search', label: 'Rechercher un professionnel', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { href: '/about', label: 'À propos', d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { href: '/familles/aides-financieres', label: 'Aides financières', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { href: '/contact', label: 'Contact', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { href: '/blog', label: 'Blog', d: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
              { href: '/community', label: 'Forum', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { href: '/ressources/lieux-adaptes', label: 'Lieux TND', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
            ].map(({ href, label, d }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-2 py-3 text-[15px] text-gray-800 font-medium border-b border-gray-50 hover:text-[#027e7e] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} /></svg>
                {label}
              </Link>
            ))}
            <div className="mt-3">
              <Link href="/pro" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }} onClick={() => setMobileMenuOpen(false)}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Espace professionnel
              </Link>
            </div>
          </nav>
          <div className="flex-shrink-0 px-6 pb-8 pt-4 border-t border-gray-100 space-y-2.5">
            {user ? (
              <Link href={getDashboardLink()} className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white w-full" style={{ backgroundColor: '#027e7e' }} onClick={() => setMobileMenuOpen(false)}>Mon compte</Link>
            ) : (
              <>
                <Link href="/auth/login" className="flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold w-full border-2" style={{ borderColor: '#027e7e', color: '#027e7e' }} onClick={() => setMobileMenuOpen(false)}>Se connecter</Link>
                <Link href="/auth/signup" className="flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold text-white w-full" style={{ backgroundColor: '#027e7e' }} onClick={() => { trackMetaEvent('InitiateCheckout', { source: 'header_mobile' }); setMobileMenuOpen(false); }}>S&apos;inscrire</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="mt-14 xl:mt-16" style={{ background: 'linear-gradient(160deg, #f0fafa 0%, #ffffff 60%)' }}>
        <div className="max-w-3xl mx-auto px-6 pt-14 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-medium border" style={{ backgroundColor: '#f0fafa', borderColor: '#02787820', color: '#027e7e' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#027e7e' }} />
            Spécialisé neurodéveloppement · 100&nbsp;% gratuit pour les familles
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Trouvez le professionnel adapté<br className="hidden sm:block" />
            <span style={{ color: '#027e7e' }}> pour accompagner votre enfant</span>
          </h1>
          <p className="text-gray-500 text-base lg:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Autisme, TDAH, troubles DYS — des professionnels vérifiés et qualifiés, près de chez vous.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} role="search" aria-label="Recherche de professionnels">
              <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-100 overflow-hidden">
                <div className="pl-5 pr-2 flex-shrink-0 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="Éducateur, orthophoniste, ville, trouble..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="flex-1 px-2 py-3.5 lg:py-4 text-sm lg:text-base text-gray-700 outline-none bg-transparent"
                  aria-label="Rechercher un professionnel"
                  aria-autocomplete="list"
                  aria-controls={showSuggestions ? 'search-suggestions' : undefined}
                  aria-expanded={showSuggestions}
                />
                <button type="submit" className="m-1.5 px-6 py-2.5 text-white text-sm font-semibold rounded-full transition-all hover:opacity-90 flex-shrink-0" style={{ backgroundColor: '#027e7e' }} aria-label="Lancer la recherche">
                  {isSearching ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" role="status" aria-label="Recherche en cours" /> : 'Rechercher'}
                </button>
              </div>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div id="search-suggestions" className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50" role="listbox">
                <div className="max-h-72 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button key={`${suggestion.type}-${index}`} onClick={() => handleSelectSuggestion(suggestion)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0fafa] transition-colors text-left border-b border-gray-50 last:border-b-0" role="option">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0fafa', color: '#027e7e' }}>
                        {suggestion.type === 'profession' && <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
                        {suggestion.type === 'city' && <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>}
                        {suggestion.type === 'tnd' && <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium text-sm truncate">{suggestion.label}</p>
                        <p className="text-xs text-gray-400">{suggestion.type === 'profession' ? 'Profession' : suggestion.type === 'city' ? 'Ville' : 'Spécialisation'}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Popular tags */}
          <div className="mt-5 flex flex-wrap justify-center items-center gap-2">
            <span className="text-xs text-gray-400">Recherches populaires&nbsp;:</span>
            {['Orthophoniste', 'Éducateur spécialisé', 'Autisme', 'TDAH', 'Psychologue'].map((tag) => (
              <button key={tag} onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)} className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600 bg-white transition-all hover:border-[#027e7e] hover:text-[#027e7e]">
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-2xl mx-auto px-6 py-5 grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
            {[
              { value: '500+', label: 'Professionnels vérifiés' },
              { value: '8', label: 'Spécialités TND couvertes' },
              { value: '100%', label: 'Gratuit pour les familles' },
            ].map(({ value, label }) => (
              <div key={label} className="px-2">
                <div className="text-xl sm:text-2xl font-bold" style={{ color: '#027e7e' }}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-snug">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPÉCIALITÉS ────────────────────────────────────────────────────── */}
      <section className="py-14 lg:py-20 px-6 bg-white" aria-labelledby="profession-types">
        <div className="max-w-5xl mx-auto">
          <h2 id="profession-types" className="text-2xl lg:text-3xl font-bold text-center mb-2 text-gray-900">
            Des professionnels pour chaque besoin
          </h2>
          <p className="text-center text-gray-400 text-sm lg:text-base mb-10 max-w-md mx-auto">
            Tous les métiers du neurodéveloppement, regroupés sur une seule plateforme.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {professionTypes.map((prof) => (
              <Link key={prof.label} href={`/search?profession=${encodeURIComponent(prof.value)}`} className="group p-5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: prof.bg, color: prof.color }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={prof.iconPath} />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{prof.label}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{prof.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: prof.color }}>
                  Voir les professionnels
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ──────────────────────────────────────────────── */}
      <section className="py-14 lg:py-20 px-6" style={{ backgroundColor: '#f8fafc' }} aria-labelledby="how-it-works">
        <div className="max-w-4xl mx-auto">
          <h2 id="how-it-works" className="text-2xl lg:text-3xl font-bold text-center mb-2 text-gray-900">
            Trouver un professionnel en 3 étapes
          </h2>
          <p className="text-center text-gray-400 text-sm lg:text-base mb-12">
            Simple, rapide, pensé pour les parents.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px border-t-2 border-dashed border-gray-200" />
            {[
              { n: '1', title: 'Recherchez', desc: 'Indiquez le type de professionnel, le trouble de votre enfant ou votre ville.', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
              { n: '2', title: 'Comparez', desc: 'Consultez les profils détaillés : diplômes, spécialisations, méthodes, disponibilités.', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
              { n: '3', title: 'Contactez', desc: 'Échangez directement avec le professionnel qui correspond à vos besoins.', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
            ].map(({ n, title, desc, d }) => (
              <div key={n} className="relative text-center flex flex-col items-center">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f0fafa' }}>
                    <svg className="w-7 h-7" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                    </svg>
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ backgroundColor: '#027e7e' }}>{n}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/search" className="inline-flex items-center gap-2 px-7 py-3 text-white font-semibold rounded-full text-sm transition-all hover:opacity-90" style={{ backgroundColor: '#027e7e' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Commencer ma recherche
            </Link>
          </div>
        </div>
      </section>

      {/* ── POURQUOI NEUROCARE ─────────────────────────────────────────────── */}
      <section className="py-14 lg:py-20 px-6 bg-white" aria-labelledby="why-neurocare">
        <div className="max-w-5xl mx-auto">
          <h2 id="why-neurocare" className="text-2xl lg:text-3xl font-bold text-center mb-2 text-gray-900">
            Pourquoi les familles nous font confiance
          </h2>
          <p className="text-center text-gray-400 text-sm lg:text-base mb-10">
            Une plateforme conçue avec les familles, pour les familles.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: "Moins d'errance diagnostique", desc: "Fini les recherches sans fin. Tous les professionnels TND sont ici, avec leurs spécialisations clairement affichées.", d: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
              { title: 'Professionnels vérifiés', desc: 'Chaque professionnel est vérifié : diplômes, numéro RPPS/ADELI, expérience. Vous savez à qui vous confiez votre enfant.', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { title: 'Un accompagnement humain', desc: "Nous ne sommes pas un simple annuaire. Notre équipe est disponible pour vous orienter si vous ne savez pas par où commencer.", d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { title: 'Gratuit, sans engagement', desc: 'La recherche et la mise en relation sont entièrement gratuites pour les familles. Aucune carte bancaire requise.', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map(({ title, desc, d }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#f0fafa', color: '#027e7e' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ────────────────────────────────────────────────────── */}
      <section className="py-14 lg:py-20 px-6" style={{ backgroundColor: '#f8fafc' }} aria-labelledby="testimonials">
        <div className="max-w-5xl mx-auto">
          <h2 id="testimonials" className="text-2xl lg:text-3xl font-bold text-center mb-2 text-gray-900">
            Ce que disent les familles
          </h2>
          <p className="text-center text-gray-400 text-sm lg:text-base mb-10">
            Des témoignages de parents qui ont trouvé le bon professionnel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(platformReviews.length > 0
              ? platformReviews.slice(0, 3).map((r) => ({ text: r.comment, author: r.author_name, detail: r.author_role === 'educator' ? 'Professionnel' : 'Famille', initials: r.author_name?.[0]?.toUpperCase() ?? '?', color: '#027e7e' }))
              : testimonials
            ).map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className="w-4 h-4" style={{ color: '#027e7e' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">&ldquo;{item.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: item.color }}>{item.initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.author}</p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {user && (
            <div className="text-center mt-8">
              <button onClick={() => setShowReviewForm(!showReviewForm)} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-sm font-medium transition-all hover:shadow-sm" style={{ borderColor: '#027e7e', color: '#027e7e' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                {showReviewForm ? 'Annuler' : 'Laisser un avis'}
              </button>
            </div>
          )}

          {showReviewForm && user && (
            <form onSubmit={submitReview} className="max-w-lg mx-auto mt-6 p-6 bg-white rounded-2xl border border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Votre prénom ou pseudo</label>
                <input type="text" required maxLength={100} value={reviewForm.authorName} onChange={(e) => setReviewForm({ ...reviewForm, authorName: e.target.value })} placeholder="Ex : Marie" className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-[#027e7e]" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })} className="text-2xl transition-transform hover:scale-110" style={{ color: n <= reviewForm.rating ? '#027e7e' : '#d1d5db' }}>★</button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Votre avis</label>
                <textarea required maxLength={1000} rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Partagez votre expérience..." className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-[#027e7e] resize-none" />
              </div>
              <button type="submit" disabled={reviewSubmitting} className="w-full py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 text-sm" style={{ backgroundColor: '#027e7e' }}>
                {reviewSubmitting ? 'Envoi…' : 'Envoyer mon avis'}
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">Votre avis sera publié après validation.</p>
            </form>
          )}
          {reviewMessage && (
            <div className="max-w-lg mx-auto mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-sm text-green-800">{reviewMessage}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── SÉCURITÉ ───────────────────────────────────────────────────────── */}
      <section className="py-8 px-6 bg-white border-t border-b border-gray-100">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-12">
          {[
            { label: 'Conforme RGPD', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { label: 'Hébergé en France', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
            { label: 'Échanges chiffrés', d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
          ].map(({ label, d }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0fafa', color: '#027e7e' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── AIDE FINANCIÈRE ────────────────────────────────────────────────── */}
      <section className="px-4 lg:px-8 py-8 lg:py-12" aria-labelledby="aide-financiere">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-6 lg:p-10 text-white lg:flex lg:items-center lg:justify-between lg:gap-10" style={{ backgroundColor: '#027e7e' }}>
            <div className="text-center lg:text-left lg:flex-1">
              <h2 id="aide-financiere" className="text-lg lg:text-2xl font-bold mb-2">Des aides existent pour financer l&apos;accompagnement</h2>
              <p className="text-teal-50 text-sm lg:text-base mb-5 lg:mb-0 leading-relaxed lg:max-w-xl">
                AEEH, PCH, CESU… Découvrez les aides auxquelles vous avez droit en 2 minutes.
              </p>
            </div>
            <div className="text-center lg:flex-shrink-0">
              <Link href="/familles/aides-financieres" className="inline-block font-semibold text-sm px-6 lg:px-8 py-3 lg:py-3.5 rounded-full transition-colors lg:text-base" style={{ backgroundColor: '#f0879f' }}>
                Simuler mes aides
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNAUTÉ ─────────────────────────────────────────────────────── */}
      <CommunityPreview />

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-14 lg:py-20 px-6 bg-white" aria-labelledby="faq">
        <div className="max-w-3xl mx-auto">
          <h2 id="faq" className="text-2xl lg:text-3xl font-bold text-center mb-2 text-gray-900">Questions fréquentes</h2>
          <p className="text-center text-gray-400 text-sm mb-10">Tout ce que vous devez savoir avant de commencer.</p>
          <div className="space-y-2">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full flex items-center justify-between px-5 py-4 text-left" aria-expanded={openFaq === index}>
                  <span className="font-medium text-gray-900 text-sm lg:text-base pr-4">{item.q}</span>
                  <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4 border-t border-gray-50">
                    <p className="text-sm text-gray-500 leading-relaxed pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
      <section className="py-14 lg:py-20 px-6" style={{ backgroundColor: '#f8fafc' }} aria-labelledby="final-cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 id="final-cta" className="text-2xl lg:text-3xl font-bold mb-3 text-gray-900">Prêt à trouver le bon professionnel&nbsp;?</h2>
          <p className="text-gray-400 text-sm lg:text-base mb-8 max-w-md mx-auto">
            Rejoignez les familles qui ont déjà trouvé un accompagnement adapté pour leur enfant.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/search" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white font-semibold rounded-full transition-all hover:opacity-90 text-sm" style={{ backgroundColor: '#027e7e' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Rechercher un professionnel
            </Link>
            <Link href="/familles/aides-financieres" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 font-semibold rounded-full border-2 transition-all text-sm" style={{ borderColor: '#027e7e', color: '#027e7e' }}>
              Comprendre les aides financières
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
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
                  <button type="button" onClick={openCookiePreferences} className="hover:text-white transition-colors underline-offset-2 hover:underline">Gérer mes cookies</button>
                </div>
              </nav>
              <p className="text-sm text-teal-200">© {new Date().getFullYear()} NeuroCare. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
