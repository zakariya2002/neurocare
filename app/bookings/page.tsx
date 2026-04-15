'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import EducatorMobileMenu from '@/components/EducatorMobileMenu';
import FamilyMobileMenu from '@/components/FamilyMobileMenu';
import Logo from '@/components/Logo';
import { useToast } from '@/components/Toast';

type AppointmentStatus = 'accepted' | 'rejected' | 'completed' | 'cancelled' | 'no_show';

interface Appointment {
  id: string;
  status: AppointmentStatus;
  appointment_date: string;
  start_time: string;
  end_time: string;
  address?: string;
  notes?: string;
  educator?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    profile_image_url?: string;
    avatar_url?: string;
  };
  family?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past' | null>(null);

  // États pour le signalement no-show
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingAppointment, setReportingAppointment] = useState<Appointment | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const selectFilter = (filter: 'all' | 'upcoming' | 'past') => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchAppointments();
    }
  }, [userProfile]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      const role = session.user.user_metadata?.role;
      const table = role === 'educator' ? 'educator_profiles' : 'family_profiles';

      const { data: profile } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setUserProfile({ ...profile, role });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const isEducator = userProfile.role === 'educator';
      const field = isEducator ? 'educator_id' : 'family_id';

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
          ),
          family:family_profiles(
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq(field, userProfile.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      const messages: Record<string, string> = {
        accepted: 'Rendez-vous accepté !',
        rejected: 'Rendez-vous refusé.',
        cancelled: 'Rendez-vous annulé.',
        completed: 'Rendez-vous marqué comme terminé.'
      };
      showToast(messages[status] || 'Statut mis à jour.');
      fetchAppointments();
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
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
    return a.status === 'completed' || (a.status === 'accepted' && date < today) || a.status === 'rejected' || a.status === 'cancelled';
  });

  const getStatusConfig = (status: AppointmentStatus) => {
    const configs = {
      accepted: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Confirmé', icon: '✓' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Refusé', icon: '✗' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Annulé', icon: '−' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terminé', icon: '✓' },
      no_show: { bg: 'bg-red-100', text: 'text-red-800', label: 'Non présenté', icon: '⚠' }
    };
    return configs[status] || configs.accepted;
  };

  // Fonction pour signaler un no-show
  const handleReportNoShow = async () => {
    if (!reportingAppointment || !userProfile) return;

    setReportLoading(true);
    try {
      const response = await fetch('/api/report-noshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: reportingAppointment.id,
          reporterId: userProfile.id,
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
    // On peut signaler si le rendez-vous est passé (fin dépassée)
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

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const isEducator = userProfile?.role === 'educator';
    const otherParty = isEducator ? appointment.family : appointment.educator;
    const statusConfig = getStatusConfig(appointment.status);
    const appointmentDate = new Date(appointment.appointment_date);
    const isPast = appointmentDate < today;
    const cancelInfo = canCancelAppointment(appointment);

    return (
      <div className={`bg-white rounded-xl border ${isPast ? 'border-gray-200 opacity-75' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all p-4`}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {!isEducator && (appointment.educator?.avatar_url || appointment.educator?.profile_image_url) ? (
              <img
                src={appointment.educator.avatar_url || appointment.educator.profile_image_url}
                alt={`${appointment.educator.first_name} ${appointment.educator.last_name}`}
                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow">
                <span className="text-sm font-bold text-white">
                  {otherParty?.first_name?.[0]}{otherParty?.last_name?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {otherParty?.first_name} {otherParty?.last_name}
              </h3>
              <span className={`${statusConfig.bg} ${statusConfig.text} px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>

            {/* Date et heure */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
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
                {appointment.start_time} - {appointment.end_time}
              </span>
            </div>

            {appointment.address && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {isEducator && (
              <button
                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition"
              >
                Marquer comme terminé
              </button>
            )}
            {cancelInfo.canCancel ? (
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
                    updateAppointmentStatus(appointment.id, 'cancelled');
                  }
                }}
                className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium transition"
              >
                Annuler le rendez-vous
              </button>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  Annulation impossible moins de 48h avant le rendez-vous
                  <br />
                  <span className="text-gray-400">({cancelInfo.hoursRemaining}h restantes)</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bouton de signalement no-show pour les familles (rendez-vous passés) */}
        {!isEducator && canReportNoShow(appointment) && appointment.status !== 'no_show' && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                setReportingAppointment(appointment);
                setShowReportModal(true);
              }}
              className="w-full px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Le professionnel ne s'est pas présenté
            </button>
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

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo - visible sur mobile et desktop */}
            <Logo  />
            {/* Menu mobile (hamburger) */}
            <div className="md:hidden">
              {userProfile?.role === 'educator' ? (
                <EducatorMobileMenu profile={userProfile} onLogout={handleLogout} />
              ) : (
                <FamilyMobileMenu profile={userProfile} onLogout={handleLogout} />
              )}
            </div>
            {/* Menu desktop - caché sur mobile */}
            <div className="hidden md:flex space-x-4 items-center">
              <Link
                href={userProfile?.role === 'educator' ? '/dashboard/educator' : '/dashboard/family'}
                className={`inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                  userProfile?.role === 'educator'
                    ? 'bg-gradient-to-r from-primary-500 to-green-500 hover:from-primary-600 hover:to-green-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Tableau de bord
              </Link>
              <Link
                href={userProfile?.role === 'educator' ? '/dashboard/educator/profile' : '/dashboard/family/profile'}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 font-medium transition"
              >
                Mon profil
              </Link>
              <button onClick={handleLogout} className="text-gray-700 hover:text-primary-600 px-3 py-2 font-medium transition">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-6">
        {/* En-tête */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes rendez-vous</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Gérez et suivez vos rendez-vous</p>
        </div>

        {/* Boutons de filtre */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-8">
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
            <p className="text-xl sm:text-2xl font-bold text-gray-700">{appointments.length}</p>
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
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{upcomingAppointments.length}</p>
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
            <p className="text-xl sm:text-2xl font-bold text-gray-600">{pastAppointments.length}</p>
            <p className="text-xs text-gray-600 mt-1">Passés</p>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4 text-sm">Chargement...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl md:rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Aucun rendez-vous</h3>
            <p className="text-gray-500 mt-2 text-sm">Vous n'avez pas encore de rendez-vous.</p>
            {userProfile?.role === 'family' && (
              <Link
                href="/search"
                className="mt-6 inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Trouver un professionnel
              </Link>
            )}
          </div>
        ) : activeFilter === null ? (
          <div className="text-center py-12 bg-white rounded-xl md:rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  icon={<svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
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
                  icon={<svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
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
      </div>

      {/* Modal de signalement no-show */}
      {showReportModal && reportingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl md:rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Signaler un problème</h3>
                <p className="text-sm text-gray-500">Le professionnel ne s'est pas présenté</p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                rows={3}
                placeholder="Décrivez la situation si vous le souhaitez..."
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600">
                Ce signalement sera transmis à notre équipe. Si ce professionnel accumule 3 signalements,
                il sera temporairement suspendu de la plateforme.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportingAppointment(null);
                  setReportDescription('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
                disabled={reportLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleReportNoShow}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition flex items-center justify-center gap-2"
                disabled={reportLoading}
              >
                {reportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
    </div>
  );
}
