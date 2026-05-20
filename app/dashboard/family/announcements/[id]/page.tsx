'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import ResponsesList from '@/components/family/announcements/ResponsesList';
import {
  ACCOMPANIMENT_OPTIONS,
  AnnouncementResponse,
  FamilyAnnouncement,
  PLACE_OPTIONS,
  PROFESSION_OPTIONS,
  SCHEDULE_OPTIONS,
  STATUS_COLORS,
  STATUS_LABELS,
  TND_OPTIONS,
} from '@/components/family/announcements/types';

function label(opts: { value: string; label: string }[], v: string): string {
  return opts.find((o) => o.value === v)?.label || v;
}

function joinLabels(opts: { value: string; label: string }[], vs: string[] | undefined): string {
  if (!vs || !vs.length) return '—';
  return vs.map((v) => label(opts, v)).join(', ');
}

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const announcementId = params?.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<FamilyAnnouncement | null>(null);
  const [responses, setResponses] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'announcement' | 'responses'>('announcement');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/family/announcements/${announcementId}`);
      if (!res.ok) throw new Error('Annonce introuvable.');
      const body = await res.json();
      setAnnouncement(body.announcement);
      setResponses(body.responses || []);
    } catch (e: any) {
      setError(e.message || 'Erreur.');
    }
  };

  useEffect(() => {
    if (!announcementId) return;
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }
      setUserId(session.user.id);
      const { data: family } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (!active) return;
      if (family) {
        setProfile(family);
        setFamilyId(family.id);
      }
      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementId]);

  const patch = async (body: any) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/family/announcements/${announcementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Action impossible.');
      }
      await load();
    } catch (e: any) {
      setError(e.message || 'Erreur.');
    } finally {
      setBusy(false);
    }
  };

  const canEdit = announcement
    ? ['draft', 'pending', 'rejected', 'expired'].includes(announcement.status)
    : false;
  const canFill = announcement?.status === 'published';
  const canArchive = announcement && announcement.status !== 'archived';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <section className="py-3 sm:py-5 md:py-8 px-3 sm:px-4 md:px-6 flex-1">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/family/announcements')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            aria-label="Retour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Mes annonces</span>
          </button>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r text-sm mb-4" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-4 mx-auto"
                style={{ borderTopColor: '#027e7e', borderRightColor: '#3a9e9e', borderBottomColor: '#6bbebe', borderLeftColor: 'rgba(2, 126, 126, 0.2)' }} />
              <p className="text-gray-600 mt-4 text-sm">Chargement...</p>
            </div>
          ) : announcement ? (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
                      {announcement.title}
                    </h1>
                    {announcement.city && (
                      <p className="text-sm text-gray-500 mt-1">
                        {announcement.city} ({announcement.postal_code}) — Rayon {announcement.radius_km} km
                      </p>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap"
                    style={{
                      backgroundColor: STATUS_COLORS[announcement.status].bg,
                      color: STATUS_COLORS[announcement.status].text,
                      borderColor: STATUS_COLORS[announcement.status].border,
                    }}
                  >
                    {STATUS_LABELS[announcement.status]}
                  </span>
                </div>

                {announcement.status === 'rejected' && announcement.rejection_reason && (
                  <div className="mt-3 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#991b1b' }}>
                    <span className="font-semibold">Motif de refus : </span>
                    {announcement.rejection_reason}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                <div className="flex border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setTab('announcement')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      tab === 'announcement' ? 'border-b-2' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={tab === 'announcement' ? { color: '#027e7e', borderColor: '#027e7e' } : {}}
                  >
                    Mon annonce
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('responses')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      tab === 'responses' ? 'border-b-2' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={tab === 'responses' ? { color: '#027e7e', borderColor: '#027e7e' } : {}}
                  >
                    Réponses reçues ({responses.length})
                  </button>
                </div>

                <div className="p-4 sm:p-6">
                  {tab === 'announcement' ? (
                    <div className="space-y-4 text-sm">
                      <Section title="Description">
                        <p className="whitespace-pre-wrap text-gray-800">{announcement.description}</p>
                      </Section>
                      <Section title="Besoin">
                        <Row label="Accompagnement" value={joinLabels(ACCOMPANIMENT_OPTIONS, announcement.accompaniment_types)} />
                        <Row label="Professions" value={joinLabels(PROFESSION_OPTIONS, announcement.desired_professions)} />
                        <Row label="Contexte TND" value={joinLabels(TND_OPTIONS, announcement.tnd_context)} />
                      </Section>
                      <Section title="Personne">
                        <Row label="Âge" value={announcement.person_age !== null ? `${announcement.person_age} ans` : '—'} />
                        <Row
                          label="Préférence pro"
                          value={
                            announcement.gender_preference === 'male'
                              ? 'Masculin'
                              : announcement.gender_preference === 'female'
                              ? 'Féminin'
                              : 'Indifférent'
                          }
                        />
                      </Section>
                      <Section title="Lieu & horaires">
                        <Row label="Adresse" value={announcement.location_label} />
                        <Row label="Rayon" value={`${announcement.radius_km} km`} />
                        <Row label="Lieux" value={joinLabels(PLACE_OPTIONS, announcement.place_types)} />
                        <Row label="Volume" value={announcement.hours_per_week ? `${announcement.hours_per_week} h / sem.` : '—'} />
                        <Row label="Créneaux" value={joinLabels(SCHEDULE_OPTIONS, announcement.schedule_preferences)} />
                        <Row label="Début" value={announcement.start_date || '—'} />
                      </Section>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                        {canEdit && (
                          <Link
                            href={`/dashboard/family/announcements/${announcement.id}/edit`}
                            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                            style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)', color: '#027e7e' }}
                          >
                            Modifier
                          </Link>
                        )}
                        {canFill && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Marquer cette annonce comme pourvue ?')) patch({ status: 'filled' });
                            }}
                            disabled={busy}
                            className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
                            style={{ backgroundColor: '#027e7e' }}
                          >
                            Marquer pourvue
                          </button>
                        )}
                        {canArchive && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Archiver cette annonce ?')) patch({ status: 'archived' });
                            }}
                            disabled={busy}
                            className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            Archiver
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ResponsesList
                      announcementId={announcement.id}
                      responses={responses}
                      onChange={setResponses}
                    />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-600">Annonce introuvable.</p>
            </div>
          )}

          <div className="h-20" />
        </div>
      </section>

      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#027e7e' }}>
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-right font-medium text-gray-800">{value || '—'}</span>
    </div>
  );
}
