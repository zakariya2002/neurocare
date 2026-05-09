'use client';

import { useState } from 'react';

const DAYS = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' },
];

interface Props {
  educatorId: string;
  educatorName: string;
  open: boolean;
  onClose: () => void;
}

export default function WaitlistJoinModal({ educatorId, educatorName, open, onClose }: Props) {
  const [days, setDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const toggleDay = (day: string) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (days.length === 0) {
      setError('Sélectionnez au moins un jour.');
      return;
    }
    if (start >= end) {
      setError('L\'horaire de début doit être avant l\'horaire de fin.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educator_id: educatorId,
          preferred_days: days,
          preferred_time_range: { start, end },
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError('Connectez-vous pour rejoindre la liste d\'attente.');
        } else {
          setError(data.error || 'Erreur lors de l\'inscription');
        }
        return;
      }
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inscription confirmée</h3>
              <p className="text-sm text-gray-600 mb-6">
                Vous serez prévenu(e) par email dès qu&apos;un créneau correspondant à vos critères se libère chez {educatorName}.
              </p>
              <button onClick={onClose} className="w-full px-5 py-2.5 text-white font-semibold rounded-lg text-sm hover:opacity-90" style={{ backgroundColor: '#027e7e' }}>
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Être notifié(e) d&apos;un créneau</h3>
                  <p className="text-sm text-gray-500 mt-1">Chez {educatorName}</p>
                </div>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 -mr-2 p-2" aria-label="Fermer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jours préférés</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(d => (
                      <button
                        type="button"
                        key={d.value}
                        onClick={() => toggleDay(d.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${days.includes(d.value) ? 'text-white' : 'text-gray-600 bg-white'}`}
                        style={days.includes(d.value)
                          ? { backgroundColor: '#027e7e', borderColor: '#027e7e' }
                          : { borderColor: '#e5e7eb' }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="wl-start" className="block text-sm font-semibold text-gray-700 mb-2">Horaire min.</label>
                    <input
                      id="wl-start"
                      type="time"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:border-[#027e7e] outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="wl-end" className="block text-sm font-semibold text-gray-700 mb-2">Horaire max.</label>
                    <input
                      id="wl-end"
                      type="time"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:border-[#027e7e] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wl-notes" className="block text-sm font-semibold text-gray-700 mb-2">Note pour le pro <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <textarea
                    id="wl-notes"
                    rows={3}
                    maxLength={500}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex : besoin urgent pour bilan TDAH"
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:border-[#027e7e] outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-white font-semibold rounded-lg text-sm transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {submitting ? 'Inscription…' : 'Rejoindre la liste d\'attente'}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Vous recevrez un email dès qu&apos;un créneau correspondant à vos critères se libère.
                  Vous pourrez quitter la liste à tout moment.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
