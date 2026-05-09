'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import PublicNavbar from '@/components/PublicNavbar';

const StructuresMap = dynamic(() => import('./StructuresMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-xl bg-gray-100 flex items-center justify-center" style={{ height: 420 }}>
      <p className="text-gray-400 text-sm">Chargement de la carte...</p>
    </div>
  ),
});

interface Structure {
  id: string;
  finess: string;
  nom: string;
  type: string;
  type_code: string;
  adresse: string;
  code_postal: string;
  ville: string;
  departement: string;
  region: string;
  telephone: string | null;
  lat: number | null;
  lng: number | null;
  source: string;
}

// ─── Couleurs pastels par type ───
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string; lightBg: string }> = {
  CMP:         { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', lightBg: '#eff6ff' },
  CAMSP:       { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0', lightBg: '#ecfdf5' },
  SESSAD:      { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe', lightBg: '#f5f3ff' },
  CMPP:        { bg: '#fef3c7', text: '#92400e', border: '#fde68a', lightBg: '#fffbeb' },
  CRA:         { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8', lightBg: '#fdf2f8' },
  Handiconsult:{ bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', lightBg: '#f0f9ff' },
  PCO:         { bg: '#fef9c3', text: '#854d0e', border: '#fef08a', lightBg: '#fefce8' },
  Handident:   { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3', lightBg: '#fff1f2' },
};

const TYPE_DESCRIPTIONS: Record<string, { short: string; detail: string; public: string }> = {
  CMP: {
    short: 'Centre M\u00e9dico-Psychologique',
    detail: 'Les CMP proposent des consultations gratuites en psychiatrie, psychologie, orthophonie et psychomotricit\u00e9. Pour les personnes avec un TND (autisme, TDAH, DYS), c\u2019est souvent le premier lieu de diagnostic et de suivi r\u00e9gulier. Les soins sont pris en charge \u00e0 100\u00a0% par l\u2019Assurance Maladie.',
    public: 'Enfants, adolescents et adultes',
  },
  CAMSP: {
    short: 'Centre d\u2019Action M\u00e9dico-Sociale Pr\u00e9coce',
    detail: 'Les CAMSP sont d\u00e9di\u00e9s au d\u00e9pistage et \u00e0 la prise en charge pr\u00e9coce des enfants de 0 \u00e0 6 ans. Ils interviennent d\u00e8s les premiers signes de retard de d\u00e9veloppement ou de TND, avec une \u00e9quipe pluridisciplinaire (p\u00e9diatre, psychologue, orthophoniste, psychomotricien). Gratuit et sans avance de frais.',
    public: 'Enfants de 0 \u00e0 6 ans',
  },
  SESSAD: {
    short: 'Service d\u2019\u00c9ducation Sp\u00e9ciale et de Soins \u00e0 Domicile',
    detail: 'Les SESSAD accompagnent les enfants et adolescents en situation de handicap dans leur milieu de vie (domicile, \u00e9cole). Pour les TND, ils proposent un soutien \u00e9ducatif, r\u00e9\u00e9ducatif et th\u00e9rapeutique adapt\u00e9 pour favoriser l\u2019inclusion scolaire et l\u2019autonomie. Orientation via la MDPH.',
    public: 'Enfants et adolescents (0-20 ans)',
  },
  CMPP: {
    short: 'Centre M\u00e9dico-Psycho-P\u00e9dagogique',
    detail: 'Les CMPP r\u00e9alisent des bilans diagnostiques et proposent des soins ambulatoires pour les troubles du d\u00e9veloppement, les difficult\u00e9s d\u2019apprentissage et les troubles du comportement. Ils sont particuli\u00e8rement adapt\u00e9s pour le TDAH, les troubles DYS et l\u2019autisme l\u00e9ger. Prise en charge par l\u2019Assurance Maladie.',
    public: 'Enfants et adolescents (0-20 ans)',
  },
  CRA: {
    short: 'Centre Ressources Autisme',
    detail: 'Les CRA sont les r\u00e9f\u00e9rents r\u00e9gionaux pour l\u2019autisme et les TND. Ils r\u00e9alisent des diagnostics complexes, informent les familles, forment les professionnels et orientent vers les structures adapt\u00e9es. Chaque r\u00e9gion dispose d\u2019au moins un CRA. C\u2019est le point d\u2019entr\u00e9e recommand\u00e9 si vous ne savez pas vers qui vous tourner.',
    public: 'Tous \u00e2ges \u2014 familles et professionnels',
  },
  Handiconsult: {
    short: 'Consultation d\u00e9di\u00e9e handicap en h\u00f4pital',
    detail: 'Les dispositifs Handiconsult sont des consultations hospitali\u00e8res adapt\u00e9es pour les personnes en situation de handicap. Elles offrent des soins m\u00e9dicaux (m\u00e9decine g\u00e9n\u00e9rale, gyn\u00e9cologie, ophtalmologie, dentaire\u2026) avec du personnel form\u00e9, du mat\u00e9riel adapt\u00e9 et des cr\u00e9neaux plus longs. Particuli\u00e8rement utile pour les personnes autistes ayant des difficult\u00e9s avec les consultations classiques.',
    public: 'Tous \u00e2ges \u2014 personnes en situation de handicap',
  },
  PCO: {
    short: 'Plateforme de Coordination et d\u2019Orientation TND',
    detail: 'Les PCO sont le guichet unique pour le rep\u00e9rage et l\u2019orientation des enfants avec suspicion de TND. Elles coordonnent le parcours de diagnostic en finançant les bilans (psychologue, orthophoniste, psychomotricien) sans attendre la reconnaissance MDPH. Pr\u00e9sentes dans chaque d\u00e9partement, elles acc\u00e9l\u00e8rent consid\u00e9rablement l\u2019acc\u00e8s au diagnostic.',
    public: 'Enfants de 0 \u00e0 12 ans',
  },
  Handident: {
    short: 'R\u00e9seau de soins dentaires adapt\u00e9s',
    detail: 'Les r\u00e9seaux Handident regroupent des chirurgiens-dentistes form\u00e9s \u00e0 la prise en charge des personnes en situation de handicap. Ils proposent des soins dentaires adapt\u00e9s (s\u00e9dation MEOPA, environnement sensoriel am\u00e9nag\u00e9) pour les patients autistes ou avec TND qui ne peuvent pas \u00eatre soign\u00e9s en cabinet classique.',
    public: 'Tous \u00e2ges \u2014 personnes en situation de handicap',
  },
};

const REGIONS = [
  'Auvergne-Rh\u00f4ne-Alpes', 'Bourgogne-Franche-Comt\u00e9', 'Bretagne',
  'Centre-Val de Loire', 'Corse', 'Grand Est', 'Guadeloupe', 'Guyane',
  'Hauts-de-France', '\u00cele-de-France', 'La R\u00e9union', 'Martinique',
  'Mayotte', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
  'Pays de la Loire', 'Provence-Alpes-C\u00f4te d\u2019Azur',
];

const TYPES = ['CMP', 'CAMSP', 'SESSAD', 'CMPP', 'CRA', 'Handiconsult', 'PCO', 'Handident'];
const PAGE_SIZE = 30;

interface LieuxClientProps {
  structures: Structure[];
  /** If set, the page is a region sub-page */
  regionName?: string;
  regionSlug?: string;
}

export default function LieuxClient({ structures, regionName, regionSlug }: LieuxClientProps) {
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const isRegionPage = !!regionName;

  const filtered = useMemo(() => {
    let result = structures;
    if (region) result = result.filter(s => s.region === region);
    if (type) result = result.filter(s => s.type === type);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(s =>
        s.nom.toLowerCase().includes(q) ||
        s.ville.toLowerCase().includes(q) ||
        s.code_postal.startsWith(q)
      );
    }
    return result;
  }, [structures, region, type, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = useCallback(() => {
    setRegion(''); setType(''); setSearch(''); setPage(1);
  }, []);

  const mapsUrl = (s: Structure) => {
    const addr = encodeURIComponent(`${s.adresse} ${s.code_postal} ${s.ville}`);
    return `https://www.google.com/maps/search/?api=1&query=${addr}`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      {/* Hero */}
      <div style={{ paddingTop: 80 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-6">
          {/* Breadcrumb for region pages */}
          {isRegionPage && (
            <nav aria-label="Fil d&apos;Ariane" className="text-sm text-gray-400 mb-4">
              <Link href="/" className="hover:underline" style={{ color: '#027e7e' }}>
                Accueil
              </Link>
              <span className="mx-2">/</span>
              <Link
                href="/ressources/lieux-adaptes"
                className="hover:underline"
                style={{ color: '#027e7e' }}
              >
                Lieux adapt&eacute;s TND
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-600 font-medium">{regionName}</span>
            </nav>
          )}
          {/* Banner */}
          <div className="rounded-2xl overflow-hidden mb-8" style={{ backgroundColor: '#027e7e' }}>
            <div className="px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Annuaire national</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                  {isRegionPage
                    ? <>Structures TND en {regionName}</>
                    : <>Lieux de prise en charge adapt&eacute;s des Troubles du Neurod&eacute;veloppement</>
                  }
                </h1>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                  {isRegionPage
                    ? <>Trouvez les structures sp&eacute;cialis&eacute;es dans l&rsquo;accompagnement des troubles du neurod&eacute;veloppement en <strong className="text-white">{regionName}</strong>. <strong className="text-white">{structures.length.toLocaleString('fr-FR')}</strong> lieux r&eacute;f&eacute;renc&eacute;s.</>
                    : <>Trouvez les structures sp&eacute;cialis&eacute;es dans l&rsquo;accompagnement des troubles du neurod&eacute;veloppement pr&egrave;s de chez vous. <strong className="text-white">{structures.length.toLocaleString('fr-FR')}</strong> lieux r&eacute;f&eacute;renc&eacute;s en France.</>
                  }
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center gap-1 bg-white/15 rounded-xl px-6 py-4 backdrop-blur-sm flex-shrink-0">
                <span className="text-3xl font-extrabold text-white">{structures.length.toLocaleString('fr-FR')}</span>
                <span className="text-xs text-white/70 font-medium">structures</span>
                <span className="text-xs text-white/70 font-medium">r&eacute;f&eacute;renc&eacute;es</span>
              </div>
            </div>
          </div>

          {/* Badges type */}
          <div className="flex flex-wrap gap-2 mt-6">
            {TYPES.map(t => {
              const count = structures.filter(s => s.type === t).length;
              const colors = TYPE_COLORS[t];
              const active = type === t;
              return (
                <button
                  key={t}
                  onClick={() => { setType(active ? '' : t); setPage(1); }}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer border"
                  style={{
                    backgroundColor: active ? colors.text : colors.bg,
                    color: active ? '#ffffff' : colors.text,
                    borderColor: colors.border,
                  }}
                >
                  {t} &middot; {count}
                </button>
              );
            })}
          </div>

          {/* Description du type sélectionné */}
          {type && TYPE_DESCRIPTIONS[type] && (
            <div
              className="mt-4 p-4 rounded-xl border"
              style={{
                backgroundColor: TYPE_COLORS[type].lightBg,
                borderColor: TYPE_COLORS[type].border,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: TYPE_COLORS[type].bg, color: TYPE_COLORS[type].text, border: `1px solid ${TYPE_COLORS[type].border}` }}
                >
                  {type}
                </span>
                <h3 className="text-sm font-bold" style={{ color: TYPE_COLORS[type].text }}>
                  {TYPE_DESCRIPTIONS[type].short}
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                {TYPE_DESCRIPTIONS[type].detail}
              </p>
              <p className="text-xs font-medium text-gray-400">
                Public concern&eacute; : {TYPE_DESCRIPTIONS[type].public}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filtres sticky */}
      <div className="sticky top-14 z-30 border-t border-b border-gray-200" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center">
          {!isRegionPage && (
            <select
              value={region}
              onChange={e => { setRegion(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              <option value="">Toutes les r&eacute;gions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}

          <select
            value={type}
            onChange={e => { setType(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="">Tous les types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <CityAutocomplete
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
          />

          {(region || type || search) && (
            <button onClick={resetFilters} className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              R&eacute;initialiser
            </button>
          )}
        </div>
      </div>

      {/* Carte */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <StructuresMap structures={filtered} />
      </div>

      {/* CTA Conversion Block */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
              Ces structures ont des d&eacute;lais d&rsquo;attente&nbsp;?
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Trouvez un professionnel disponible maintenant sur NeuroCare
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-lg no-underline hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ backgroundColor: '#027e7e' }}
          >
            Rechercher un professionnel
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Résultats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <p className="text-sm text-gray-400 mb-5">
          {filtered.length} structure{filtered.length > 1 ? 's' : ''} trouv&eacute;e{filtered.length > 1 ? 's' : ''}
          {region && <> en <strong className="text-gray-600">{region}</strong></>}
          {type && <> &middot; <strong className="text-gray-600">{type}</strong></>}
        </p>

        {paginated.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">&#128269;</p>
            <p className="text-lg text-gray-400">Aucune structure trouv&eacute;e</p>
            <button onClick={resetFilters} className="mt-4 px-6 py-2.5 text-white text-sm font-semibold rounded-lg" style={{ backgroundColor: '#027e7e' }}>
              Voir toutes les structures
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map(s => {
              const colors = TYPE_COLORS[s.type] || TYPE_COLORS.CMP;
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="text-sm font-bold text-gray-800 leading-snug flex-1">{s.nom}</h3>
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                    >
                      {s.type}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 leading-relaxed">
                    {s.adresse && <p className="m-0">{s.adresse}</p>}
                    <p className="m-0 font-semibold text-gray-700">{s.code_postal} {s.ville}</p>
                  </div>

                  <div className="flex gap-2 mt-auto pt-1">
                    {s.telephone && (
                      <a href={`tel:${s.telephone.replace(/\s/g, '')}`} className="flex-1 text-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium border border-gray-100 hover:bg-gray-100 transition-colors no-underline">
                        &#128222; {s.telephone}
                      </a>
                    )}
                    <a
                      href={mapsUrl(s)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-white rounded-lg text-xs font-semibold no-underline hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#027e7e' }}
                    >
                      Itin&eacute;raire &rarr;
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 disabled:text-gray-300 disabled:cursor-default hover:bg-gray-50 transition-colors"
            >
              &larr; Pr&eacute;c&eacute;dent
            </button>
            <span className="text-sm text-gray-400 px-4">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 disabled:text-gray-300 disabled:cursor-default hover:bg-gray-50 transition-colors"
            >
              Suivant &rarr;
            </button>
          </div>
        )}

        {/* Légende */}
        <div className="mt-12 p-6 bg-white rounded-xl border border-gray-100">
          <h3 className="text-base font-bold mb-4" style={{ color: '#027e7e' }}>L&eacute;gende des structures</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TYPES.map(t => {
              const colors = TYPE_COLORS[t];
              return (
                <div key={t} className="flex gap-3 items-start">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                    {t}
                  </span>
                  <span className="text-xs text-gray-500 leading-relaxed">{TYPE_DESCRIPTIONS[t].short}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source */}
        <p className="text-center text-xs text-gray-400 mt-8 leading-relaxed">
          Donn&eacute;es issues du r&eacute;pertoire FINESS (data.gouv.fr) et du GNCRA. Derni&egrave;re mise &agrave; jour : mars 2026.
          <br />
          Une erreur ? Un lieu manquant ? <Link href="/contact" className="underline" style={{ color: '#027e7e' }}>Contactez-nous</Link>.
        </p>
      </div>
    </div>
  );
}

// ─── Composant autocomplétion ville ───
function CityAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<{ city: string; postcode: string; context: string }[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCities = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { setSuggestions([]); }
    }, 200);
  }, []);

  const handleInput = (val: string) => {
    setInput(val);
    onChange(val);
    fetchCities(val);
  };

  const handleSelect = (city: string, postcode: string) => {
    const val = `${city}`;
    setInput(val);
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-1 min-w-[200px]">
      <input
        type="text"
        placeholder="Rechercher une ville, un code postal..."
        value={input}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s.city, s.postcode)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
            >
              <span className="font-semibold text-gray-800">{s.city}</span>
              <span className="text-gray-400 ml-2">{s.postcode}</span>
              {s.context && <span className="text-gray-400 text-xs ml-1">({s.context})</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
