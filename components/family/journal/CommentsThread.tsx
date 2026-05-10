'use client';

import { useEffect, useState } from 'react';
import { COMMENT_MAX, type ChildDailyLogCommentRow } from '@/lib/family/journal';

interface Props {
  childId: string;
  logId: string | null;
  currentUserId: string;
}

const ICON_CHAT =
  'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.42-4.03 8-9 8a9.86 9.86 0 0 1-4.13-.9L3 20l1.05-3.5C3.36 15.31 3 14.18 3 13c0-4.42 4.03-8 9-8s9 3.58 9 7z';

export default function CommentsThread({ childId, logId, currentUserId }: Props) {
  const [comments, setComments] = useState<ChildDailyLogCommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!logId) {
      setComments([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/family/children/${childId}/journal/logs/${logId}/comments`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Erreur de chargement');
        const json = await res.json();
        if (!cancelled) setComments(json.comments ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [childId, logId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logId || !text.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/family/children/${childId}/journal/logs/${logId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: text.trim() }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Erreur');
      }
      const json = await res.json();
      setComments((prev) => [...prev, json.comment]);
      setText('');
    } catch (err: any) {
      setError(err.message ?? 'Erreur');
    } finally {
      setPosting(false);
    }
  };

  // Header commun
  const header = (
    <div
      className="px-4 sm:px-5 py-3 flex items-center gap-3 border-b border-gray-100"
      style={{ backgroundColor: 'rgba(2, 126, 126, 0.06)' }}
    >
      <span
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(2, 126, 126, 0.18)' }}
        aria-hidden="true"
      >
        <svg className="w-5 h-5" fill="none" stroke="#027e7e" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={ICON_CHAT} />
        </svg>
      </span>
      <h3
        className="text-sm sm:text-base font-bold"
        style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
      >
        Échanges sur la journée
      </h3>
    </div>
  );

  if (!logId) {
    return (
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {header}
        <p className="px-4 sm:px-5 py-4 text-xs sm:text-sm text-gray-500">
          Enregistrez d&apos;abord la journée pour ouvrir un fil de discussion avec les pros qui ont
          accès au dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {header}
      <div className="p-4 sm:p-5 space-y-3">
        {loading && <p className="text-xs text-gray-500">Chargement…</p>}
        {!loading && comments.length === 0 && (
          <p className="text-xs sm:text-sm text-gray-500">
            Aucun message. Les pros ayant accès au dossier de l&apos;enfant peuvent commenter ici.
          </p>
        )}
        <ul className="space-y-3">
          {comments.map((c) => {
            const isMine = c.author_user_id === currentUserId;
            const initials = (isMine ? 'V' : 'P').toUpperCase();
            return (
              <li key={c.id} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: isMine ? '#027e7e' : '#3a9e9e' }}
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: '#015c5c' }}>
                      {isMine ? 'Vous' : 'Pro collaborateur'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('fr-FR')} ·{' '}
                      {new Date(c.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className="mt-1 px-3 py-2 rounded-xl text-sm whitespace-pre-wrap border"
                    style={{
                      backgroundColor: '#e6f4f4',
                      borderColor: 'rgba(2, 126, 126, 0.15)',
                      color: '#0f4747',
                    }}
                  >
                    {c.comment}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <form onSubmit={handlePost} className="space-y-2 pt-2 border-t border-gray-100">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX))}
            rows={3}
            placeholder="Ajouter un commentaire visible par les pros invités…"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              {COMMENT_MAX - text.length} caractères restants
            </span>
            <button
              type="submit"
              disabled={posting || !text.trim()}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: '#027e7e' }}
            >
              {posting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
