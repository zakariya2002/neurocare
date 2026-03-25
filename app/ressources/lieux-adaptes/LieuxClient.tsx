'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';

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
  CMP:    { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', lightBg: '#eff6ff' },
  CAMSP:  { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0', lightBg: '#ecfdf5' },
  SESSAD: { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe', lightBg: '#f5f3ff' },
  CMPP:   { bg: '#fef3c7', text: '#92400e', border: '#fde68a', lightBg: '#fffbeb' },
  CRA:    { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8', lightBg: '#fdf2f8' },
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  CMP: 'Centre M\u00e9dico-Psychologique \u2014 Consultations psychiatriques et psychologiques gratuites',
  CAMSP: 'Centre d\u2019Action M\u00e9dico-Sociale Pr\u00e9coce \u2014 D\u00e9pistage et soins pour enfants 0-6 ans',
  SESSAD: 'Service d\u2019\u00c9ducation Sp\u00e9ciale et de Soins \u00e0 Domicile \u2014 Accompagnement ambulatoire',
  CMPP: 'Centre M\u00e9dico-Psycho-P\u00e9dagogique \u2014 Diagnostic et soins pour enfants et adolescents',
  CRA: 'Centre Ressources Autisme \u2014 Information, diagnostic et orientation r\u00e9gionale',
};

const REGIONS = [
  'Auvergne-Rh\u00f4ne-Alpes', 'Bourgogne-Franche-Comt\u00e9', 'Bretagne',
  'Centre-Val de Loire', 'Corse', 'Grand Est', 'Guadeloupe', 'Guyane',
  'Hauts-de-France', '\u00cele-de-France', 'La R\u00e9union', 'Martinique',
  'Mayotte', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
  'Pays de la Loire', 'Provence-Alpes-C\u00f4te d\u2019Azur',
];

const TYPES = ['CMP', 'CAMSP', 'SESSAD', 'CMPP', 'CRA'];
const PAGE_SIZE = 30;

export default function LieuxClient({ structures }: { structures: Structure[] }) {
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#027e7e' }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#027e7e' }}>Ressources</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: '#027e7e' }}>
            Lieux de prise en charge adapt&eacute;s TND
          </h1>
          <p className="text-base text-gray-500 max-w-2xl leading-relaxed">
            Trouvez les structures sp&eacute;cialis&eacute;es dans l&rsquo;accompagnement des troubles du neurod&eacute;veloppement (autisme, TDAH, DYS) pr&egrave;s de chez vous.
          </p>

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
        </div>
      </div>

      {/* Filtres sticky */}
      <div className="sticky top-14 z-30 border-t border-b border-gray-200" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center">
          <select
            value={region}
            onChange={e => { setRegion(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="">Toutes les r&eacute;gions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={type}
            onChange={e => { setType(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="">Tous les types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <input
            type="text"
            placeholder="Rechercher une ville, un nom..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          />

          {(region || type || search) && (
            <button onClick={resetFilters} className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              R&eacute;initialiser
            </button>
          )}
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
                  className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
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
                  <span className="text-xs text-gray-500 leading-relaxed">{TYPE_DESCRIPTIONS[t]}</span>
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
