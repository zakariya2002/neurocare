'use client';

import { useEffect, useState } from 'react';
import { COMMENT_MAX, type ChildDailyLogCommentRow } from '@/lib/family/journal';

interface Props {
  childId: string;
  logId: string | null;
  currentUserId: string;
}

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

  if (!logId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Échanges sur la journée</h3>
        <p className="text-xs text-gray-500">
          Enregistrez d&apos;abord la journée pour ouvrir un fil de discussion avec les pros qui ont
          accès au dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Échanges sur la journée</h3>
      {loading && <p className="text-xs text-gray-500">Chargement…</p>}
      {!loading && comments.length === 0 && (
        <p className="text-xs text-gray-500">
          Aucun message. Les pros ayant accès au dossier de l&apos;enfant peuvent commenter ici.
        </p>
      )}
      <ul className="space-y-2 mb-3">
        {comments.map((c) => {
          const isMine = c.author_user_id === currentUserId;
          return (
            <li
              key={c.id}
              className={`p-3 rounded-lg text-sm ${
                isMine ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {isMine ? 'Vous' : 'Pro collaborateur'} ·{' '}
                {new Date(c.created_at).toLocaleDateString('fr-FR')}{' '}
                {new Date(c.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-gray-900 whitespace-pre-wrap">{c.comment}</div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handlePost} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX))}
          rows={3}
          placeholder="Ajouter un commentaire visible par les pros invités…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{COMMENT_MAX - text.length} caractères restants</span>
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="text-sm px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#027e7e' }}
          >
            {posting ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
