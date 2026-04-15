'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import EducatorNavbar from '@/components/EducatorNavbar';
import PinCodeModal from '@/components/PinCodeModal';
import { useToast } from '@/components/Toast';

// Composant de compte à rebours
function SessionCountdown({
  sessionStart,
  scheduledDuration,
  onTimeUp,
  canComplete,
  onComplete,
  actionLoading
}: {
  sessionStart: string;
  scheduledDuration: number;
  onTimeUp: () => void;
  canComplete: boolean;
  onComplete: () => void;
  actionLoading: boolean;
}) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const startTime = new Date(sessionStart).getTime();
    const endTime = startTime + scheduledDuration;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
        onTimeUp();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStart, scheduledDuration, onTimeUp]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-primary-50 border border-primary-200 rounded-md w-full sm:w-auto justify-center" role="status" aria-live="polite">
        <svg className="w-5 h-5 text-primary-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono font-bold text-sm sm:text-base text-primary-900">
          {timeRemaining > 0 ? formatTime(timeRemaining) : 'Temps écoulé'}
        </span>
      </div>
      <button
        onClick={onComplete}
        disabled={actionLoading || !canComplete}
        className={`w-full sm:w-auto px-4 py-2 text-white rounded-md font-medium flex items-center justify-center gap-2 ${
          canComplete
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-400 cursor-not-allowed'
        } disabled:opacity-50`}
        title={!canComplete ? 'Le temps minimum de la séance doit être écoulé' : ''}
        aria-label={canComplete ? 'Terminer la séance' : 'Séance en cours, le temps minimum doit être écoulé'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">
          {canComplete ? 'Terminer la séance' : 'Séance en cours...'}
        </span>
        <span className="sm:hidden">
          {canComplete ? 'Terminer' : 'En cours...'}
        </span>
      </button>
    </div>
  );
}

interface Appointment {
  id: string;
  family_id: string;
  child_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'accepted' | 'completed' | 'cancelled' | 'no_show';
  location_type: 'home' | 'office' | 'online';
  address: string | null;
  notes: string | null;
  family_notes: string | null;
  educator_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  started_at: string | null;
  price: number | null;
  family_first_name: string;
  family_last_name: string;
  family_phone: string;
  child_first_name: string | null;
  child_age: number | null;
  child_support_level: string | null;
  child_description: string | null;
  child_accompaniment_types: string[] | null;
  child_accompaniment_goals: string | null;
}

export default function EducatorAppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [educatorId, setEducatorId] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'upcoming' | 'completed' | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'families'>('appointments');

  // Lire le paramètre tab de l'URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'upcoming') {
      setActiveFilter('upcoming');
    } else if (tab === 'completed') {
      setActiveFilter('completed');
    }
  }, [searchParams]);

  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [childDossier, setChildDossier] = useState<any>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'start' | 'complete'>('start');
  const [educatorNotes, setEducatorNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const INITIAL_DISPLAY_COUNT = 3;

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const getDisplayedItems = (items: Appointment[], sectionKey: string) => {
    if (expandedSections[sectionKey] || items.length <= INITIAL_DISPLAY_COUNT) {
      return items;
    }
    return items.slice(0, INITIAL_DISPLAY_COUNT);
  };

  useEffect(() => {
    fetchEducatorProfile();
  }, []);

  useEffect(() => {
    if (educatorId) {
      fetchAppointments();
    }
  }, [educatorId]);

  const fetchEducatorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setEducatorId(profile.id);
        setProfile(profile);
      } else {
        router.push('/dashboard/family');
      }
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/auth/login');
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          family:family_profiles!family_id (
            first_name,
            last_name,
            phone
          ),
          child:child_profiles!child_id (
            first_name,
            age,
            support_level_needed,
            description,
            accompaniment_types,
            accompaniment_goals
          )
        `)
        .eq('educator_id', educatorId)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Mapper les données pour correspondre à l'interface Appointment
      const mappedData = (data || []).map((apt: any) => ({
        ...apt,
        family_first_name: apt.family?.first_name || '',
        family_last_name: apt.family?.last_name || '',
        family_phone: apt.family?.phone || '',
        child_first_name: apt.child?.first_name || null,
        child_age: apt.child?.age || null,
        child_support_level: apt.child?.support_level_needed || null,
        child_description: apt.child?.description || null,
        child_accompaniment_types: apt.child?.accompaniment_types || null,
        child_accompaniment_goals: apt.child?.accompaniment_goals || null,
      }));

      setAppointments(mappedData);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePin = async (pin: string): Promise<{ success: boolean; error?: string; attemptsLeft?: number }> => {
    if (!selectedAppointment) {
      return { success: false, error: 'Aucun rendez-vous sélectionné' };
    }

    try {
      const endpoint = pinModalMode === 'start'
        ? `/api/appointments/${selectedAppointment.id}/start-session`
        : `/api/appointments/${selectedAppointment.id}/complete`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinCode: pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Erreur lors de la validation',
          attemptsLeft: data.attemptsLeft,
        };
      }

      // Succès - fermer le modal et rafraîchir
      setShowPinModal(false);
      setSelectedAppointment(null);

      if (pinModalMode === 'start') {
        showToast('Séance démarrée ! Le compte à rebours est lancé.');
      } else {
        showToast('Séance terminée avec succès ! Le paiement a été traité et les factures ont été générées.');
      }

      fetchAppointments();

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur réseau',
      };
    }
  };

  const handleStartSession = async (appointmentId: string) => {
    // Ouvrir le modal PIN pour démarrer la séance
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      setPinModalMode('start');
      setShowPinModal(true);
    }
  };

  const handleComplete = async (appointmentId: string) => {
    // Ouvrir le modal PIN pour terminer la séance
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      setPinModalMode('complete');
      setShowPinModal(true);
    }
  };

  // Vérifier si l'annulation est possible (48h avant le rendez-vous)
  const canCancelAppointment = (appointment: Appointment): { canCancel: boolean; hoursRemaining: number } => {
    const appointmentDateTime = new Date(appointment.appointment_date + 'T' + appointment.start_time);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return {
      canCancel: hoursUntilAppointment >= 48,
      hoursRemaining: Math.max(0, Math.floor(hoursUntilAppointment))
    };
  };

  // Vérifier si on peut signaler une absence (1h après le début du RDV)
  const canReportNoShow = (appointment: Appointment): { canReport: boolean; minutesRemaining: number } => {
    const appointmentDateTime = new Date(appointment.appointment_date + 'T' + appointment.start_time);
    const now = new Date();
    const oneHourAfterStart = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000);
    const canReport = now >= oneHourAfterStart;
    const minutesRemaining = Math.max(0, Math.ceil((oneHourAfterStart.getTime() - now.getTime()) / (1000 * 60)));
    return { canReport, minutesRemaining };
  };

  const handleCancel = async (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const cancelInfo = canCancelAppointment(appointment);
    if (!cancelInfo.canCancel) {
      showToast(`Annulation impossible moins de 48h avant le rendez-vous (${cancelInfo.hoursRemaining}h restantes)`, 'error');
      return;
    }

    if (!confirm('Annuler ce rendez-vous ?\n\nLa famille sera remboursée intégralement.')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelledBy: 'educator' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation');
      }

      showToast('Rendez-vous annulé. La famille a été remboursée.');
      fetchAppointments();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const noShowInfo = canReportNoShow(appointment);
    if (!noShowInfo.canReport) {
      showToast(`Vous devez attendre encore ${noShowInfo.minutesRemaining} minutes avant de signaler une absence.`, 'info');
      return;
    }

    const price = appointment.price || 0;
    const priceInEuros = price / 100;
    const compensation = (priceInEuros * 0.5 * 0.88).toFixed(2);

    if (!confirm(
      `Signaler l'absence de la famille ?\n\n` +
      `Cette action va:\n` +
      `• Marquer le rendez-vous comme "absence"\n` +
      `• Prélever 50% de la prestation (${(priceInEuros * 0.5).toFixed(2)}€) à la famille\n` +
      `• Vous recevoir une compensation de ${compensation}€\n\n` +
      `Êtes-vous sûr de vouloir continuer ?`
    )) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du signalement');
      }

      showToast(`Absence signalée avec succès. Compensation: ${data.educatorCompensation?.toFixed(2) || '0.00'}€`);
      fetchAppointments();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDossier = async (childId: string) => {
    setDossierLoading(true);
    setShowDossierModal(true);
    try {
      // Récupérer le profil complet de l'enfant
      const { data: childData, error: childError } = await supabase
        .from('child_profiles')
        .select('id, first_name, birth_date, age, description, accompaniment_types, accompaniment_goals, strengths, challenges, interests')
        .eq('id', childId)
        .single();

      if (childError) throw childError;

      // Récupérer les préférences
      const { data: preferences } = await supabase
        .from('child_preferences')
        .select('*')
        .eq('child_id', childId);

      // Récupérer les compétences
      const { data: skills } = await supabase
        .from('child_skills')
        .select('*')
        .eq('child_id', childId);

      // Récupérer les objectifs en cours
      const { data: goals } = await supabase
        .from('child_educational_goals')
        .select('*')
        .eq('child_id', childId)
        .eq('status', 'en_cours');

      setChildDossier({
        ...childData,
        preferences: preferences || [],
        skills: skills || [],
        goals: goals || [],
      });
    } catch (error) {
      console.error('Erreur chargement dossier:', error);
      showToast('Erreur lors du chargement du dossier', 'error');
      setShowDossierModal(false);
    } finally {
      setDossierLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ educator_notes: educatorNotes.trim() || null })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      showToast('Notes enregistrées');
      setShowNotesModal(false);
      setEducatorNotes('');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      confirmed: 'Confirmé - En attente du code PIN',
      accepted: 'Confirmé',
      in_progress: 'En cours',
      rejected: 'Refusé',
      completed: 'Terminé',
      cancelled: 'Annulé',
      no_show: 'Absence signalée'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmed: 'bg-purple-100 text-purple-800 border-purple-300',
      accepted: 'bg-green-100 text-green-800 border-green-300',
      in_progress: 'bg-primary-100 text-primary-800 border-primary-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
      no_show: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getLocationTypeLabel = (type: string) => {
    const labels = {
      home: 'À domicile',
      office: 'Au cabinet',
      online: 'En ligne'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getLocationTypeIcon = (type: string) => {
    if (type === 'home') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    }
    if (type === 'office') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  const isPastAppointment = (date: string, time: string) => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    return appointmentDateTime < new Date();
  };

  // Vérifier si le bouton vidéo doit être visible (le jour du RDV, à partir de 15 min avant l'heure de début)
  const canJoinVideoCall = (appointment: Appointment): boolean => {
    if (appointment.location_type !== 'online') return false;

    const now = new Date();
    const appointmentDate = new Date(appointment.appointment_date + 'T00:00:00');
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Vérifier si c'est le même jour
    if (appointmentDate.getTime() !== todayDate.getTime()) return false;

    // Vérifier si on est à 15 minutes ou moins du début du RDV
    const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
    const appointmentStartTime = new Date(appointment.appointment_date);
    appointmentStartTime.setHours(startHour, startMinute, 0, 0);

    // Permettre de rejoindre 15 minutes avant le début
    const canJoinFrom = new Date(appointmentStartTime.getTime() - 15 * 60 * 1000);

    // Vérifier si le RDV n'est pas terminé (end_time)
    const [endHour, endMinute] = appointment.end_time.split(':').map(Number);
    const appointmentEndTime = new Date(appointment.appointment_date);
    appointmentEndTime.setHours(endHour, endMinute, 0, 0);

    return now >= canJoinFrom && now <= appointmentEndTime;
  };

  // Générer un fichier ICS pour ajouter au calendrier
  const generateCalendarEvent = (appointment: Appointment) => {
    const startDate = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const endDate = new Date(`${appointment.appointment_date}T${appointment.end_time}`);

    // Formater les dates au format ICS (YYYYMMDDTHHmmss)
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const locationText = appointment.location_type === 'online'
      ? 'En ligne (visioconférence)'
      : appointment.address || getLocationTypeLabel(appointment.location_type);

    const description = [
      `Rendez-vous avec ${appointment.family_first_name} ${appointment.family_last_name}`,
      appointment.child_first_name ? `Enfant : ${appointment.child_first_name}` : '',
      appointment.family_phone ? `Téléphone : ${appointment.family_phone}` : '',
      appointment.family_notes ? `Notes : ${appointment.family_notes}` : ''
    ].filter(Boolean).join('\\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NeuroCare//Appointments//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:RDV - ${appointment.family_first_name} ${appointment.family_last_name}${appointment.child_first_name ? ` (${appointment.child_first_name})` : ''}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${locationText}`,
      `UID:${appointment.id}@neurocare.fr`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Créer et télécharger le fichier
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rdv-${appointment.family_first_name}-${appointment.appointment_date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Grouper les rendez-vous par catégorie
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fonction pour vérifier si un RDV est passé (date + heure de fin)
  const isAppointmentPast = (appointment: Appointment): boolean => {
    const endDateTime = new Date(`${appointment.appointment_date}T${appointment.end_time}`);
    return endDateTime < new Date();
  };

  const inProgressAppointments = appointments.filter(a => a.status === 'accepted' && a.started_at);
  const upcomingAppointments = appointments.filter(a => {
    // Un RDV est "à venir" si il est accepté, pas démarré, et pas encore passé (date+heure de fin)
    return a.status === 'accepted' && !a.started_at && !isAppointmentPast(a);
  });
  // RDV passés non démarrés (manqués)
  const missedAppointments = appointments.filter(a => {
    return a.status === 'accepted' && !a.started_at && isAppointmentPast(a);
  });
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show');

  // Extraire les familles uniques rencontrées
  const getUniqueFamiliesWithStats = () => {
    const familyMap = new Map<string, {
      id: string;
      first_name: string;
      last_name: string;
      appointmentCount: number;
      lastAppointmentDate: string;
    }>();

    appointments.forEach(apt => {
      if (!apt.family_id) return;
      const isPast = apt.status === 'completed' || (apt.status === 'accepted' && isAppointmentPast(apt));

      if (isPast) {
        const existing = familyMap.get(apt.family_id);
        if (existing) {
          existing.appointmentCount++;
          if (apt.appointment_date > existing.lastAppointmentDate) {
            existing.lastAppointmentDate = apt.appointment_date;
          }
        } else {
          familyMap.set(apt.family_id, {
            id: apt.family_id,
            first_name: apt.family_first_name,
            last_name: apt.family_last_name,
            appointmentCount: 1,
            lastAppointmentDate: apt.appointment_date
          });
        }
      }
    });

    return Array.from(familyMap.values()).sort((a, b) =>
      new Date(b.lastAppointmentDate).getTime() - new Date(a.lastAppointmentDate).getTime()
    );
  };

  const uniqueFamilies = getUniqueFamiliesWithStats();

  // Helper pour obtenir l'icône de profil
  const getFamilyIcon = (id?: string) => {
    return (id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg';
  };

  // Fonction pour sélectionner un filtre (un seul à la fois)
  const selectFilter = (filter: 'all' | 'in_progress' | 'upcoming' | 'completed') => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    }
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Composant carte de rendez-vous compact
  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const isPast = isPastAppointment(appointment.appointment_date, appointment.end_time);

    return (
      <div className={`bg-white rounded-xl border ${isPast && appointment.status !== 'completed' ? 'border-gray-200 opacity-70' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all`}>
        {/* En-tête compact */}
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5a1a75 0%, #41005c 100%)' }}>
                <span className="text-sm font-bold text-white">
                  {appointment.family_first_name?.[0]}{appointment.family_last_name?.[0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {appointment.family_first_name} {appointment.family_last_name}
                </h3>
                {appointment.child_first_name && (
                  <p className="text-xs text-purple-600 font-medium">
                    Enfant : {appointment.child_first_name}
                  </p>
                )}
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </span>
          </div>

          {/* Date et heure */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
            </span>
            <span className="flex items-center gap-1.5 text-gray-500">
              {getLocationTypeIcon(appointment.location_type)}
              <span className="text-xs">{getLocationTypeLabel(appointment.location_type)}</span>
            </span>
          </div>
        </div>

        {/* Détails additionnels si présents */}
        {(appointment.address || appointment.family_notes || appointment.child_accompaniment_goals) && (
          <div className="px-4 py-3 space-y-2 bg-gray-50/50">
            {appointment.address && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{appointment.address}</span>
              </p>
            )}
            {appointment.family_notes && (
              <p className="text-sm text-gray-600 italic bg-blue-50 rounded p-2 line-clamp-2">
                "{appointment.family_notes}"
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-3 border-t border-gray-100 flex flex-wrap gap-2">
          {appointment.status === 'accepted' && (!isPast || appointment.started_at) && (
            <>
              {!appointment.started_at ? (
                <>
                  {/* Bouton Ajouter à l'agenda - visible sur mobile uniquement */}
                  <button
                    onClick={() => generateCalendarEvent(appointment)}
                    className="sm:hidden p-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition flex items-center justify-center"
                    title="Ajouter à l'agenda"
                    aria-label="Ajouter à l'agenda"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {/* Bouton Rejoindre la séance vidéo - uniquement le jour du RDV, 15 min avant */}
                  {canJoinVideoCall(appointment) && (
                    <button
                      onClick={() => window.open(`/video-call/${appointment.id}`, '_blank')}
                      className="flex-1 min-w-0 px-3 py-2 text-white rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 sm:gap-2 animate-pulse"
                      style={{ backgroundColor: '#8b5cf6' }}
                      aria-label="Rejoindre la séance vidéo"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Rejoindre la séance vidéo</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleStartSession(appointment.id)}
                    disabled={actionLoading}
                    className="flex-1 min-w-0 px-2 sm:px-4 py-2 text-white rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 sm:gap-2 hover:opacity-90"
                    style={{ backgroundColor: '#8b5cf6' }}
                    aria-label="Démarrer la séance avec code PIN"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="hidden sm:inline">Démarrer (PIN)</span>
                    <span className="sm:hidden">PIN</span>
                  </button>
                  {/* Bouton Signaler absence - visible 1h après le début du RDV */}
                  {canReportNoShow(appointment).canReport && (
                    <button
                      onClick={() => handleNoShow(appointment.id)}
                      disabled={actionLoading}
                      className="flex-1 min-w-0 px-2 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 sm:gap-2"
                      aria-label="Signaler l'absence de la famille"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="hidden sm:inline">Signaler absence</span>
                      <span className="sm:hidden">Absence</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Bouton vidéo pendant la séance en cours */}
                  {canJoinVideoCall(appointment) && (
                    <button
                      onClick={() => window.open(`/video-call/${appointment.id}`, '_blank')}
                      className="px-3 py-2 text-white rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1"
                      style={{ backgroundColor: '#8b5cf6' }}
                      title="Rejoindre la vidéo"
                      aria-label="Rejoindre la séance vidéo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Rejoindre la séance vidéo</span>
                    </button>
                  )}
                  <SessionCountdown
                    sessionStart={appointment.started_at}
                    scheduledDuration={(() => {
                      const [startHour, startMinute] = appointment.start_time.split(':');
                      const [endHour, endMinute] = appointment.end_time.split(':');
                      const start = parseInt(startHour) * 60 + parseInt(startMinute);
                      const end = parseInt(endHour) * 60 + parseInt(endMinute);
                      return (end - start) * 60 * 1000;
                    })()}
                    onTimeUp={() => {}}
                    canComplete={(() => {
                      const now = Date.now();
                      const sessionStart = new Date(appointment.started_at!).getTime();

                      // Calculer la durée prévue
                      const [startHour, startMinute] = appointment.start_time.split(':');
                      const [endHour, endMinute] = appointment.end_time.split(':');
                      const start = parseInt(startHour) * 60 + parseInt(startMinute);
                      const end = parseInt(endHour) * 60 + parseInt(endMinute);
                      const scheduledDurationMs = (end - start) * 60 * 1000;

                      // On peut terminer si 100% de la durée prévue est écoulée depuis le démarrage
                      return now >= sessionStart + scheduledDurationMs;
                    })()}
                    onComplete={() => handleComplete(appointment.id)}
                    actionLoading={actionLoading}
                  />
                </>
              )}
              {canCancelAppointment(appointment).canCancel && (
                <button
                  onClick={() => handleCancel(appointment.id)}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1"
                  title="Annuler le rendez-vous"
                  aria-label="Annuler le rendez-vous"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Annuler</span>
                </button>
              )}
            </>
          )}

          {(appointment.status === 'accepted' || appointment.status === 'completed') && (
            <button
              onClick={() => {
                setSelectedAppointment(appointment);
                setEducatorNotes(appointment.educator_notes || '');
                setShowNotesModal(true);
              }}
              disabled={actionLoading}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1"
              title="Notes"
              aria-label="Ajouter ou modifier les notes du rendez-vous"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Notes</span>
            </button>
          )}

          {appointment.child_id && (
            appointment.started_at ? (
              /* Lien vers la page de modification du dossier quand la séance est active */
              <Link
                href={`/dashboard/educator/session/${appointment.id}`}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1"
                title="Modifier le dossier"
                aria-label="Accéder et modifier le dossier de l'enfant"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Dossier</span>
              </Link>
            ) : (
              /* Bouton pour voir le dossier en lecture seule */
              <button
                onClick={() => handleViewDossier(appointment.child_id!)}
                disabled={dossierLoading}
                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1"
                title="Voir le dossier"
                aria-label="Voir le dossier de l'enfant"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Dossier</span>
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title, count, icon, color }: { title: string; count: number; icon: React.ReactNode; color: string }) => (
    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
      <div className={`w-8 h-8 md:w-10 md:h-10 ${color} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-[11px] md:text-sm text-gray-500">{count} rendez-vous</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40">
        <EducatorNavbar profile={profile} />
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
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
              <img src="/images/icons/4.svg" alt="" className="w-full h-full" />
            </div>
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">Mes rendez-vous</h1>
            <p className="text-gray-500 text-[11px] sm:text-xs md:text-sm mt-1">Gérez vos demandes et séances</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex bg-white rounded-xl p-1 mb-3 sm:mb-4 md:mb-6 shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-2 md:py-2.5 px-3 md:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'appointments'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'appointments' ? { backgroundColor: '#41005c' } : {}}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Rendez-vous
            </span>
          </button>
          <button
            onClick={() => setActiveTab('families')}
            className={`flex-1 py-2 md:py-2.5 px-3 md:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'families'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'families' ? { backgroundColor: '#41005c' } : {}}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Mes familles
              {uniqueFamilies.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: activeTab === 'families' ? 'rgba(255,255,255,0.2)' : 'rgba(65, 0, 92, 0.1)', color: activeTab === 'families' ? 'white' : '#41005c' }}>
                  {uniqueFamilies.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Contenu de l'onglet Rendez-vous */}
        {activeTab === 'appointments' && (
          <>
        {/* Bandeau Séance en cours */}
        {inProgressAppointments.length > 0 && (
          <div
            onClick={() => selectFilter('in_progress')}
            className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800 rounded-xl md:rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all animate-pulse-slow border border-primary-600/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base md:text-lg">
                    {inProgressAppointments.length} séance{inProgressAppointments.length > 1 ? 's' : ''} en cours
                  </h3>
                  <p className="text-primary-200 text-[11px] md:text-sm">Cliquez pour voir le compte à rebours</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-300"></span>
                </span>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Boutons de filtre - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          {/* Tous */}
          <button
            onClick={() => appointments.length > 0 && selectFilter('all')}
            disabled={appointments.length === 0}
            className={`rounded-xl p-2 sm:p-3 text-center transition-all ${
              appointments.length === 0
                ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                : activeFilter === 'all'
                  ? 'bg-gray-300 ring-2 ring-gray-500'
                  : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
            }`}
          >
            <p className="text-xl sm:text-2xl font-bold text-gray-700">{appointments.length}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Tous</p>
          </button>

          {/* En cours - Style accrocheur */}
          <button
            onClick={() => inProgressAppointments.length > 0 && selectFilter('in_progress')}
            disabled={inProgressAppointments.length === 0}
            className={`rounded-xl p-2 sm:p-3 text-center transition-all relative ${
              inProgressAppointments.length === 0
                ? 'bg-primary-50 opacity-60 cursor-not-allowed'
                : activeFilter === 'in_progress'
                  ? 'bg-primary-200 ring-2 ring-primary-500'
                  : 'bg-primary-50 hover:bg-primary-100 cursor-pointer'
            }`}
          >
            {inProgressAppointments.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary-500"></span>
              </span>
            )}
            <p className="text-xl sm:text-2xl font-bold text-primary-600">{inProgressAppointments.length}</p>
            <p className="text-[10px] sm:text-xs text-primary-700 mt-0.5 sm:mt-1">En cours</p>
          </button>

          {/* À venir */}
          <button
            onClick={() => upcomingAppointments.length > 0 && selectFilter('upcoming')}
            disabled={upcomingAppointments.length === 0}
            className={`rounded-xl p-2 sm:p-3 text-center transition-all ${
              upcomingAppointments.length === 0
                ? 'bg-emerald-50 opacity-60 cursor-not-allowed'
                : activeFilter === 'upcoming'
                  ? 'bg-emerald-200 ring-2 ring-emerald-500'
                  : 'bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
            }`}
          >
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{upcomingAppointments.length}</p>
            <p className="text-[10px] sm:text-xs text-emerald-700 mt-0.5 sm:mt-1">À venir</p>
          </button>

          {/* Passés */}
          <button
            onClick={() => completedAppointments.length > 0 && selectFilter('completed')}
            disabled={completedAppointments.length === 0}
            className={`rounded-xl p-2 sm:p-3 text-center transition-all ${
              completedAppointments.length === 0
                ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                : activeFilter === 'completed'
                  ? 'bg-gray-300 ring-2 ring-gray-500'
                  : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
            }`}
          >
            <p className="text-xl sm:text-2xl font-bold text-gray-600">{completedAppointments.length}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Passés</p>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: '#41005c' }} aria-hidden="true"></div>
            <p className="text-gray-500 mt-4 text-sm">Chargement...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl md:rounded-2xl border border-gray-100">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="h-6 w-6 md:h-8 md:w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900">Aucun rendez-vous</h3>
            <p className="text-gray-500 mt-1 sm:mt-2 text-[11px] md:text-sm">Vous n'avez pas encore de demandes de rendez-vous.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Section: En cours */}
            {(activeFilter === 'all' || activeFilter === 'in_progress') && inProgressAppointments.length > 0 && (
              <section>
                <SectionHeader
                  title="Séances en cours"
                  count={inProgressAppointments.length}
                  icon={<svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  color="bg-primary-100"
                />
                <div className="space-y-3">
                  {getDisplayedItems(inProgressAppointments, 'in_progress').map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                  {inProgressAppointments.length > INITIAL_DISPLAY_COUNT && (
                    <button
                      onClick={() => toggleSection('in_progress')}
                      className="w-full py-2 md:py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      style={{ color: '#41005c' }}
                    >
                      {expandedSections['in_progress']
                        ? 'Voir moins'
                        : `Voir plus (${inProgressAppointments.length - INITIAL_DISPLAY_COUNT} autres)`}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Section: À venir */}
            {(activeFilter === 'all' || activeFilter === 'upcoming') && upcomingAppointments.length > 0 && (
              <section>
                <SectionHeader
                  title="Rendez-vous à venir"
                  count={upcomingAppointments.length}
                  icon={<svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  color="bg-emerald-100"
                />
                <div className="space-y-3">
                  {getDisplayedItems(upcomingAppointments, 'upcoming').map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                  {upcomingAppointments.length > INITIAL_DISPLAY_COUNT && (
                    <button
                      onClick={() => toggleSection('upcoming')}
                      className="w-full py-2 md:py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      style={{ color: '#41005c' }}
                    >
                      {expandedSections['upcoming']
                        ? 'Voir moins'
                        : `Voir plus (${upcomingAppointments.length - INITIAL_DISPLAY_COUNT} autres)`}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Section: Terminés */}
            {(activeFilter === 'all' || activeFilter === 'completed') && completedAppointments.length > 0 && (
              <section>
                <SectionHeader
                  title="Séances terminées"
                  count={completedAppointments.length}
                  icon={<svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  color="bg-blue-100"
                />
                <div className="space-y-3">
                  {getDisplayedItems(completedAppointments, 'completed').map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                  {completedAppointments.length > INITIAL_DISPLAY_COUNT && (
                    <button
                      onClick={() => toggleSection('completed')}
                      className="w-full py-2 md:py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      style={{ color: '#41005c' }}
                    >
                      {expandedSections['completed']
                        ? 'Voir moins'
                        : `Voir plus (${completedAppointments.length - INITIAL_DISPLAY_COUNT} autres)`}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Section: RDV manqués (passés non démarrés) - visible uniquement avec "Tous" */}
            {activeFilter === 'all' && missedAppointments.length > 0 && (
              <section>
                <SectionHeader
                  title="Rendez-vous manqués"
                  count={missedAppointments.length}
                  icon={<svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                  color="bg-orange-100"
                />
                <div className="space-y-3">
                  {getDisplayedItems(missedAppointments, 'missed').map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                  {missedAppointments.length > INITIAL_DISPLAY_COUNT && (
                    <button
                      onClick={() => toggleSection('missed')}
                      className="w-full py-2 md:py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      style={{ color: '#41005c' }}
                    >
                      {expandedSections['missed']
                        ? 'Voir moins'
                        : `Voir plus (${missedAppointments.length - INITIAL_DISPLAY_COUNT} autres)`}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Section: Annulés/Refusés - visible uniquement avec "Tous" */}
            {activeFilter === 'all' && cancelledAppointments.length > 0 && (
              <section>
                <SectionHeader
                  title="Annulés / Refusés"
                  count={cancelledAppointments.length}
                  icon={<svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                  color="bg-gray-200"
                />
                <div className="space-y-3">
                  {getDisplayedItems(cancelledAppointments, 'cancelled').map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                  {cancelledAppointments.length > INITIAL_DISPLAY_COUNT && (
                    <button
                      onClick={() => toggleSection('cancelled')}
                      className="w-full py-2 md:py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      style={{ color: '#41005c' }}
                    >
                      {expandedSections['cancelled']
                        ? 'Voir moins'
                        : `Voir plus (${cancelledAppointments.length - INITIAL_DISPLAY_COUNT} autres)`}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Message si aucun filtre sélectionné */}
            {activeFilter === null && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Sélectionnez une catégorie</h3>
                <p className="text-gray-500 mt-2 text-sm">Cliquez sur un des boutons ci-dessus pour afficher les rendez-vous</p>
              </div>
            )}
          </div>
        )}
          </>
        )}

        {/* Contenu de l'onglet Mes familles */}
        {activeTab === 'families' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: '#41005c' }} role="status" aria-label="Chargement des familles"></div>
                <p className="text-gray-500 mt-4 text-sm">Chargement...</p>
              </div>
            ) : uniqueFamilies.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)' }}>
                  <svg className="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#41005c' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900">Aucune famille rencontrée</h3>
                <p className="text-gray-500 mt-1 sm:mt-2 text-[11px] md:text-sm">Les familles avec qui vous avez eu des rendez-vous apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] md:text-sm text-gray-500 mb-3 sm:mb-4">
                  {uniqueFamilies.length} famille{uniqueFamilies.length > 1 ? 's' : ''} rencontrée{uniqueFamilies.length > 1 ? 's' : ''}
                </p>
                {uniqueFamilies.map((family) => (
                  <Link
                    key={family.id}
                    href={`/family/${family.id}`}
                    className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-3 sm:p-4"
                    style={{ borderColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(65, 0, 92, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-11 w-11 md:h-14 md:w-14 rounded-full overflow-hidden border-2" style={{ background: 'linear-gradient(135deg, #41005c 0%, #5a1a75 100%)', borderColor: 'rgba(65, 0, 92, 0.1)' }}>
                          <img
                            src={getFamilyIcon(family.id)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                          {family.first_name} {family.last_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[11px] md:text-sm text-gray-500 mt-0.5 sm:mt-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#5a1a75' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {family.appointmentCount} rendez-vous
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Dernier : {new Date(family.lastAppointmentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>

                      {/* Flèche */}
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#41005c' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Espace pour le footer */}
        <div className="h-8"></div>
      </div>

      {/* Modal Notes */}
      {showNotesModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-md w-full p-3 sm:p-4 md:p-6">
            <h3 id="notes-modal-title" className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">Notes du rendez-vous</h3>
            <p className="text-gray-600 mb-2 sm:mb-3 md:mb-4 text-xs md:text-sm">
              Ajoutez des notes personnelles sur ce rendez-vous (visibles uniquement par vous).
            </p>
            <textarea
              value={educatorNotes}
              onChange={(e) => setEducatorNotes(e.target.value)}
              rows={6}
              placeholder="Vos notes..."
              className="w-full border border-gray-300 rounded-xl shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-2 focus:ring-[#41005c] focus:border-[#41005c] mb-3 sm:mb-4"
              aria-label="Notes personnelles du rendez-vous"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold"
                style={{ backgroundColor: '#41005c' }}
              >
                {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setEducatorNotes('');
                  setSelectedAppointment(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Code PIN */}
      {selectedAppointment && (
        <PinCodeModal
          isOpen={showPinModal}
          onClose={() => {
            setShowPinModal(false);
            setSelectedAppointment(null);
          }}
          onValidate={handleValidatePin}
          appointmentId={selectedAppointment.id}
        />
      )}

      {/* Modal Dossier Enfant */}
      {showDossierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="dossier-modal-title">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#41005c' }}>
              <h3 id="dossier-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Dossier de la personne accompagnée
              </h3>
              <button
                onClick={() => {
                  setShowDossierModal(false);
                  setChildDossier(null);
                }}
                className="text-white/80 hover:text-white transition"
                aria-label="Fermer le dossier"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {dossierLoading ? (
                <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#41005c' }} aria-hidden="true"></div>
                  <span className="sr-only">Chargement du dossier...</span>
                </div>
              ) : childDossier ? (
                <div className="space-y-6">
                  {/* Identité */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Identité
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Prénom :</span>
                        <span className="ml-2 font-medium text-gray-900">{childDossier.first_name}</span>
                      </div>
                      {childDossier.birth_date && (
                        <div>
                          <span className="text-gray-600">Date de naissance :</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(childDossier.birth_date).toLocaleDateString('fr-FR')}
                            {' '}({Math.floor((Date.now() - new Date(childDossier.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} ans)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {childDossier.description && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Présentation</h4>
                      <p className="text-gray-700 text-sm">{childDossier.description}</p>
                    </div>
                  )}

                  {/* Types d'accompagnement */}
                  {childDossier.accompaniment_types && childDossier.accompaniment_types.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Types d'accompagnement recherchés</h4>
                      <div className="flex flex-wrap gap-2">
                        {childDossier.accompaniment_types.map((type: string) => (
                          <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {type === 'scolaire' ? 'Soutien scolaire' :
                             type === 'comportemental' ? 'Gestion du comportement' :
                             type === 'socialisation' ? 'Socialisation' :
                             type === 'autonomie' ? 'Autonomie' :
                             type === 'communication' ? 'Communication' :
                             type === 'motricite' ? 'Motricité' :
                             type === 'sensoriel' ? 'Sensoriel' :
                             type === 'loisirs' ? 'Loisirs' : type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Objectifs */}
                  {childDossier.accompaniment_goals && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Objectifs d'accompagnement</h4>
                      <p className="text-green-800 text-sm">{childDossier.accompaniment_goals}</p>
                    </div>
                  )}

                  {/* Points forts et défis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {childDossier.strengths && (
                      <div className="bg-emerald-50 rounded-lg p-3 sm:p-4 border border-emerald-200">
                        <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <span className="text-base sm:text-lg">✓</span> Points forts
                        </h4>
                        <p className="text-emerald-800 text-xs sm:text-sm">{childDossier.strengths}</p>
                      </div>
                    )}
                    {childDossier.challenges && (
                      <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <span className="text-base sm:text-lg">!</span> Points de vigilance
                        </h4>
                        <p className="text-orange-800 text-xs sm:text-sm">{childDossier.challenges}</p>
                      </div>
                    )}
                  </div>

                  {/* Centres d'intérêt */}
                  {childDossier.interests && (
                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                      <h4 className="font-semibold text-pink-900 mb-2">❤️ Centres d'intérêt</h4>
                      <p className="text-pink-800 text-sm">{childDossier.interests}</p>
                    </div>
                  )}

                  {/* Préférences du dossier */}
                  {childDossier.preferences && childDossier.preferences.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Préférences et stratégies</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Renforçateurs */}
                        {childDossier.preferences.filter((p: any) => p.type === 'reinforcer').length > 0 && (
                          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                            <h5 className="font-medium text-yellow-900 mb-2 text-sm">⭐ Renforçateurs</h5>
                            <ul className="space-y-1">
                              {childDossier.preferences.filter((p: any) => p.type === 'reinforcer').map((pref: any) => (
                                <li key={pref.id} className="text-yellow-800 text-sm">• {pref.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Stratégies */}
                        {childDossier.preferences.filter((p: any) => p.type === 'strategy').length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-2 text-sm">💡 Stratégies efficaces</h5>
                            <ul className="space-y-1">
                              {childDossier.preferences.filter((p: any) => p.type === 'strategy').map((pref: any) => (
                                <li key={pref.id} className="text-blue-800 text-sm">• {pref.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* À éviter */}
                        {childDossier.preferences.filter((p: any) => p.type === 'avoid').length > 0 && (
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <h5 className="font-medium text-red-900 mb-2 text-sm">⚠️ À éviter</h5>
                            <ul className="space-y-1">
                              {childDossier.preferences.filter((p: any) => p.type === 'avoid').map((pref: any) => (
                                <li key={pref.id} className="text-red-800 text-sm">• {pref.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Objectifs éducatifs en cours */}
                  {childDossier.goals && childDossier.goals.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Objectifs éducatifs en cours</h4>
                      <div className="space-y-2">
                        {childDossier.goals.map((goal: any) => (
                          <div key={goal.id} className="bg-primary-50 rounded-lg p-3 border border-primary-200">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-primary-900 text-sm">{goal.title}</h5>
                              <span className="text-xs bg-primary-200 text-primary-800 px-2 py-0.5 rounded-full">
                                {goal.progress}%
                              </span>
                            </div>
                            {goal.description && (
                              <p className="text-primary-700 text-xs">{goal.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message si dossier incomplet */}
                  {!childDossier.description && !childDossier.strengths && !childDossier.challenges &&
                   (!childDossier.preferences || childDossier.preferences.length === 0) && (
                    <div className="bg-gray-100 rounded-lg p-6 text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-600">Le dossier de cet enfant n'a pas encore été complété par la famille.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Impossible de charger le dossier
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 px-6 py-4">
              <button
                onClick={() => {
                  setShowDossierModal(false);
                  setChildDossier(null);
                }}
                className="w-full px-4 py-3 text-white rounded-xl hover:opacity-90 font-semibold transition"
                style={{ backgroundColor: '#41005c' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer violet */}
      <div className="mt-auto" style={{ backgroundColor: '#41005c', height: '40px' }}></div>
    </div>
  );
}
