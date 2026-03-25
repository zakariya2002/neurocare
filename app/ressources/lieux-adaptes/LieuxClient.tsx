'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';

// ─── Types ───
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

// ─── Couleurs par type ───
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CMP:    { bg: '#0c2d48', text: '#5bc0eb', border: '#1a4a6e' },
  CAMSP:  { bg: '#1a3a2a', text: '#6bcb77', border: '#2d5a3e' },
  SESSAD: { bg: '#2d1b4e', text: '#b68bda', border: '#4a2d6e' },
  CMPP:   { bg: '#3a2a1a', text: '#e8a855', border: '#5a4a2d' },
  CRA:    { bg: '#1a2a3a', text: '#f0879f', border: '#2d3a5a' },
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
    setRegion('');
    setType('');
    setSearch('');
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((setter: (v: string) => void) => {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }, []);

  const mapsUrl = (s: Structure) => {
    const addr = encodeURIComponent(`${s.adresse} ${s.code_postal} ${s.ville}`);
    return `https://www.google.com/maps/search/?api=1&query=${addr}`;
  };

  return (
    <div style={{ backgroundColor: '#0b0f15', minHeight: '100vh', color: '#e2e8f0' }}>
      <PublicNavbar />

      {/* Hero */}
      <div style={{ paddingTop: '80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 4, backgroundColor: '#027e7e', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#027e7e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ressources
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
            Lieux de prise en charge adapt&eacute;s TND
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', marginTop: 16, maxWidth: 700, lineHeight: 1.6 }}>
            Trouvez les structures sp&eacute;cialis&eacute;es dans l&rsquo;accompagnement des troubles du neurod&eacute;veloppement (autisme, TDAH, DYS) pr&egrave;s de chez vous. Donn&eacute;es issues du r&eacute;pertoire FINESS et du GNCRA.
          </p>

          {/* Stats rapides */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
            {TYPES.map(t => {
              const count = structures.filter(s => s.type === t).length;
              const colors = TYPE_COLORS[t];
              return (
                <button
                  key={t}
                  onClick={() => { handleFilterChange(setType)(type === t ? '' : t); }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: type === t ? colors.text : colors.bg,
                    color: type === t ? '#0b0f15' : colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {t} &middot; {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ backgroundColor: '#111827', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b', position: 'sticky', top: 56, zIndex: 30 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <select
            value={region}
            onChange={e => handleFilterChange(setRegion)(e.target.value)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 14,
              minWidth: 200,
              cursor: 'pointer',
            }}
          >
            <option value="">Toutes les r&eacute;gions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={type}
            onChange={e => handleFilterChange(setType)(e.target.value)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 14,
              minWidth: 160,
              cursor: 'pointer',
            }}
          >
            <option value="">Tous les types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <input
            type="text"
            placeholder="Rechercher une ville, un nom..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              padding: '10px 14px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 14,
              flex: 1,
              minWidth: 200,
            }}
          />

          {(region || type || search) && (
            <button
              onClick={resetFilters}
              style={{
                padding: '10px 16px',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              R&eacute;initialiser
            </button>
          )}
        </div>
      </div>

      {/* Résultats */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
          {filtered.length} structure{filtered.length > 1 ? 's' : ''} trouv&eacute;e{filtered.length > 1 ? 's' : ''}
          {region && <> en <strong style={{ color: '#94a3b8' }}>{region}</strong></>}
          {type && <> &middot; type <strong style={{ color: '#94a3b8' }}>{type}</strong></>}
        </p>

        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>&#128269;</p>
            <p style={{ fontSize: 18, color: '#64748b' }}>Aucune structure trouv&eacute;e</p>
            <button onClick={resetFilters} style={{ marginTop: 16, padding: '10px 24px', backgroundColor: '#027e7e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Voir toutes les structures
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {paginated.map(s => (
              <StructureCard key={s.id} structure={s} mapsUrl={mapsUrl(s)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 40 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px', backgroundColor: '#1e293b', color: page === 1 ? '#475569' : '#e2e8f0',
                border: '1px solid #334155', borderRadius: 8, fontSize: 14, cursor: page === 1 ? 'default' : 'pointer',
              }}
            >
              &larr; Pr&eacute;c&eacute;dent
            </button>
            <span style={{ fontSize: 14, color: '#94a3b8', padding: '0 16px' }}>
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px', backgroundColor: '#1e293b', color: page === totalPages ? '#475569' : '#e2e8f0',
                border: '1px solid #334155', borderRadius: 8, fontSize: 14, cursor: page === totalPages ? 'default' : 'pointer',
              }}
            >
              Suivant &rarr;
            </button>
          </div>
        )}

        {/* Légende */}
        <div style={{ marginTop: 48, padding: 24, backgroundColor: '#111827', borderRadius: 12, border: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>L&eacute;gende des structures</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {TYPES.map(t => {
              const colors = TYPE_COLORS[t];
              return (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                    {t}
                  </span>
                  <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                    {TYPE_DESCRIPTIONS[t]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 32, lineHeight: 1.6 }}>
          Donn&eacute;es issues du r&eacute;pertoire FINESS (data.gouv.fr) et du GNCRA. Derni&egrave;re mise &agrave; jour : mars 2026.
          <br />
          Une erreur ? Un lieu manquant ? <Link href="/contact" style={{ color: '#027e7e', textDecoration: 'underline' }}>Contactez-nous</Link>.
        </p>
      </div>
    </div>
  );
}

// ─── Composant Card ───
function StructureCard({ structure: s, mapsUrl }: { structure: Structure; mapsUrl: string }) {
  const colors = TYPE_COLORS[s.type] || TYPE_COLORS.CMP;

  return (
    <div style={{
      backgroundColor: '#111827',
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0, lineHeight: 1.4, flex: 1 }}>
          {s.nom}
        </h3>
        <span style={{
          padding: '3px 10px',
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {s.type}
        </span>
      </div>

      {/* Infos */}
      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
        {s.adresse && <p style={{ margin: 0 }}>{s.adresse}</p>}
        <p style={{ margin: 0, fontWeight: 600, color: '#cbd5e1' }}>
          {s.code_postal} {s.ville}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        {s.telephone && (
          <a
            href={`tel:${s.telephone.replace(/\s/g, '')}`}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            &#128222; {s.telephone}
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 14px',
            backgroundColor: '#027e7e',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          Itin&eacute;raire &rarr;
        </a>
      </div>
    </div>
  );
}
