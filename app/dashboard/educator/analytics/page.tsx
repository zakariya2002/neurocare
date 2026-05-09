'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';

type Summary = {
  revenueMonth: number;
  revenue30: number;
  revenuePrev30: number;
  revenueDeltaPct: number;
  profileViews30: number;
  conversionPct: number;
  sessionsMonth: number;
  avgRating: number;
  totalReviews: number;
};

type Monthly = { month: string; amount: number };
type Daily = { date: string; count: number };

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const LOCATION_LABELS: Record<string, string> = {
  office: 'Cabinet',
  home: 'Domicile',
  institution: 'Institution',
  online: 'En ligne',
  other: 'Autre',
};
const LOCATION_COLORS: Record<string, string> = {
  office: '#41005c',
  home: '#7c3aed',
  institution: '#a78bfa',
  online: '#f0879f',
  other: '#9ca3af',
};

function formatEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function monthLabel(key: string) {
  const [, m] = key.split('-');
  return MONTH_LABELS[parseInt(m, 10) - 1] || key;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function BarChart({ data, color = '#41005c' }: { data: Monthly[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  const width = 540;
  const height = 200;
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const barW = innerW / data.length - 8;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Revenus mensuels sur 6 mois">
      {[0, 0.5, 1].map((r) => {
        const y = pad.t + innerH - innerH * r;
        return (
          <g key={r}>
            <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#6b7280">
              {formatEuro(max * r)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = pad.l + i * (innerW / data.length) + 4;
        const h = (d.amount / max) * innerH;
        const y = pad.t + innerH - h;
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={color} opacity={0.85} />
            <text x={x + barW / 2} y={pad.t + innerH + 16} textAnchor="middle" fontSize="11" fill="#374151">
              {monthLabel(d.month)}
            </text>
            {d.amount > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#374151" fontWeight="600">
                {formatEuro(d.amount)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, color = '#7c3aed' }: { data: Daily[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 540;
  const height = 180;
  const pad = { l: 30, r: 12, t: 12, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const stepX = innerW / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = pad.l + i * stepX;
    const y = pad.t + innerH - (d.count / max) * innerH;
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${path} L${points[points.length - 1][0]},${pad.t + innerH} L${points[0][0]},${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Vues du profil par jour sur 30 jours">
      {[0, 0.5, 1].map((r) => {
        const y = pad.t + innerH - innerH * r;
        return (
          <g key={r}>
            <line x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#6b7280">
              {Math.round(max * r)}
            </text>
          </g>
        );
      })}
      <path d={area} fill={color} opacity={0.15} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
      {points.map(([x, y], i) =>
        i % 5 === 0 || i === points.length - 1 ? (
          <g key={i}>
            <circle cx={x} cy={y} r={3} fill={color} />
            <text x={x} y={pad.t + innerH + 16} textAnchor="middle" fontSize="10" fill="#374151">
              {dayLabel(data[i].date)}
            </text>
          </g>
        ) : null
      )}
    </svg>
  );
}

function Donut({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Pas encore de séances</p>;
  }
  const size = 180;
  const r = 70;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Répartition des séances par lieu">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={20} />
        {entries.map(([key, v]) => {
          const frac = v / total;
          const dasharray = `${frac * circumference} ${circumference}`;
          const dashoffset = -offset;
          offset += frac * circumference;
          return (
            <circle
              key={key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={LOCATION_COLORS[key] || '#9ca3af'}
              strokeWidth={20}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="#41005c">
          {total}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="11" fill="#6b7280">
          séances
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {entries.map(([key, v]) => (
          <li key={key} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: LOCATION_COLORS[key] || '#9ca3af' }} />
            <span className="text-gray-700">
              {LOCATION_LABELS[key] || key} : <strong>{v}</strong> ({Math.round((v / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EducatorAnalyticsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<Monthly[]>([]);
  const [byLocation, setByLocation] = useState<Record<string, number>>({});
  const [daily, setDaily] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/pro/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      setProfile(profileData);

      try {
        const [sumRes, revRes, viewsRes] = await Promise.all([
          fetch('/api/educator/analytics/summary'),
          fetch('/api/educator/analytics/revenue'),
          fetch('/api/educator/analytics/profile-views'),
        ]);
        if (!sumRes.ok || !revRes.ok || !viewsRes.ok) {
          throw new Error('Erreur de chargement des statistiques');
        }
        const [sum, rev, views] = await Promise.all([sumRes.json(), revRes.json(), viewsRes.json()]);
        setSummary(sum);
        setMonthly(rev.monthly || []);
        setByLocation(rev.byLocation || {});
        setDaily(views.daily || []);
      } catch (e: any) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const hasAnyData =
    summary &&
    (summary.revenue30 > 0 ||
      summary.profileViews30 > 0 ||
      summary.sessionsMonth > 0 ||
      monthly.some((m) => m.amount > 0));

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <EducatorNavbar profile={profile} />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8">
        {/* En-tête avec flèche retour */}
        <div className="mb-3 sm:mb-5 md:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
            aria-label="Retour à la page précédente"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs md:text-sm font-medium">Retour</span>
          </button>

          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#41005c' }}>
              <img src="/images/icons/analytics.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">Mes statistiques</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mt-1">Suivi de votre activité, revenus et visibilité</p>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 mb-4">
            {error}
          </div>
        )}

        {!loading && summary && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <KpiCard
                label="Revenus du mois"
                value={formatEuro(summary.revenueMonth)}
                hint={`${summary.sessionsMonth} séances réalisées`}
                tone="purple"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                }
              />
              <KpiCard
                label="Revenus 30 j"
                value={formatEuro(summary.revenue30)}
                hint={
                  summary.revenuePrev30 > 0
                    ? `${summary.revenueDeltaPct >= 0 ? '+' : ''}${summary.revenueDeltaPct}% vs 30 j précédents`
                    : 'Pas de comparaison'
                }
                tone={summary.revenueDeltaPct >= 0 ? 'green' : 'red'}
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8m0 0v6m0-6h-6" />
                }
              />
              <KpiCard
                label="Vues du profil"
                value={String(summary.profileViews30)}
                hint="30 derniers jours"
                tone="pink"
                icon={
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </>
                }
              />
              <KpiCard
                label="Conversion"
                value={`${summary.conversionPct}%`}
                hint="Vues → demandes RDV"
                tone="purple"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                }
              />
            </div>

            {/* Note moyenne */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fef3c7' }}>
                <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Note moyenne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalReviews > 0 ? `${summary.avgRating} / 5` : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {summary.totalReviews > 0
                    ? `${summary.totalReviews} avis reçu${summary.totalReviews > 1 ? 's' : ''}`
                    : 'Aucun avis pour le moment'}
                </p>
              </div>
            </div>

            {/* Insights & actions — affiché toujours, adapté selon l'état */}
            <section className="bg-gradient-to-br from-purple-50 via-white to-pink-50 border border-purple-100 rounded-2xl p-4 sm:p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Insights &amp; actions</h2>
              </div>
              <ul className="space-y-2.5">
                {/* Profil incomplet ou non vérifié */}
                {profile && profile.diploma_status !== 'verified' && (
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-white border border-amber-100">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Faites vérifier vos diplômes</p>
                      <p className="text-xs text-gray-500 mt-0.5">Les profils vérifiés reçoivent <strong>3× plus de demandes</strong>.</p>
                    </div>
                    <Link href="/dashboard/educator/diploma" className="text-xs font-semibold whitespace-nowrap" style={{ color: '#41005c' }}>Vérifier →</Link>
                  </li>
                )}

                {/* Conversion faible */}
                {summary.profileViews30 >= 10 && summary.conversionPct < 5 && (
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-white border border-pink-100">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fce7f3', color: '#be185d' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Conversion faible : {summary.conversionPct}%</p>
                      <p className="text-xs text-gray-500 mt-0.5">Enrichissez votre bio, ajoutez photos &amp; vidéo de présentation pour rassurer.</p>
                    </div>
                    <Link href="/dashboard/educator/profile" className="text-xs font-semibold whitespace-nowrap" style={{ color: '#41005c' }}>Profil →</Link>
                  </li>
                )}

                {/* Aucun avis reçu */}
                {summary.totalReviews === 0 && summary.sessionsMonth > 0 && (
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-white border border-amber-100">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Demandez un avis aux familles</p>
                      <p className="text-xs text-gray-500 mt-0.5">Les avis boostent votre visibilité dans la recherche.</p>
                    </div>
                  </li>
                )}

                {/* Pas de séance ce mois */}
                {summary.sessionsMonth === 0 && (
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-white border border-purple-100">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Définissez vos disponibilités</p>
                      <p className="text-xs text-gray-500 mt-0.5">Plus de créneaux = plus de chances de recevoir une demande.</p>
                    </div>
                    <Link href="/dashboard/educator/availability" className="text-xs font-semibold whitespace-nowrap" style={{ color: '#41005c' }}>Agenda →</Link>
                  </li>
                )}

                {/* Croissance positive — célébration */}
                {summary.revenueDeltaPct >= 10 && summary.revenue30 > 0 && (
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-white border border-green-100">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8m0 0v6m0-6h-6" /></svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Bravo, +{summary.revenueDeltaPct}% de revenus 🎉</p>
                      <p className="text-xs text-gray-500 mt-0.5">Vos revenus 30j ont augmenté vs la période précédente. Continuez !</p>
                    </div>
                  </li>
                )}

                {/* Si tout est calme — message neutre */}
                {!hasAnyData && (
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Pas encore assez de données</p>
                      <p className="text-xs text-gray-500 mt-0.5">Une fois vos premières séances réalisées, vos statistiques apparaîtront ici.</p>
                    </div>
                  </li>
                )}
              </ul>
            </section>

            {/* Revenus mensuels */}
            <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Revenus sur 6 mois</h2>
              <BarChart data={monthly} />
            </section>

            {/* Vues profil */}
            <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Vues du profil sur 30 jours</h2>
              <LineChart data={daily} />
            </section>

            {/* Répartition séances */}
            <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Répartition des séances par lieu</h2>
              <Donut counts={byLocation} />
            </section>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href="/dashboard/educator/appointments"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg text-sm transition hover:opacity-90"
                style={{ backgroundColor: '#41005c' }}
              >
                Voir mes rendez-vous
              </Link>
              <Link
                href="/dashboard/educator/payouts"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-lg text-sm border-2 transition hover:bg-purple-50"
                style={{ borderColor: '#41005c', color: '#41005c' }}
              >
                Gestion des paiements
              </Link>
            </div>
          </>
        )}

        <div className="h-20" />
      </main>

      <div className="mt-auto" style={{ backgroundColor: '#41005c', height: '40px' }} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'purple' | 'pink' | 'green' | 'red';
  icon: React.ReactNode;
}) {
  const palette = {
    purple: { bg: '#f3e8ff', fg: '#41005c' },
    pink: { bg: '#fce7f3', fg: '#be185d' },
    green: { bg: '#dcfce7', fg: '#15803d' },
    red: { bg: '#fee2e2', fg: '#b91c1c' },
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: palette.bg }}>
          <svg className="w-4 h-4" fill="none" stroke={palette.fg} viewBox="0 0 24 24" aria-hidden="true">
            {icon}
          </svg>
        </div>
        <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-xl sm:text-2xl font-extrabold" style={{ color: '#41005c' }}>
        {value}
      </p>
      <p className="text-[11px] sm:text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  );
}
