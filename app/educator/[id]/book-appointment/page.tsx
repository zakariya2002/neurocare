'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PublicNavbar from '@/components/PublicNavbar';
import AddressAutocomplete from '@/components/AddressAutocomplete';

interface Educator {
  id: string;
  first_name: string;
  last_name: string;
  hourly_rate: number | null;
  cabinet_address: string | null;
}

interface WorkLocation {
  id: string;
  name: string;
  address: string | null;
  location_type: string;
}

interface DailyAvailability {
  id: string;
  availability_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Appointment {
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface ChildProfile {
  id: string;
  first_name: string;
  age: number | null;
  support_level_needed: string | null;
}

interface TimeSlot {
  start: string;
  end: string;
  availabilityId: string;
}

export default function BookAppointmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [educator, setEducator] = useState<Educator | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<DailyAvailability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const [officeLocations, setOfficeLocations] = useState<WorkLocation[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [locationType, setLocationType] = useState<'home' | 'office' | 'online'>('online');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [familyNotes, setFamilyNotes] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (familyId) {
      fetchEducatorData();
    }
  }, [familyId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push(`/auth/login?redirect=/educator/${params.id}/book-appointment`);
      return;
    }

    const { data: familyProfile } = await supabase
      .from('family_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!familyProfile) {
      setError('Seules les familles peuvent demander des rendez-vous');
      setLoading(false);
      return;
    }

    setFamilyId(familyProfile.id);

    // Parallelize block check and children fetch
    const [blockCheckResult, childrenResult] = await Promise.all([
      fetch(`/api/check-blocked?educatorId=${params.id}&familyId=${familyProfile.id}`)
        .then(async (response) => {
          if (response.ok) {
            return response.json();
          }
          return null;
        })
        .catch((e) => {
          console.error('Erreur vérification blocage:', e);
          return null;
        }),
      supabase
        .from('child_profiles')
        .select('id, first_name, age, support_level_needed')
        .eq('family_id', familyProfile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
    ]);

    if (blockCheckResult?.isBlocked) {
      setError('Vous ne pouvez pas réserver de rendez-vous avec ce professionnel');
      setLoading(false);
      return;
    }

    const childrenData = childrenResult.data;

    if (childrenData && childrenData.length > 0) {
      setChildren(childrenData);
      if (childrenData.length === 1) {
        setSelectedChildId(childrenData[0].id);
      }
    }
  };

  const fetchEducatorData = async () => {
    try {
      const { data: educatorData, error: educatorError } = await supabase
        .from('public_educator_profiles')
        .select('id, first_name, last_name, hourly_rate, cabinet_address')
        .eq('id', params.id)
        .single();

      if (educatorError) throw educatorError;
      setEducator(educatorData);

      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().slice(0, 5); // Format "HH:MM"

      // Parallelize availability, appointments, and work locations fetch
      const [availResult, apptsResult, locResult] = await Promise.all([
        supabase
          .from('educator_availability')
          .select('*')
          .eq('educator_id', params.id)
          .eq('is_available', true)
          .gte('availability_date', today)
          .order('availability_date', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('appointments')
          .select('appointment_date, start_time, end_time, status')
          .eq('educator_id', params.id)
          .in('status', ['accepted', 'in_progress'])
          .gte('appointment_date', today),
        supabase
          .from('educator_work_locations')
          .select('id, name, address, location_type')
          .eq('educator_id', params.id)
          .eq('is_active', true)
          .eq('location_type', 'office'),
      ]);

      if (locResult.data && locResult.data.length > 0) {
        setOfficeLocations(locResult.data);
        setSelectedOfficeId(locResult.data.find((l: WorkLocation) => l.address)?.id || locResult.data[0].id);
      }

      if (availResult.data) {
        // Filtrer les créneaux d'aujourd'hui dont l'heure de fin est passée
        const filteredData = availResult.data.filter(slot => {
          if (slot.availability_date === today) {
            return slot.end_time > currentTime;
          }
          return true;
        });
        setAvailabilities(filteredData);
      }

      if (apptsResult.data) setAppointments(apptsResult.data);

      setLoading(false);
    } catch (err: any) {
      console.error('Erreur chargement:', err);
      setError('Erreur lors du chargement des données');
      setLoading(false);
    }
  };

  // Obtenir les dates avec disponibilités (vérifie s'il reste des créneaux libres)
  const getAvailableDatesSet = () => {
    const dates = new Set<string>();
    // Pour chaque date unique dans les disponibilités
    const uniqueDates = [...new Set(availabilities.map(a => a.availability_date))];

    uniqueDates.forEach(date => {
      // Vérifier s'il reste au moins un créneau d'1h disponible pour cette date
      const slotsForDate = getAvailableHourSlotsForDate(date);
      if (slotsForDate.length > 0) {
        dates.add(date);
      }
    });
    return dates;
  };

  // Calculer les créneaux d'1h disponibles pour une date (sans les rendez-vous)
  const getAvailableHourSlotsForDate = (date: string): string[] => {
    const dayAvail = availabilities.filter(a => a.availability_date === date);
    const availableSlots: string[] = [];

    dayAvail.forEach(avail => {
      const [startHour, startMin] = avail.start_time.split(':').map(Number);
      const [endHour, endMin] = avail.end_time.split(':').map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        const nextHour = currentHour + 1;
        const slotEnd = `${String(nextHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

        // Vérifier que le créneau ne dépasse pas la fin de disponibilité
        const slotEndMinutes = timeToMinutes(slotEnd);
        const availEndMinutes = timeToMinutes(avail.end_time);
        if (slotEndMinutes > availEndMinutes) break;

        // Vérifier si ce créneau de 1h n'est pas réservé
        const isBooked = appointments.some(appt => {
          if (appt.appointment_date !== date) return false;
          const apptStart = timeToMinutes(appt.start_time);
          const apptEnd = timeToMinutes(appt.end_time);
          const slStart = timeToMinutes(slotStart);
          const slEnd = timeToMinutes(slotEnd);
          return (slStart < apptEnd && slEnd > apptStart);
        });

        if (!isBooked) {
          availableSlots.push(slotStart);
        }

        currentHour = nextHour;
      }
    });

    return availableSlots;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Générer les créneaux de 1 heure pour une date
  const getTimeSlotsForDate = (date: string): TimeSlot[] => {
    const dayAvail = availabilities.filter(a => a.availability_date === date);
    const slots: TimeSlot[] = [];

    dayAvail.forEach(avail => {
      const [startHour, startMin] = avail.start_time.split(':').map(Number);
      const [endHour, endMin] = avail.end_time.split(':').map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

        let nextHour = currentHour + 1;
        let nextMin = currentMin;
        const slotEnd = `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`;

        // Vérifier que le créneau ne dépasse pas la fin de disponibilité
        const slotEndMinutes = timeToMinutes(slotEnd);
        const availEndMinutes = timeToMinutes(avail.end_time);
        if (slotEndMinutes > availEndMinutes) break;

        // Vérifier si ce créneau de 1h n'est pas réservé
        const isBooked = appointments.some(appt => {
          if (appt.appointment_date !== date) return false;
          const apptStart = timeToMinutes(appt.start_time);
          const apptEnd = timeToMinutes(appt.end_time);
          const slStart = timeToMinutes(slotStart);
          const slEnd = timeToMinutes(slotEnd);
          return (slStart < apptEnd && slEnd > apptStart);
        });

        if (!isBooked) {
          slots.push({ start: slotStart, end: slotEnd, availabilityId: avail.id });
        }

        currentHour = nextHour;
      }
    });

    return slots.sort((a, b) => a.start.localeCompare(b.start));
  };

  // Calendrier
  const generateCalendarDays = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
    return days;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const availableDates = getAvailableDatesSet();

    if (!availableDates.has(dateStr)) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    setSelectedDate(dateStr);
    setSelectedSlots([]);
  };

  const toggleSlotSelection = (slotStart: string, availableSlots: TimeSlot[]) => {
    setSelectedSlots(prev => {
      // Si on clique sur un créneau déjà sélectionné, tout désélectionner
      if (prev.includes(slotStart)) {
        return [];
      }

      // Si aucun créneau sélectionné, sélectionner celui-ci
      if (prev.length === 0) {
        return [slotStart];
      }

      // Sinon, sélectionner tous les créneaux entre le premier et le nouveau (exclusif)
      const allSlotStarts = availableSlots.map(s => s.start).sort();
      const firstSelected = prev[0];
      const clickedSlot = slotStart;

      // Déterminer le début et la fin de la plage
      const startSlot = firstSelected < clickedSlot ? firstSelected : clickedSlot;
      const endSlot = firstSelected < clickedSlot ? clickedSlot : firstSelected;

      // Sélectionner tous les créneaux de startSlot jusqu'à endSlot (inclus)
      const slotsInRange = allSlotStarts.filter(s => s >= startSlot && s <= endSlot);

      return slotsInRange;
    });
  };

  const calculateTotalDuration = (): number => {
    return selectedSlots.length * 60;
  };

  const calculateTotalPrice = (): number => {
    const durationHours = calculateTotalDuration() / 60;
    return durationHours * (educator?.hourly_rate || 50);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || selectedSlots.length === 0) {
      setError('Veuillez sélectionner une date et au moins un créneau');
      return;
    }

    if (!familyId) {
      setError('Erreur d\'authentification');
      return;
    }

    if (children.length > 0 && !selectedChildId) {
      setError('Veuillez sélectionner l\'enfant concerné par ce rendez-vous');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Trouver l'heure de début et de fin à partir des créneaux sélectionnés
      const sortedSlots = [...selectedSlots].sort();
      const startTime = sortedSlots[0];

      // Calculer l'heure de fin (dernier créneau + 1h)
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      const [lastH, lastM] = lastSlot.split(':').map(Number);
      const endH = lastH + 1;
      const endTime = `${String(endH).padStart(2, '0')}:${String(lastM).padStart(2, '0')}`;

      const price = calculateTotalPrice();

      const response = await fetch('/api/appointments/create-with-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          educatorId: params.id,
          familyId,
          childId: selectedChildId,
          appointmentDate: selectedDate,
          startTime,
          endTime,
          locationType,
          address: locationType === 'home'
            ? address
            : locationType === 'office'
              ? (officeLocations.length > 0
                  ? (officeLocations.find(l => l.id === selectedOfficeId)?.address || officeLocations[0].address)
                  : educator?.cabinet_address)
              : null,
          familyNotes,
          price
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors de la création du rendez-vous');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="animate-spin h-12 w-12 border-4 border-t-transparent rounded-full" style={{ borderColor: '#027e7e', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  const availableDatesSet = getAvailableDatesSet();
  const calendarDays = generateCalendarDays();
  const timeSlotsForSelectedDate = selectedDate ? getTimeSlotsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 xl:pt-24 pb-6 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/educator/${params.id}`}
            className="font-medium flex items-center gap-2 mb-4 hover:opacity-80 transition"
            style={{ color: '#027e7e' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au profil
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Réserver un rendez-vous
          </h1>
          {educator && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Avec {educator.first_name} {educator.last_name}
              </p>
              {educator.hourly_rate && (
                <span
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white font-bold text-lg shadow-md"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {educator.hourly_rate}€/h
                </span>
              )}
            </div>
          )}
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {availableDatesSet.size === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center border border-gray-100">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
              Aucune disponibilité configurée
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Cet éducateur n&apos;a pas encore défini ses disponibilités.
            </p>
            <Link
              href="/messages"
              className="inline-block text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium"
              style={{ backgroundColor: '#027e7e' }}
            >
              Contactez-le directement par message
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection de l'enfant */}
            {children.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  1. Sélectionnez l'enfant concerné <span className="text-red-600" aria-label="requis">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setSelectedChildId(child.id)}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        selectedChildId === child.id
                          ? 'border-gray-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={selectedChildId === child.id ? { borderColor: '#027e7e', backgroundColor: 'rgba(2, 126, 126, 0.05)' } : {}}
                      aria-pressed={selectedChildId === child.id}
                      aria-label={`Sélectionner ${child.first_name} pour le rendez-vous`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
                          <span className="text-sm font-semibold" style={{ color: '#027e7e' }}>
                            {child.first_name[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{child.first_name}</p>
                          <p className="text-sm text-gray-600">
                            {child.age && `${child.age} ans`}
                            {child.age && child.support_level_needed && ' • '}
                            {child.support_level_needed && (
                              child.support_level_needed === 'level_1' ? 'Niveau 1' :
                              child.support_level_needed === 'level_2' ? 'Niveau 2' : 'Niveau 3'
                            )}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendrier et créneaux fusionnés */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-4 sm:p-6">
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  {children.length > 0 ? '2.' : '1.'} Choisissez une date et vos créneaux <span className="text-red-600" aria-label="requis">*</span>
                </label>

                {/* Calendrier */}
                <div className="border-2 rounded-xl overflow-hidden" style={{ borderColor: 'rgba(2, 126, 126, 0.3)' }}>
                  {/* En-tête du calendrier */}
                  <div className="px-4 py-3" style={{ backgroundColor: '#027e7e' }}>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                        aria-label="Mois précédent"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                        aria-label="Mois suivant"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    {/* Jours de la semaine */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((day) => (
                        <div key={day} className="text-center text-xs font-bold py-2" style={{ color: '#027e7e' }}>
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grille du calendrier */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((date, index) => {
                        if (!date) {
                          return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const dateStr = date.toISOString().split('T')[0];
                        const isAvailable = availableDatesSet.has(dateStr);
                        const isSelected = selectedDate === dateStr;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isPast = date < today;
                        const isToday = date.toDateString() === today.toDateString();

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDateClick(date)}
                            disabled={!isAvailable || isPast}
                            aria-label={`${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}${isSelected ? ', sélectionné' : ''}${isAvailable && !isPast ? ', disponible' : ', non disponible'}`}
                            aria-pressed={isSelected}
                            className={`
                              aspect-square p-1 rounded-lg text-xs sm:text-sm font-semibold transition-all relative
                              ${isSelected
                                ? 'text-white shadow-lg'
                                : isAvailable && !isPast
                                ? 'border-2 hover:scale-105'
                                : isToday && !isAvailable
                                ? 'bg-gray-100 text-gray-400'
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                              }
                            `}
                            style={
                              isSelected
                                ? { backgroundColor: '#027e7e', boxShadow: '0 0 0 2px rgba(2, 126, 126, 0.3)' }
                                : isAvailable && !isPast
                                ? { backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: 'rgba(2, 126, 126, 0.4)', color: '#027e7e' }
                                : {}
                            }
                          >
                            {date.getDate()}
                            {isAvailable && !isPast && !isSelected && (
                              <span className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: '#027e7e' }}></span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Légende */}
                    <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap justify-center gap-3 sm:gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#027e7e' }}></div>
                        <span className="text-gray-700">Sélectionné</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: 'rgba(2, 126, 126, 0.4)' }}></div>
                        <span className="text-gray-700">Disponible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-50"></div>
                        <span className="text-gray-700">Non disponible</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Créneaux horaires pour la date sélectionnée */}
              {selectedDate && (
                <div className="border-t border-gray-200 p-4 sm:p-6" style={{ backgroundColor: '#fdf9f4' }}>
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                      Créneaux disponibles le {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Sélectionnez les créneaux souhaités
                    </p>
                  </div>

                  {timeSlotsForSelectedDate.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun créneau disponible pour cette date.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {timeSlotsForSelectedDate.map((slot) => {
                          const isSelected = selectedSlots.includes(slot.start);
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => toggleSlotSelection(slot.start, timeSlotsForSelectedDate)}
                              aria-label={`Créneau de ${slot.start} à ${slot.end}${isSelected ? ', sélectionné' : ''}`}
                              aria-pressed={isSelected}
                              className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                isSelected
                                  ? 'text-white shadow-md'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                              style={isSelected ? { backgroundColor: '#027e7e' } : {}}
                            >
                              {slot.start}
                            </button>
                          );
                        })}
                      </div>

                      {/* Résumé de la sélection */}
                      {selectedSlots.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', borderColor: 'rgba(2, 126, 126, 0.2)' }}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#027e7e' }}>
                                {selectedSlots.length} créneau{selectedSlots.length > 1 ? 'x' : ''} sélectionné{selectedSlots.length > 1 ? 's' : ''}
                              </p>
                              <p className="text-xs" style={{ color: '#3a9e9e' }}>
                                De {selectedSlots[0]} à {(() => {
                                  const last = selectedSlots[selectedSlots.length - 1];
                                  const [h, m] = last.split(':').map(Number);
                                  const nh = h + 1;
                                  return `${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                                })()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {formatDuration(calculateTotalDuration())}
                              </p>
                              <p className="text-xl font-bold" style={{ color: '#027e7e' }}>
                                {calculateTotalPrice().toFixed(2)}€
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Type de rendez-vous et reste du formulaire */}
            {selectedSlots.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6 border border-gray-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    {children.length > 0 ? '3.' : '2.'} Type de rendez-vous <span className="text-red-600" aria-label="requis">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setLocationType('online')}
                      className={`p-4 rounded-lg border-2 transition ${
                        locationType === 'online'
                          ? 'border-gray-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={locationType === 'online' ? { borderColor: '#027e7e', backgroundColor: 'rgba(2, 126, 126, 0.05)' } : {}}
                      aria-pressed={locationType === 'online'}
                      aria-label="Rendez-vous en ligne par visioconférence"
                    >
                      <p className="font-semibold text-gray-900">En ligne</p>
                      <p className="text-xs text-gray-600 mt-1">Visioconférence</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationType('home')}
                      className={`p-4 rounded-lg border-2 transition ${
                        locationType === 'home'
                          ? 'border-gray-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={locationType === 'home' ? { borderColor: '#027e7e', backgroundColor: 'rgba(2, 126, 126, 0.05)' } : {}}
                      aria-pressed={locationType === 'home'}
                      aria-label="Rendez-vous à domicile chez vous"
                    >
                      <p className="font-semibold text-gray-900">À domicile</p>
                      <p className="text-xs text-gray-600 mt-1">Chez vous</p>
                    </button>
                    {(officeLocations.length > 0 || educator?.cabinet_address) && (
                      <button
                        type="button"
                        onClick={() => setLocationType('office')}
                        className={`p-4 rounded-lg border-2 transition ${
                          locationType === 'office'
                            ? 'border-gray-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={locationType === 'office' ? { borderColor: '#027e7e', backgroundColor: 'rgba(2, 126, 126, 0.05)' } : {}}
                        aria-pressed={locationType === 'office'}
                        aria-label="Rendez-vous au cabinet de l'éducateur"
                      >
                        <p className="font-semibold text-gray-900">Au cabinet</p>
                        <p className="text-xs text-gray-600 mt-1">Cabinet de l&apos;éducateur</p>
                      </button>
                    )}
                  </div>
                </div>

                {locationType === 'office' && (officeLocations.length > 0 || educator?.cabinet_address) && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Adresse du cabinet</p>
                    {officeLocations.length > 1 ? (
                      <select
                        value={selectedOfficeId || ''}
                        onChange={(e) => setSelectedOfficeId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                        style={{ focusRingColor: '#027e7e' } as any}
                      >
                        {officeLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}{loc.address ? ` — ${loc.address}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {officeLocations.length === 1
                          ? `${officeLocations[0].name}${officeLocations[0].address ? ` — ${officeLocations[0].address}` : ''}`
                          : educator?.cabinet_address}
                      </p>
                    )}
                  </div>
                )}

                {locationType === 'home' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse <span className="text-red-600" aria-label="requis">*</span>
                    </label>
                    <AddressAutocomplete
                      value={address}
                      onChange={(val) => setAddress(val)}
                      placeholder="Entrez votre adresse complète"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message pour l&apos;éducateur (optionnel)
                  </label>
                  <textarea
                    value={familyNotes}
                    onChange={(e) => setFamilyNotes(e.target.value)}
                    rows={4}
                    placeholder="Décrivez brièvement vos besoins, objectifs ou questions..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: '#027e7e' }}
                  />
                </div>

                {/* Conditions de paiement et annulation */}
                <div className="rounded-lg p-4 border" style={{ backgroundColor: '#fffbeb', borderColor: '#fbbf24' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-800 mb-2">
                        Conditions de paiement
                      </h3>
                      <ul className="text-xs text-amber-700 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>La prestation est prélevée <strong>uniquement après la réalisation du rendez-vous</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Annulation gratuite jusqu&apos;à <strong>48h avant</strong> le rendez-vous</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Annulation après 48h : <strong>50% de la prestation</strong> sera débité</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Informations RGPD */}
                <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', border: '1px solid rgba(2, 126, 126, 0.2)' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#027e7e' }}>
                    Protection de vos données personnelles
                  </h3>
                  <p className="text-xs text-gray-700 mb-2">
                    Les informations collectées lors de cette réservation (données de l&apos;enfant, préférences de rendez-vous, adresse) sont utilisées uniquement pour la gestion de votre rendez-vous et la communication avec l&apos;éducateur.
                  </p>
                  <p className="text-xs text-gray-700">
                    Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour plus d&apos;informations, consultez notre <a href="/privacy" className="underline" style={{ color: '#027e7e' }}>politique de confidentialité</a>.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
                  <Link
                    href={`/educator/${params.id}`}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition text-center"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#027e7e' }}
                  >
                    {submitting ? 'Envoi...' : `Réserver (${calculateTotalPrice().toFixed(2)}€)`}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
