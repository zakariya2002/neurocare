'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

interface Props {
  childId: string;
  childFirstName: string;
  open: boolean;
  onClose: () => void;
  onInvited?: () => void;
}

export default function InviteCollaboratorModal({ childId, childFirstName, open, onClose, onInvited }: Props) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.showToast('Email invalide', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ppa/${childId}/collaborations/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ educator_email: email.trim(), permission, message: message.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.showToast(json.error || 'Erreur', 'error');
        return;
      }
      toast.showToast('Invitation envoyée', 'success');
      setEmail('');
      setPermission('read');
      setMessage('');
      onInvited?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Inviter un confrère</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sur le suivi de <strong>{childFirstName}</strong>
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email NeuroCare du confrère</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="confrere@exemple.fr"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Niveau d'accès</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPermission('read')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${permission === 'read' ? 'border-purple-500 bg-purple-50 text-purple-900' : 'border-gray-200 bg-white text-gray-600'}`}
              >
                Lecture seule
              </button>
              <button
                type="button"
                onClick={() => setPermission('write')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${permission === 'write' ? 'border-purple-500 bg-purple-50 text-purple-900' : 'border-gray-200 bg-white text-gray-600'}`}
              >
                Lecture + écriture
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message (optionnel)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
              placeholder="Bonjour, je souhaiterais que tu rejoignes…"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 bg-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#41005c' }}
            >
              {submitting ? 'Envoi…' : 'Envoyer l\'invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
