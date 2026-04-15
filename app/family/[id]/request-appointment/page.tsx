'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Calendar from '@/components/Calendar';
import EducatorNavbar from '@/components/EducatorNavbar';

interface Family {
  id: string;
  first_name: string;
  last_name: string;
}

interface Appointment {
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function RequestAppointmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [educatorId, setEducatorId] = useState<string | null>(null);
  const [educatorProfile, setEducatorProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [locationType, setLocationType] = useState<'home' | 'office' | 'online'>('online');
  const [address, setAddress] = useState('');
  const [educatorNotes, setEducatorNotes] = useState('');

  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (educatorId) {
      fetchFamilyData();
      fetchExistingAppointments();
    }
  }, [educatorId]);

  useEffect(() => {
    if (selectedDate) {
      calculateAvailableSlots();
    }
  }, [selectedDate, appointments]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push(`/auth/login?redirect=/family/${params.id}/request-appointment`);
      return;
    }

    // Vérifier que c'est bien un éducateur
    const { data: profile } = await supabase
      .from('educator_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!profile) {
      setError('Seuls les éducateurs peuvent proposer des rendez-vous');
      setLoading(false);
      return;
    }

    setEducatorId(profile.id);
    setEducatorProfile(profile);
  };

  const fetchFamilyData = async () => {
    try {
      const { data, error } = await supabase
        .from('family_profiles')
        .select('id, first_name, last_name')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setFamily(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les informations de la famille');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAppointments = async () => {
    if (!educatorId) return;

    try {
      // Récupérer les rendez-vous existants de l'éducateur
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('appointment_date, start_time, end_time, status')
        .eq('educator_id', educatorId)
        .in('status', ['accepted', 'confirmed']);

      setAppointments(existingAppointments || []);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Générer des créneaux standards de 8h à 20h (créneaux de 1h)
  const calculateAvailableSlotsForDate = (dateStr: string) => {
    const slots: { start: string; end: string }[] = [];

    // Créneaux de 8h00 à 20h00 par tranches de 1 heure
    for (let hour = 8; hour < 20; hour++) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00`;

      // Vérifier si ce créneau n'est pas déjà pris
      const isBooked = appointments.some(apt => {
        return apt.appointment_date === dateStr && apt.start_time === startTime;
      });

      if (!isBooked) {
        slots.push({ start: startTime, end: endTime });
      }
    }

    return slots;
  };

  const calculateAvailableSlots = () => {
    if (!selectedDate) return;
    const slots = calculateAvailableSlotsForDate(selectedDate);
    setAvailableSlots(slots);
  };

  const handleSlotToggle = (startTime: string) => {
    setSelectedSlots(prev => {
      // Si on clique sur un créneau déjà sélectionné, on désélectionne tout
      if (prev.includes(startTime)) {
        return [];
      }

      // Si aucun créneau n'est sélectionné, on sélectionne juste celui-ci
      if (prev.length === 0) {
        return [startTime];
      }

      // Sinon, on sélectionne tous les créneaux entre le premier sélectionné et celui-ci
      const allSlotTimes = availableSlots.map(s => s.start);
      const clickedIndex = allSlotTimes.indexOf(startTime);
      const firstSelectedIndex = allSlotTimes.indexOf(prev[0]);

      if (clickedIndex === -1 || firstSelectedIndex === -1) {
        return [startTime];
      }

      const startIdx = Math.min(clickedIndex, firstSelectedIndex);
      const endIdx = Math.max(clickedIndex, firstSelectedIndex);

      // Sélectionner tous les créneaux entre startIdx et endIdx
      return allSlotTimes.slice(startIdx, endIdx + 1);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSlots.length === 0) {
      setError('Veuillez sélectionner au moins un créneau horaire');
      return;
    }

    if (locationType === 'home' && !address.trim()) {
      setError('Veuillez indiquer une adresse');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Préparer les créneaux pour l'API
      const slots = selectedSlots.map(startTime => {
        const slot = availableSlots.find(s => s.start === startTime);
        return {
          start_time: startTime,
          end_time: slot?.end || '',
        };
      });

      // Appeler l'API pour créer les rendez-vous
      const response = await fetch('/api/appointments/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educatorId,
          familyId: params.id,
          appointmentDate: selectedDate,
          slots,
          locationType,
          address: locationType === 'home' ? address : null,
          educatorNotes: educatorNotes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création des rendez-vous');
      }

      setSuccess(`Rendez-vous proposé${selectedSlots.length > 1 ? 's' : ''} avec succès ! La famille recevra une notification.`);

      // Réinitialiser le formulaire
      setSelectedSlots([]);
      setEducatorNotes('');
      setAddress('');

      // Recharger les rendez-vous
      fetchExistingAppointments();

      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/messages');
      }, 2000);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div
          className="animate-spin h-12 w-12 border-4 border-t-transparent rounded-full"
          style={{ borderColor: '#41005c', borderTopColor: 'transparent' }}
          role="status"
          aria-label="Chargement en cours"
        >
          <span className="sr-only">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error && !educatorId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fde8ec' }}>
            <svg className="w-8 h-8" style={{ color: '#f0879f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{error}</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition hover:opacity-90"
            style={{ backgroundColor: '#41005c' }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <EducatorNavbar profile={educatorProfile} />

      {/* Contenu principal */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* En-tête */}
        <div className="mb-6">
          <Link
            href={`/family/${params.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium mb-4 transition hover:opacity-80"
            style={{ color: '#41005c' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au profil
          </Link>

          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f3e8ff' }}>
                <svg className="w-6 h-6" style={{ color: '#41005c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Proposer un rendez-vous
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  À <span className="font-semibold" style={{ color: '#41005c' }}>{family?.first_name} {family?.last_name}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-6 rounded-xl p-4 border" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }} role="alert">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-500">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-green-800 font-medium text-sm">{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Calendrier */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Sélectionner une date
            </label>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              minDate={new Date()}
            />
          </div>

          {/* Créneaux disponibles */}
          {selectedDate && (
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Créneaux pour le {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </label>
              {availableSlots.length === 0 ? (
                <p className="text-gray-500 text-sm">Tous les créneaux sont déjà réservés pour cette date.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => handleSlotToggle(slot.start)}
                        className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${
                          selectedSlots.includes(slot.start)
                            ? 'text-white shadow-md'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#41005c] hover:bg-[#f3e8ff]'
                        }`}
                        style={selectedSlots.includes(slot.start) ? { backgroundColor: '#41005c' } : {}}
                        aria-label={`Créneau de ${slot.start} à ${slot.end}`}
                        aria-pressed={selectedSlots.includes(slot.start)}
                      >
                        {slot.start}
                      </button>
                    ))}
                  </div>

                  {/* Résumé dynamique */}
                  {selectedSlots.length > 0 && (
                    <div className="mt-4 p-4 rounded-xl border" style={{ backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' }}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-lg font-bold" style={{ color: '#41005c' }}>
                            {selectedSlots.length}h
                          </p>
                          <p className="text-sm" style={{ color: '#6b21a8' }}>
                            De {[...selectedSlots].sort()[0]} à {(() => {
                              const sorted = [...selectedSlots].sort();
                              const last = sorted[sorted.length - 1];
                              const h = parseInt(last.split(':')[0], 10);
                              return `${String(h + 1).padStart(2, '0')}:00`;
                            })()}
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: '#7c3aed' }}>
                          Cliquez sur un créneau pour annuler
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Type de rendez-vous */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Type de rendez-vous
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setLocationType('online')}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  locationType === 'online'
                    ? 'text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#41005c]'
                }`}
                style={locationType === 'online' ? { backgroundColor: '#41005c' } : {}}
                aria-pressed={locationType === 'online'}
              >
                En ligne
              </button>
              <button
                type="button"
                onClick={() => setLocationType('home')}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  locationType === 'home'
                    ? 'text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#41005c]'
                }`}
                style={locationType === 'home' ? { backgroundColor: '#41005c' } : {}}
                aria-pressed={locationType === 'home'}
              >
                À domicile
              </button>
              <button
                type="button"
                onClick={() => setLocationType('office')}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  locationType === 'office'
                    ? 'text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#41005c]'
                }`}
                style={locationType === 'office' ? { backgroundColor: '#41005c' } : {}}
                aria-pressed={locationType === 'office'}
              >
                Au cabinet
              </button>
            </div>
          </div>

          {/* Adresse */}
          {locationType === 'home' && (
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-2">
                Adresse du rendez-vous <span style={{ color: '#f0879f' }}>*</span>
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Rue Example, 75001 Paris"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-sm"
                style={{ '--tw-ring-color': '#41005c' } as React.CSSProperties}
                aria-required="true"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Notes complémentaires <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              id="notes"
              value={educatorNotes}
              onChange={(e) => setEducatorNotes(e.target.value)}
              rows={3}
              placeholder="Ajoutez des informations supplémentaires pour la famille..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-sm resize-none"
              style={{ '--tw-ring-color': '#41005c' } as React.CSSProperties}
            />
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={submitting || selectedSlots.length === 0}
            className="w-full py-3.5 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: '#41005c' }}
          >
            {submitting ? 'Envoi en cours...' : 'Proposer le rendez-vous'}
          </button>
        </form>
      </div>

      {/* Toast d'erreur */}
      {error && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-slide-up">
          <div className="text-white px-5 py-4 rounded-xl shadow-2xl" style={{ backgroundColor: '#f0879f' }} role="alert">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="flex-shrink-0 text-white/80 hover:text-white transition"
                aria-label="Fermer le message d'erreur"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
