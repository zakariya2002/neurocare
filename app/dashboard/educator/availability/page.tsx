'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import EducatorNavbar from '@/components/EducatorNavbar';

interface TimeSlot {
  id: string;
  availability_date: string; // Format: "2025-11-25"
  start_time: string; // Format: "09:00"
  end_time: string; // Format: "17:00"
  is_available: boolean;
}

interface WeeklySchedule {
  [key: number]: { enabled: boolean; start: string; end: string };
}

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lundi', short: 'Lun' },
  { id: 2, name: 'Mardi', short: 'Mar' },
  { id: 3, name: 'Mercredi', short: 'Mer' },
  { id: 4, name: 'Jeudi', short: 'Jeu' },
  { id: 5, name: 'Vendredi', short: 'Ven' },
  { id: 6, name: 'Samedi', short: 'Sam' },
  { id: 0, name: 'Dimanche', short: 'Dim' },
];

export default function EducatorAvailability() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Form state - ajout individuel
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // Form state - planning hebdomadaire
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    1: { enabled: true, start: '09:00', end: '17:00' },  // Lundi
    2: { enabled: true, start: '09:00', end: '17:00' },  // Mardi
    3: { enabled: true, start: '09:00', end: '17:00' },  // Mercredi
    4: { enabled: true, start: '09:00', end: '17:00' },  // Jeudi
    5: { enabled: true, start: '09:00', end: '17:00' },  // Vendredi
    6: { enabled: false, start: '09:00', end: '17:00' }, // Samedi
    0: { enabled: false, start: '09:00', end: '17:00' }, // Dimanche
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [savingWeekly, setSavingWeekly] = useState(false);

  useEffect(() => {
    fetchData();
    // Initialiser la date au lendemain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    // Récupérer le profil éducateur
    const { data: profileData } = await supabase
      .from('educator_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);

      // Récupérer l'abonnement
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('educator_id', profileData.id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle();

      setSubscription(subscriptionData);

      // Récupérer les disponibilités (seulement futures)
      const today = new Date().toISOString().split('T')[0];
      const { data: availData } = await supabase
        .from('educator_availability')
        .select('*')
        .eq('educator_id', profileData.id)
        .gte('availability_date', today)
        .order('availability_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (availData) {
        // Filtrer les créneaux d'aujourd'hui dont l'heure de fin est passée
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // Format "HH:MM"

        const filteredData = availData.filter(slot => {
          if (slot.availability_date === today) {
            // Pour aujourd'hui, vérifier que l'heure de fin n'est pas passée
            return slot.end_time > currentTime;
          }
          return true; // Les dates futures sont toujours gardées
        });

        setAvailabilities(filteredData);
      }
    }

    setLoading(false);
  };

  const handleAddAvailability = async () => {
    if (!profile) return;

    // Validation
    if (!selectedDate) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une date' });
      return;
    }

    if (startTime >= endTime) {
      setMessage({ type: 'error', text: 'L\'heure de fin doit être après l\'heure de début' });
      return;
    }

    // Vérifier que la date est dans le futur
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate < today) {
      setMessage({ type: 'error', text: 'Vous ne pouvez pas ajouter une disponibilité dans le passé' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('educator_availability')
        .insert({
          educator_id: profile.id,
          availability_date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          is_available: true,
        })
        .select()
        .single();

      if (error) throw error;

      setAvailabilities([...availabilities, data].sort((a, b) => {
        if (a.availability_date !== b.availability_date) {
          return a.availability_date.localeCompare(b.availability_date);
        }
        return a.start_time.localeCompare(b.start_time);
      }));

      setMessage({ type: 'success', text: 'Disponibilité ajoutée avec succès' });

      // Incrémenter la date d'un jour pour faciliter l'ajout de plusieurs jours
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      setSelectedDate(nextDate.toISOString().split('T')[0]);
    } catch (error: any) {
      console.error('Erreur ajout disponibilité:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout de la disponibilité' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) return;

    try {
      const { error } = await supabase
        .from('educator_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAvailabilities(availabilities.filter(a => a.id !== id));
      setMessage({ type: 'success', text: 'Disponibilité supprimée' });
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot.id);
    setEditStartTime(slot.start_time);
    setEditEndTime(slot.end_time);
  };

  const handleSaveEdit = async (id: string) => {
    if (editStartTime >= editEndTime) {
      setMessage({ type: 'error', text: "L'heure de fin doit être après l'heure de début" });
      return;
    }

    try {
      const { error } = await supabase
        .from('educator_availability')
        .update({ start_time: editStartTime, end_time: editEndTime })
        .eq('id', id);

      if (error) throw error;

      setAvailabilities(availabilities.map(a =>
        a.id === id ? { ...a, start_time: editStartTime, end_time: editEndTime } : a
      ));
      setEditingSlot(null);
      setMessage({ type: 'success', text: 'Créneau modifié avec succès' });
    } catch (error: any) {
      console.error('Erreur modification:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la modification' });
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('educator_availability')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setAvailabilities(availabilities.map(a =>
        a.id === id ? { ...a, is_available: !currentStatus } : a
      ));
      setMessage({ type: 'success', text: 'Statut modifié' });
    } catch (error: any) {
      console.error('Erreur toggle:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la modification' });
    }
  };

  // Générer les dates d'un mois pour un jour de semaine donné
  const getDatesForDayOfWeek = (year: number, month: number, dayOfWeek: number): string[] => {
    const dates: string[] = [];
    const date = new Date(year, month, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (date.getMonth() === month) {
      if (date.getDay() === dayOfWeek && date >= today) {
        dates.push(date.toISOString().split('T')[0]);
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  // Appliquer le planning hebdomadaire au mois sélectionné
  const handleApplyWeeklySchedule = async () => {
    if (!profile) return;

    const enabledDays = Object.entries(weeklySchedule).filter(([_, config]) => config.enabled);
    if (enabledDays.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un jour' });
      return;
    }

    setSavingWeekly(true);
    setMessage(null);

    try {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed

      const newAvailabilities: {
        educator_id: string;
        availability_date: string;
        start_time: string;
        end_time: string;
        is_available: boolean;
      }[] = [];

      // Pour chaque jour activé
      for (const [dayId, config] of enabledDays) {
        const dayOfWeek = parseInt(dayId);
        const dates = getDatesForDayOfWeek(year, month, dayOfWeek);

        for (const date of dates) {
          // Vérifier si une disponibilité existe déjà pour cette date
          const existingAvail = availabilities.find(a => a.availability_date === date);
          if (!existingAvail) {
            newAvailabilities.push({
              educator_id: profile.id,
              availability_date: date,
              start_time: config.start,
              end_time: config.end,
              is_available: true,
            });
          }
        }
      }

      if (newAvailabilities.length === 0) {
        setMessage({ type: 'error', text: 'Toutes les dates sont déjà configurées pour ce mois' });
        setSavingWeekly(false);
        return;
      }

      const { data, error } = await supabase
        .from('educator_availability')
        .insert(newAvailabilities)
        .select();

      if (error) throw error;

      // Rafraîchir les données
      await fetchData();
      setMessage({ type: 'success', text: `${newAvailabilities.length} créneaux ajoutés avec succès !` });
      setShowWeeklyForm(false);
    } catch (error: any) {
      console.error('Erreur planning hebdomadaire:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'application du planning' });
    } finally {
      setSavingWeekly(false);
    }
  };

  // Calendar helpers
  const getCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];
    // Leading empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  };

  const getDateStr = (day: number) => {
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getSlotsForDate = (dateStr: string) => {
    return groupedAvailabilities[dateStr] || [];
  };

  const calendarMonthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(calendarYear, calendarMonth)
  );

  const navigateCalendar = (direction: -1 | 1) => {
    const newDate = new Date(calendarYear, calendarMonth + direction);
    setCalendarMonth(newDate.getMonth());
    setCalendarYear(newDate.getFullYear());
    setSelectedCalendarDate(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const isPremium = subscription && ['active', 'trialing'].includes(subscription.status);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Grouper par date
  const groupedAvailabilities = availabilities.reduce((acc, slot) => {
    if (!acc[slot.availability_date]) {
      acc[slot.availability_date] = [];
    }
    acc[slot.availability_date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

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

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40">
        <EducatorNavbar profile={profile} subscription={subscription} />
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 pb-24 sm:pb-8 w-full">
        {/* En-tête avec flèche retour */}
        <div className="mb-3 sm:mb-5 md:mb-8">
          {/* Flèche retour - desktop uniquement */}
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
              <img src="/images/icons/clock.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">Mes disponibilités</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mt-1 px-2">Ajoutez vos créneaux pour que les familles puissent réserver</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
            role="alert"
            aria-live="polite"
          >
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 md:mb-6 border border-gray-100">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3 md:mb-4" style={{ color: '#41005c' }}>
            Ajouter une disponibilité
          </h2>

          <div className="space-y-2 sm:space-y-3 mb-2 sm:mb-3 md:mb-4">
            {/* Date - pleine largeur sur mobile */}
            <div>
              <label htmlFor="availability-date" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                Date
              </label>
              <input
                id="availability-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-sm"
                style={{ '--tw-ring-color': '#41005c', fontSize: '16px' } as React.CSSProperties}
                aria-required="true"
                aria-describedby="date-description"
              />
              <span id="date-description" className="sr-only">
                Sélectionnez une date pour votre disponibilité. Seules les dates futures sont autorisées.
              </span>
            </div>

            {/* Heures côte à côte */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label htmlFor="availability-start-time" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Début
                </label>
                <input
                  id="availability-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-sm text-center"
                  style={{ '--tw-ring-color': '#41005c', fontSize: '16px' } as React.CSSProperties}
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="availability-end-time" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Fin
                </label>
                <input
                  id="availability-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-sm text-center"
                  style={{ '--tw-ring-color': '#41005c', fontSize: '16px' } as React.CSSProperties}
                  aria-required="true"
                  aria-describedby="time-description"
                />
                <span id="time-description" className="sr-only">
                  L'heure de fin doit être postérieure à l'heure de début.
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddAvailability}
            disabled={saving}
            className="w-full text-white py-2 md:py-2.5 px-3 md:px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:opacity-90 text-xs sm:text-sm"
            style={{ backgroundColor: '#41005c' }}
            aria-label="Ajouter une nouvelle disponibilité"
            aria-busy={saving}
          >
            {saving ? 'Ajout en cours...' : '+ Ajouter ce créneau'}
          </button>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Bouton planning hebdomadaire */}
          <button
            onClick={() => setShowWeeklyForm(!showWeeklyForm)}
            className="w-full py-2 md:py-2.5 px-3 md:px-4 rounded-xl transition font-medium text-xs sm:text-sm border-2 hover:opacity-90"
            style={{
              borderColor: '#41005c',
              color: '#41005c',
              backgroundColor: showWeeklyForm ? '#faf5ff' : 'transparent'
            }}
          >
            {showWeeklyForm ? 'Masquer le planning hebdomadaire' : 'Configurer un planning hebdomadaire'}
          </button>
        </div>

        {/* Formulaire planning hebdomadaire */}
        {showWeeklyForm && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 md:mb-6 border border-gray-100">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3 md:mb-4" style={{ color: '#41005c' }}>
              Planning hebdomadaire
            </h2>
            <p className="text-[11px] md:text-xs text-gray-500 mb-3 md:mb-4">
              Configurez vos horaires par jour de la semaine et appliquez-les à tout un mois.
            </p>

            {/* Sélecteur de mois */}
            <div className="mb-3 md:mb-4">
              <label htmlFor="month-selector" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                Mois à configurer
              </label>
              <input
                id="month-selector"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                className="w-full px-2.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-sm"
                style={{ '--tw-ring-color': '#41005c', fontSize: '16px' } as React.CSSProperties}
              />
            </div>

            {/* Configuration par jour */}
            <div className="space-y-2 sm:space-y-3 mb-3 md:mb-4">
              {DAYS_OF_WEEK.map(day => (
                <div
                  key={day.id}
                  className="p-3 rounded-xl border transition"
                  style={{
                    borderColor: weeklySchedule[day.id].enabled ? '#d8b4fe' : '#e5e7eb',
                    backgroundColor: weeklySchedule[day.id].enabled ? '#faf5ff' : '#f9fafb'
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox jour */}
                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={weeklySchedule[day.id].enabled}
                        onChange={(e) => setWeeklySchedule(prev => ({
                          ...prev,
                          [day.id]: { ...prev[day.id], enabled: e.target.checked }
                        }))}
                        className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                        style={{ accentColor: '#41005c' }}
                      />
                      <span className={`text-xs sm:text-sm font-medium ${weeklySchedule[day.id].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                        <span className="sm:hidden">{day.short}</span>
                        <span className="hidden sm:inline">{day.name}</span>
                      </span>
                    </label>

                    {/* Horaires */}
                    {weeklySchedule[day.id].enabled && (
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <input
                          type="time"
                          value={weeklySchedule[day.id].start}
                          onChange={(e) => setWeeklySchedule(prev => ({
                            ...prev,
                            [day.id]: { ...prev[day.id], start: e.target.value }
                          }))}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm text-center w-20 sm:w-24"
                          style={{ '--tw-ring-color': '#41005c', fontSize: '16px' } as React.CSSProperties}
                        />
                        <span className="text-gray-400 text-xs">à</span>
                        <input
                          type="time"
                          value={weeklySchedule[day.id].end}
                          onChange={(e) => setWeeklySchedule(prev => ({
                            ...prev,
                            [day.id]: { ...prev[day.id], end: e.target.value }
                          }))}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-xs sm:text-sm text-center w-20 sm:w-24"
                          style={{ '--tw-ring-color': '#41005c', fontSize: '16px' } as React.CSSProperties}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton appliquer */}
            <button
              onClick={handleApplyWeeklySchedule}
              disabled={savingWeekly}
              className="w-full text-white py-2 md:py-2.5 px-3 md:px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:opacity-90 text-xs sm:text-sm"
              style={{ backgroundColor: '#027e7e' }}
              aria-busy={savingWeekly}
            >
              {savingWeekly ? 'Application en cours...' : 'Appliquer au mois sélectionné'}
            </button>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
          <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 text-center border border-gray-100 shadow-sm">
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#41005c' }}>{availabilities.length}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Créneaux à venir</p>
          </div>
          <div className="bg-white rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 text-center border border-gray-100 shadow-sm">
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#41005c' }}>{availabilities.filter(a => a.is_available).length}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Disponibles</p>
          </div>
        </div>

        {/* Liste des disponibilités */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* En-tête de section */}
          <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-100" style={{ backgroundColor: '#faf5ff' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#41005c' }}>
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Vos créneaux à venir</h2>
                <p className="text-[11px] md:text-xs text-gray-500">{availabilities.length} créneau{availabilities.length > 1 ? 'x' : ''} programmé{availabilities.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-5">
            {availabilities.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#f3e8ff' }}>
                  <svg
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    style={{ color: '#41005c' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-900">Aucune disponibilité</h3>
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                  Ajoutez vos premiers créneaux ci-dessus
                </p>
              </div>
            ) : (
              <div>
                {/* Calendar navigation */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <button
                    onClick={() => navigateCalendar(-1)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                    aria-label="Mois précédent"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold capitalize" style={{ color: '#41005c' }}>
                    {calendarMonthLabel}
                  </h3>
                  <button
                    onClick={() => navigateCalendar(1)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                    aria-label="Mois suivant"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 mb-1">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-gray-400 py-1 sm:py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                  {getCalendarDays().map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="bg-white min-h-[40px] sm:min-h-[52px] md:min-h-[60px]" />;
                    }
                    const dateStr = getDateStr(day);
                    const slots = getSlotsForDate(dateStr);
                    const hasSlots = slots.length > 0;
                    const allAvailable = hasSlots && slots.every(s => s.is_available);
                    const someDisabled = hasSlots && slots.some(s => !s.is_available);
                    const isToday = dateStr === todayStr;
                    const isPast = dateStr < todayStr;
                    const isSelected = dateStr === selectedCalendarDate;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => hasSlots ? setSelectedCalendarDate(isSelected ? null : dateStr) : undefined}
                        className={`bg-white min-h-[40px] sm:min-h-[52px] md:min-h-[60px] flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition relative ${
                          hasSlots ? 'cursor-pointer hover:bg-purple-50' : 'cursor-default'
                        } ${isSelected ? 'ring-2 ring-inset z-10' : ''} ${isPast ? 'opacity-40' : ''}`}
                        style={isSelected ? { '--tw-ring-color': '#41005c' } as React.CSSProperties : undefined}
                        disabled={!hasSlots}
                        aria-label={`${day} - ${slots.length} créneau${slots.length > 1 ? 'x' : ''}`}
                      >
                        <span className={`text-xs sm:text-sm font-medium ${
                          isToday ? 'text-white' : isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {isToday ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full" style={{ backgroundColor: '#41005c' }}>
                              {day}
                            </span>
                          ) : day}
                        </span>
                        {hasSlots && (
                          <div className="flex items-center gap-0.5">
                            {slots.length <= 3 ? (
                              slots.map((s, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                                  style={{ backgroundColor: s.is_available ? '#41005c' : '#d1d5db' }}
                                />
                              ))
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: allAvailable ? '#41005c' : someDisabled ? '#d8b4fe' : '#d1d5db' }} />
                                <span className="text-[8px] sm:text-[10px] font-medium" style={{ color: '#41005c' }}>{slots.length}</span>
                              </>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#41005c' }} />
                    <span className="text-[10px] sm:text-xs text-gray-500">Disponible</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-[10px] sm:text-xs text-gray-500">Désactivé</span>
                  </div>
                </div>

                {/* Selected date detail */}
                {selectedCalendarDate && getSlotsForDate(selectedCalendarDate).length > 0 && (
                  <div className="mt-3 sm:mt-4 border-t border-gray-100 pt-3 sm:pt-4">
                    <h4 className="text-xs sm:text-sm font-semibold mb-2 capitalize" style={{ color: '#41005c' }}>
                      {formatDate(selectedCalendarDate)}
                    </h4>
                    <div className="space-y-2">
                      {getSlotsForDate(selectedCalendarDate).map(slot => (
                        <div
                          key={slot.id}
                          className="p-2.5 sm:p-3 rounded-xl border transition"
                          style={{
                            borderColor: slot.is_available ? '#d8b4fe' : '#e5e7eb',
                            backgroundColor: slot.is_available ? '#faf5ff' : '#f9fafb'
                          }}
                        >
                          {editingSlot === slot.id ? (
                            /* Mode édition */
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={editStartTime}
                                  onChange={(e) => setEditStartTime(e.target.value)}
                                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm text-center focus:outline-none focus:ring-2"
                                  style={{ '--tw-ring-color': '#41005c', fontSize: '16px' } as React.CSSProperties}
                                />
                                <span className="text-gray-400 text-xs">à</span>
                                <input
                                  type="time"
                                  value={editEndTime}
                                  onChange={(e) => setEditEndTime(e.target.value)}
                                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs sm:text-sm text-center focus:outline-none focus:ring-2"
                                  style={{ '--tw-ring-color': '#41005c', fontSize: '16px' } as React.CSSProperties}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSaveEdit(slot.id)}
                                  className="flex-1 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-white transition hover:opacity-90"
                                  style={{ backgroundColor: '#41005c' }}
                                >
                                  Enregistrer
                                </button>
                                <button
                                  onClick={() => setEditingSlot(null)}
                                  className="flex-1 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100 transition hover:bg-gray-200"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Mode affichage */
                            <>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div
                                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: slot.is_available ? '#41005c' : '#9ca3af' }}
                                  />
                                  <div>
                                    <p className="font-medium text-gray-900 text-xs sm:text-sm">
                                      {slot.start_time} - {slot.end_time}
                                    </p>
                                    <p className="text-[10px] sm:text-xs" style={{ color: slot.is_available ? '#7c3aed' : '#6b7280' }}>
                                      {slot.is_available ? 'Disponible' : 'Désactivé'}
                                    </p>
                                  </div>
                                </div>

                                {/* Actions desktop */}
                                <div className="hidden sm:flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditSlot(slot)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-90"
                                    style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => handleToggleAvailability(slot.id, slot.is_available)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-90"
                                    style={{
                                      backgroundColor: slot.is_available ? '#fef3c7' : '#f3e8ff',
                                      color: slot.is_available ? '#92400e' : '#41005c'
                                    }}
                                  >
                                    {slot.is_available ? 'Désactiver' : 'Activer'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAvailability(slot.id)}
                                    className="p-1.5 rounded-lg transition"
                                    style={{ color: '#f0879f', backgroundColor: '#fdf2f4' }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Actions mobile */}
                              <div className="sm:hidden flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                <button
                                  onClick={() => handleEditSlot(slot)}
                                  className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition hover:opacity-90"
                                  style={{ backgroundColor: '#f3e8ff', color: '#41005c' }}
                                >
                                  Modifier
                                </button>
                                <button
                                  onClick={() => handleToggleAvailability(slot.id, slot.is_available)}
                                  className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition hover:opacity-90"
                                  style={{
                                    backgroundColor: slot.is_available ? '#fef3c7' : '#f3e8ff',
                                    color: slot.is_available ? '#92400e' : '#41005c'
                                  }}
                                >
                                  {slot.is_available ? 'Désactiver' : 'Activer'}
                                </button>
                                <button
                                  onClick={() => handleDeleteAvailability(slot.id)}
                                  className="px-2 py-1.5 rounded-lg transition text-[10px] font-medium"
                                  style={{ color: '#f0879f', backgroundColor: '#fdf2f4' }}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
