'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import { useToast } from '@/components/Toast';

type AppointmentStatus = 'accepted' | 'completed' | 'cancelled' | 'no_show';

interface Appointment {
  id: string;
  status: AppointmentStatus;
  appointment_date: string;
  start_time: string;
  end_time: string;
  address?: string;
  notes?: string;
  location_type?: 'home' | 'office' | 'online';
  educator?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    profile_image_url?: string;
    avatar_url?: string;
  };
}

export default function FamilyBookingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past' | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'caregivers'>('appointments');

  // États pour le signalement no-show
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingAppointment, setReportingAppointment] = useState<Appointment | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // États pour les avis
  const [reviewedAppointments, setReviewedAppointments] = useState<Set<string>>(new Set());

  const selectFilter = (filter: 'all' | 'upcoming' | 'past') => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      const { data: familyProfile } = await supabase
        .from('family_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!familyProfile) {
        router.push('/auth/login');
        return;
      }

      setProfile(familyProfile);
      setFamilyId(familyProfile.id);

      // Fetch appointments and reviews in parallel (both depend on familyProfile.id but not on each other)
      setLoading(true);
      const [appointmentsResult, reviewsResult] = await Promise.all([
        supabase
          .from('appointments')
          .select(`
            *,
            educator:educator_profiles(
              id,
              first_name,
              last_name,
              phone,
              profile_image_url,
              avatar_url
            )
          `)
          .eq('family_id', familyProfile.id)
          .order('appointment_date', { ascending: true }),
        supabase
          .from('reviews')
          .select('booking_id')
          .eq('family_id', familyProfile.id),
      ]);

      if (appointmentsResult.error) {
        console.error('Erreur:', appointmentsResult.error);
      } else {
        // Mapper les données pour gérer le format tableau de Supabase
        const mappedData = (appointmentsResult.data || []).map((apt: any) => ({
          ...apt,
          educator: Array.isArray(apt.educator) && apt.educator.length > 0
            ? apt.educator[0]
            : apt.educator
        }));
        setAppointments(mappedData);
      }

      if (reviewsResult.data) {
        setReviewedAppointments(new Set(reviewsResult.data.map(r => r.booking_id)));
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!familyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          educator:educator_profiles(
            id,
            first_name,
            last_name,
            phone,
            profile_image_url,
            avatar_url
          )
        `)
        .eq('family_id', familyId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      // Mapper les données pour gérer le format tableau de Supabase
      const mappedData = (data || []).map((apt: any) => ({
        ...apt,
        educator: Array.isArray(apt.educator) && apt.educator.length > 0
          ? apt.educator[0]
          : apt.educator
      }));
      setAppointments(mappedData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const [cancelLoading, setCancelLoading] = useState(false);

  const handleCancelAppointment = async (appointmentId: string, isLateCancel: boolean) => {
    setCancelLoading(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelledBy: 'family' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation');
      }

      showToast(data.message);
      fetchAppointments();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  // Grouper les rendez-vous par catégorie
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments.filter(a => {
    const date = new Date(a.appointment_date);
    return a.status === 'accepted' && date >= today;
  });
  const pastAppointments = appointments.filter(a => {
    const date = new Date(a.appointment_date);
    return a.status === 'completed' || (a.status === 'accepted' && date < today) || a.status === 'cancelled';
  });

  // Extraire les professionnels uniques rencontrés (rendez-vous complétés ou passés acceptés)
  const getUniqueCaregiversWithStats = () => {
    const caregiverMap = new Map<string, {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url?: string;
      profile_image_url?: string;
      appointmentCount: number;
      lastAppointmentDate: string;
    }>();

    appointments.forEach(apt => {
      if (!apt.educator?.id) return;
      const date = new Date(apt.appointment_date);
      const isPast = apt.status === 'completed' || (apt.status === 'accepted' && date < today);

      if (isPast) {
        const existing = caregiverMap.get(apt.educator.id);
        if (existing) {
          existing.appointmentCount++;
          if (apt.appointment_date > existing.lastAppointmentDate) {
            existing.lastAppointmentDate = apt.appointment_date;
          }
        } else {
          caregiverMap.set(apt.educator.id, {
            id: apt.educator.id,
            first_name: apt.educator.first_name,
            last_name: apt.educator.last_name,
            avatar_url: apt.educator.avatar_url,
            profile_image_url: apt.educator.profile_image_url,
            appointmentCount: 1,
            lastAppointmentDate: apt.appointment_date
          });
        }
      }
    });

    return Array.from(caregiverMap.values()).sort((a, b) =>
      new Date(b.lastAppointmentDate).getTime() - new Date(a.lastAppointmentDate).getTime()
    );
  };

  const uniqueCaregivers = getUniqueCaregiversWithStats();

  // Helper pour obtenir l'icône de profil (basé sur l'ID pour la consistance)
  const getEducatorIcon = (id?: string) => {
    return (id?.charCodeAt(0) || 0) % 2 === 0 ? '/images/icons/avatar-male.svg' : '/images/icons/avatar-female.svg';
  };

  const getStatusConfig = (status: AppointmentStatus) => {
    const configs = {
      accepted: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Confirmé', icon: '✓' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Annulé', icon: '−' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terminé', icon: '✓' },
      no_show: { bg: 'bg-red-100', text: 'text-red-800', label: 'Non présenté', icon: '⚠' }
    };
    return configs[status] || configs.accepted;
  };

  // Fonction pour signaler un no-show
  const handleReportNoShow = async () => {
    if (!reportingAppointment || !familyId) return;

    setReportLoading(true);
    try {
      const response = await fetch('/api/report-noshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: reportingAppointment.id,
          reporterId: familyId,
          description: reportDescription
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du signalement');
      }

      showToast(data.message);
      setShowReportModal(false);
      setReportingAppointment(null);
      setReportDescription('');
      fetchAppointments();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setReportLoading(false);
    }
  };

  // Vérifier si un rendez-vous peut être signalé comme no-show
  const canReportNoShow = (appointment: Appointment): boolean => {
    if (appointment.status !== 'accepted') return false;
    const appointmentEnd = new Date(appointment.appointment_date + 'T' + appointment.end_time);
    const now = new Date();
    return appointmentEnd < now;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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

  // Générer un fichier ICS pour ajouter au calendrier
  const generateCalendarEvent = (appointment: Appointment) => {
    const startDate = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const endDate = new Date(`${appointment.appointment_date}T${appointment.end_time}`);

    // Formater les dates au format ICS (YYYYMMDDTHHmmss)
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const description = [
      `Rendez-vous avec ${appointment.educator?.first_name} ${appointment.educator?.last_name}`,
      appointment.educator?.phone ? `Téléphone : ${appointment.educator.phone}` : '',
      appointment.notes ? `Notes : ${appointment.notes}` : ''
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
      `SUMMARY:RDV - ${appointment.educator?.first_name} ${appointment.educator?.last_name}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${appointment.address || 'Non précisé'}`,
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
    link.download = `rdv-${appointment.educator?.first_name}-${appointment.appointment_date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const statusConfig = getStatusConfig(appointment.status);
    const appointmentDate = new Date(appointment.appointment_date);
    const isPast = appointmentDate < today;
    const cancelInfo = canCancelAppointment(appointment);

    return (
      <div className={`bg-white rounded-xl border ${isPast ? 'border-gray-200 opacity-75' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all p-3 sm:p-4`}>
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {appointment.educator?.avatar_url || appointment.educator?.profile_image_url ? (
              <img
                src={appointment.educator.avatar_url || appointment.educator.profile_image_url}
                alt={`${appointment.educator.first_name} ${appointment.educator.last_name}`}
                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow" style={{ background: 'linear-gradient(135deg, #027e7e 0%, #3a9e9e 100%)' }}>
                <img
                  src={getEducatorIcon(appointment.educator?.id)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {appointment.educator?.first_name} {appointment.educator?.last_name}
              </h3>
              <span className={`${statusConfig.bg} ${statusConfig.text} px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>

            {/* Date et heure */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {appointment.start_time} - {appointment.end_time}
              </span>
            </div>

            {appointment.address && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{appointment.address}</span>
              </p>
            )}

            {appointment.notes && (
              <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 rounded-lg p-2 line-clamp-2">
                "{appointment.notes}"
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {appointment.status === 'accepted' && !isPast && (
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
            {/* Bouton Rejoindre vidéo - visible uniquement le jour du RDV, 15 min avant */}
            {canJoinVideoCall(appointment) && (
              <button
                onClick={() => window.open(`/video-call/${appointment.id}`, '_blank')}
                className="w-full px-3 py-2.5 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#05a5a5' }}
                aria-label="Rejoindre la séance vidéo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Rejoindre la séance vidéo
              </button>
            )}
            {/* Bouton Ajouter à l'agenda - visible sur mobile */}
            <button
              onClick={() => generateCalendarEvent(appointment)}
              className="sm:hidden w-full px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-sm font-medium transition flex items-center justify-center gap-2"
              aria-label="Ajouter à mon agenda"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ajouter à mon agenda
            </button>
            {cancelInfo.canCancel ? (
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?\n\nAnnulation gratuite (plus de 48h avant le RDV).')) {
                    handleCancelAppointment(appointment.id, false);
                  }
                }}
                disabled={cancelLoading}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition disabled:opacity-50"
              >
                {cancelLoading ? 'Annulation...' : 'Annuler le rendez-vous'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm(`⚠️ ATTENTION : Annulation tardive\n\nVous êtes à moins de 48h du rendez-vous.\n\n50% du montant sera prélevé (${((appointment as any).price / 100 * 0.5).toFixed(2)}€).\n\nConfirmer l'annulation ?`)) {
                    handleCancelAppointment(appointment.id, true);
                  }
                }}
                disabled={cancelLoading}
                className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium transition disabled:opacity-50"
              >
                {cancelLoading ? 'Annulation...' : (
                  <>
                    Annuler (50% de frais)
                    <span className="block text-xs text-red-500 mt-0.5">
                      Moins de 48h avant le RDV
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Bouton de signalement no-show (rendez-vous passés) */}
        {canReportNoShow(appointment) && appointment.status !== 'no_show' && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                setReportingAppointment(appointment);
                setShowReportModal(true);
              }}
              className="w-full px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium transition flex items-center justify-center gap-2"
              aria-label="Signaler que le professionnel ne s'est pas présenté"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Le professionnel ne s'est pas présenté
            </button>
          </div>
        )}

        {/* Bouton Laisser un avis (rendez-vous terminés ou passés acceptés) */}
        {(appointment.status === 'completed' || (appointment.status === 'accepted' && isPast)) && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            {reviewedAppointments.has(appointment.id) ? (
              <div className="w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Avis déjà laissé
              </div>
            ) : (
              <Link
                href={`/reviews/create?booking=${appointment.id}&educator=${appointment.educator?.id}`}
                className="w-full px-3 py-2 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#f0879f' }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Laisser un avis
              </Link>
            )}
          </div>
        )}
      </div>
    );
  };

  const SectionHeader = ({ title, count, icon, color }: { title: string; count: number; icon: React.ReactNode; color: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{count} rendez-vous</p>
      </div>
    </div>
  );

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#027e7e' }} role="status" aria-label="Chargement en cours"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar */}
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      <div className="flex-1 max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        {/* Flèche retour */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          aria-label="Retour à la page précédente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Retour</span>
        </button>

        {/* En-tête avec icône */}
        <div className="mb-3 sm:mb-4 md:mb-6 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#027e7e' }}>
            <img src="/images/icons/4.svg" alt="" className="w-full h-full" />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Mes rendez-vous</h1>
          <p className="text-gray-500 text-[11px] md:text-sm mt-1">Gérez et suivez vos rendez-vous</p>
        </div>

        {/* Onglets */}
        <div className="flex bg-white rounded-xl p-1 mb-3 sm:mb-4 md:mb-6 shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'appointments'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'appointments' ? { backgroundColor: '#027e7e' } : {}}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Rendez-vous
            </span>
          </button>
          <button
            onClick={() => setActiveTab('caregivers')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'caregivers'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'caregivers' ? { backgroundColor: '#027e7e' } : {}}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Mes soignants
              {uniqueCaregivers.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: activeTab === 'caregivers' ? 'rgba(255,255,255,0.2)' : '#e6f4f4', color: activeTab === 'caregivers' ? 'white' : '#027e7e' }} aria-label={`${uniqueCaregivers.length} soignants`}>
                  {uniqueCaregivers.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Contenu de l'onglet Rendez-vous */}
        {activeTab === 'appointments' && (
          <>
        {/* Boutons de filtre */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
          {/* Tous */}
          <button
            onClick={() => appointments.length > 0 && selectFilter('all')}
            disabled={appointments.length === 0}
            className={`rounded-xl p-3 text-center transition-all ${
              appointments.length === 0
                ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                : activeFilter === 'all'
                  ? 'bg-gray-300 ring-2 ring-gray-500'
                  : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
            }`}
          >
            <p className="text-2xl font-bold text-gray-700">{appointments.length}</p>
            <p className="text-xs text-gray-600 mt-1">Tous</p>
          </button>

          {/* À venir */}
          <button
            onClick={() => upcomingAppointments.length > 0 && selectFilter('upcoming')}
            disabled={upcomingAppointments.length === 0}
            className={`rounded-xl p-3 text-center transition-all ${
              upcomingAppointments.length === 0
                ? 'bg-emerald-50 opacity-60 cursor-not-allowed'
                : activeFilter === 'upcoming'
                  ? 'bg-emerald-200 ring-2 ring-emerald-500'
                  : 'bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
            }`}
          >
            <p className="text-2xl font-bold text-emerald-600">{upcomingAppointments.length}</p>
            <p className="text-xs text-emerald-700 mt-1">À venir</p>
          </button>

          {/* Passés */}
          <button
            onClick={() => pastAppointments.length > 0 && selectFilter('past')}
            disabled={pastAppointments.length === 0}
            className={`rounded-xl p-3 text-center transition-all ${
              pastAppointments.length === 0
                ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                : activeFilter === 'past'
                  ? 'bg-gray-300 ring-2 ring-gray-500'
                  : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'
            }`}
          >
            <p className="text-2xl font-bold text-gray-600">{pastAppointments.length}</p>
            <p className="text-xs text-gray-600 mt-1">Passés</p>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: '#027e7e' }} role="status" aria-label="Chargement des rendez-vous"></div>
            <p className="text-gray-500 mt-4 text-sm">Chargement...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e6f4f4' }}>
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#027e7e' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Aucun rendez-vous</h3>
            <p className="text-gray-500 mt-2 text-sm">Vous n'avez pas encore de rendez-vous.</p>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center px-5 py-2.5 text-white rounded-xl font-medium hover:opacity-90 transition"
              style={{ backgroundColor: '#f0879f' }}
              aria-label="Trouver un professionnel"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Trouver un professionnel
            </Link>
          </div>
        ) : activeFilter === null ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Sélectionnez une catégorie</h3>
            <p className="text-gray-500 mt-2 text-sm">Cliquez sur un des boutons ci-dessus pour afficher les rendez-vous</p>
          </div>
        ) : (
          <div className="space-y-8">
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
                  {upcomingAppointments.map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              </section>
            )}

            {/* Section: Passés */}
            {(activeFilter === 'all' || activeFilter === 'past') && pastAppointments.length > 0 && (
              <section>
                <SectionHeader
                  title="Historique"
                  count={pastAppointments.length}
                  icon={<svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
                  color="bg-gray-200"
                />
                <div className="space-y-3">
                  {pastAppointments.map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
          </>
        )}

        {/* Contenu de l'onglet Mes soignants */}
        {activeTab === 'caregivers' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: '#027e7e' }} role="status" aria-label="Chargement des soignants"></div>
                <p className="text-gray-500 mt-4 text-sm">Chargement...</p>
              </div>
            ) : uniqueCaregivers.length === 0 ? (
              <div className="text-center py-8 md:py-12 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4" style={{ backgroundColor: '#e6f4f4' }}>
                  <svg className="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#027e7e' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900">Aucun soignant rencontré</h3>
                <p className="text-gray-500 mt-2 text-xs md:text-sm">Les professionnels avec qui vous avez eu des rendez-vous apparaîtront ici.</p>
                <Link
                  href="/dashboard/family/search"
                  className="mt-4 md:mt-6 inline-flex items-center px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base text-white rounded-lg md:rounded-xl font-medium hover:opacity-90 transition"
                  style={{ backgroundColor: '#f0879f' }}
                  aria-label="Trouver un professionnel"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Trouver un professionnel
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  {uniqueCaregivers.length} professionnel{uniqueCaregivers.length > 1 ? 's' : ''} rencontré{uniqueCaregivers.length > 1 ? 's' : ''}
                </p>
                {uniqueCaregivers.map((caregiver) => (
                  <Link
                    key={caregiver.id}
                    href={`/educator/${caregiver.id}/book-appointment`}
                    className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4"
                    style={{ borderColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#c9eaea'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {caregiver.avatar_url || caregiver.profile_image_url ? (
                          <img
                            src={caregiver.avatar_url || caregiver.profile_image_url}
                            alt={`${caregiver.first_name} ${caregiver.last_name}`}
                            className="h-14 w-14 rounded-full object-cover border-2"
                            style={{ borderColor: '#e6f4f4' }}
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full overflow-hidden border-2" style={{ background: 'linear-gradient(135deg, #027e7e 0%, #3a9e9e 100%)', borderColor: '#e6f4f4' }}>
                            <img
                              src={getEducatorIcon(caregiver.id)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {caregiver.first_name} {caregiver.last_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#3a9e9e' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {caregiver.appointmentCount} rendez-vous
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Dernier : {new Date(caregiver.lastAppointmentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>

                      {/* Flèche */}
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#027e7e' }}>
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

      {/* Modal de signalement no-show */}
      {showReportModal && reportingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-white rounded-xl md:rounded-2xl max-w-md w-full p-4 sm:p-5 md:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 md:h-6 md:w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 id="modal-title" className="text-base md:text-lg font-semibold text-gray-900">Signaler un problème</h3>
                <p className="text-sm text-gray-500">Le professionnel ne s'est pas présenté</p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 sm:p-3 mb-3 md:mb-4">
              <p className="text-sm text-orange-800">
                <strong>Rendez-vous avec:</strong> {reportingAppointment.educator?.first_name} {reportingAppointment.educator?.last_name}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                {new Date(reportingAppointment.appointment_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })} de {reportingAppointment.start_time} à {reportingAppointment.end_time}
              </p>
            </div>

            <div className="mb-3 md:mb-4">
              <label htmlFor="report-description" className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
                Description (optionnel)
              </label>
              <textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-2.5 py-1.5 md:px-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs md:text-sm"
                rows={3}
                placeholder="Décrivez la situation si vous le souhaitez..."
                aria-describedby="report-description-help"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 mb-3 md:mb-4">
              <p id="report-description-help" className="text-xs text-gray-600">
                Ce signalement sera transmis à notre équipe. Si ce professionnel accumule 3 signalements,
                il sera temporairement suspendu de la plateforme.
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportingAppointment(null);
                  setReportDescription('');
                }}
                className="flex-1 px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm md:text-base font-medium transition"
                disabled={reportLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleReportNoShow}
                className="flex-1 px-3 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm md:text-base font-medium transition flex items-center justify-center gap-2"
                disabled={reportLoading}
                aria-label="Confirmer le signalement"
              >
                {reportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status" aria-label="Envoi en cours"></div>
                    Envoi...
                  </>
                ) : (
                  'Confirmer le signalement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer teal */}
      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
