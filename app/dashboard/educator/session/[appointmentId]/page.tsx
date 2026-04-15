'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import EducatorNavbar from '@/components/EducatorNavbar';

interface ChildProfile {
  id: string;
  first_name: string;
  age: number | null;
  description: string | null;
  accompaniment_types: string[];
  accompaniment_goals: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  progress: number;
  target_date: string | null;
  created_at: string;
}

interface SessionNote {
  id: string;
  session_date: string;
  title: string | null;
  activities: string | null;
  observations: string | null;
  created_at: string;
  added_by_educator_id: string | null;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  mastery_level: string;
  notes: string | null;
}

interface Preference {
  id: string;
  type: string;
  name: string;
  description: string | null;
  effectiveness: string | null;
}

interface ExternalLink {
  id: string;
  title: string;
  link_type: string;
  url: string | null;
  description: string | null;
  document_date: string | null;
  professional_name: string | null;
  created_at: string;
}

interface PPAData {
  id: string;
  child_id: string;
  educator_name: string;
  educator_structure: string;
  evaluation_date: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  previous_support: string;
  schooling_history: string;
  family_context: string;
  significant_events: string;
  life_events: string;
  school_info: string;
  other_professionals: string;
  family_expectations: string;
  comm_receptive: string;
  comm_expressive: string;
  comm_written: string;
  autonomy_personal: string;
  autonomy_domestic: string;
  autonomy_community: string;
  social_interpersonal: string;
  social_leisure: string;
  social_adaptation: string;
  motor_global: string;
  motor_fine: string;
  sensory_profile: string;
  behavior_general: string;
  behavior_strategies: string;
  cognitive_attention: string;
  cognitive_memory: string;
  cognitive_executive: string;
  synthesis: string;
  priorities: string;
  recommendations: string;
  next_steps: string;
  review_date: string;
  updated_at: string;
}

interface Appointment {
  id: string;
  child_id: string;
  family_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  started_at: string | null;
  child_profiles: ChildProfile;
  family_profiles: {
    first_name: string;
    last_name: string;
  };
}

type TabType = 'overview' | 'goals' | 'sessions' | 'skills' | 'preferences' | 'documents' | 'ppa';

const categoryLabels: Record<string, string> = {
  communication: 'Communication',
  autonomie: 'Autonomie',
  socialisation: 'Socialisation',
  comportement: 'Comportement',
  motricite: 'Motricité',
  scolaire: 'Scolaire',
  sensoriel: 'Sensoriel',
  jeu: 'Jeu',
  loisirs: 'Loisirs',
  autre: 'Autre',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  atteint: { label: 'Atteint', color: 'bg-green-100 text-green-700' },
  pause: { label: 'En pause', color: 'bg-yellow-100 text-yellow-700' },
  abandonne: { label: 'Abandonné', color: 'bg-gray-100 text-gray-700' },
};

const masteryLabels: Record<string, { label: string; color: string; level: number }> = {
  non_acquis: { label: 'Non acquis', color: 'bg-gray-100 text-gray-600', level: 0 },
  en_emergence: { label: 'En émergence', color: 'bg-red-100 text-red-700', level: 1 },
  en_cours: { label: 'En cours', color: 'bg-orange-100 text-orange-700', level: 2 },
  acquis_avec_aide: { label: 'Acquis avec aide', color: 'bg-yellow-100 text-yellow-700', level: 3 },
  acquis: { label: 'Acquis', color: 'bg-green-100 text-green-700', level: 4 },
};

const preferenceTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  reinforcer: { label: 'Renforçateur', icon: '⭐', color: 'bg-yellow-50 border-yellow-200' },
  interest: { label: "Centre d'intérêt", icon: '❤️', color: 'bg-pink-50 border-pink-200' },
  avoid: { label: 'À éviter', icon: '⚠️', color: 'bg-red-50 border-red-200' },
};

const linkTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  bilan_ortho: { label: 'Bilan orthophonique', icon: '🗣️', color: 'bg-blue-50 border-blue-200' },
  bilan_psychomot: { label: 'Bilan psychomoteur', icon: '🏃', color: 'bg-green-50 border-green-200' },
  bilan_neuropsy: { label: 'Bilan neuropsychologique', icon: '🧠', color: 'bg-purple-50 border-purple-200' },
  bilan_ergo: { label: 'Bilan ergothérapie', icon: '✋', color: 'bg-orange-50 border-orange-200' },
  diagnostic: { label: 'Diagnostic / CR médical', icon: '📋', color: 'bg-red-50 border-red-200' },
  certificat_mdph: { label: 'Document MDPH', icon: '📄', color: 'bg-indigo-50 border-indigo-200' },
  pps: { label: 'PPS / PAP', icon: '🎓', color: 'bg-yellow-50 border-yellow-200' },
  autre: { label: 'Autre document', icon: '📎', color: 'bg-gray-50 border-gray-200' },
};

export default function EducatorSessionDossierPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.appointmentId as string;

  const [profile, setProfile] = useState<any>(null);
  const [educatorId, setEducatorId] = useState<string>('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Data states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [ppaData, setPpaData] = useState<PPAData | null>(null);
  const [ppaLoading, setPpaLoading] = useState(false);
  const [ppaSaving, setPpaSaving] = useState(false);
  const [ppaEditing, setPpaEditing] = useState(false);
  const [editedPpa, setEditedPpa] = useState<Partial<PPAData>>({});

  // Modal states
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [sessionForm, setSessionForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    title: '',
    activities: '',
    observations: '',
  });

  const [skillForm, setSkillForm] = useState({
    name: '',
    category: 'communication',
    mastery_level: 'non_acquis',
    notes: '',
  });

  const [linkForm, setLinkForm] = useState({
    title: '',
    link_type: 'bilan_ortho',
    url: '',
    description: '',
    document_date: '',
    professional_name: '',
  });

  useEffect(() => {
    fetchData();
  }, [appointmentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Récupérer le profil éducateur
      const { data: educatorProfile } = await supabase
        .from('educator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!educatorProfile) {
        router.push('/dashboard/family');
        return;
      }

      setProfile(educatorProfile);
      setEducatorId(educatorProfile.id);

      // Récupérer le rendez-vous
      const appointmentResult = await supabase
        .from('appointments')
        .select(`
          *,
          child_profiles (id, first_name, age, description, accompaniment_types, accompaniment_goals),
          family_profiles (first_name, last_name)
        `)
        .eq('id', appointmentId)
        .eq('educator_id', educatorProfile.id)
        .single();

      const appointmentData = appointmentResult.data;
      const appointmentError = appointmentResult.error;

      if (appointmentError || !appointmentData) {
        router.push('/dashboard/educator/appointments');
        return;
      }

      // Vérifier que la session est démarrée ou le RDV est en cours
      if (!appointmentData.started_at && appointmentData.status !== 'accepted') {
        router.push('/dashboard/educator/appointments');
        return;
      }

      setAppointment(appointmentData);
      setChild(appointmentData.child_profiles);

      if (appointmentData.child_id) {
        // Charger les données du dossier
        await Promise.all([
          fetchGoals(appointmentData.child_id),
          fetchSessions(appointmentData.child_id),
          fetchSkills(appointmentData.child_id),
          fetchPreferences(appointmentData.child_id),
          fetchExternalLinks(appointmentData.child_id),
          fetchPPA(appointmentData.child_id),
        ]);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async (childId: string) => {
    const { data } = await supabase
      .from('child_educational_goals')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    setGoals(data || []);
  };

  const fetchSessions = async (childId: string) => {
    const { data } = await supabase
      .from('child_session_notes')
      .select('*')
      .eq('child_id', childId)
      .order('session_date', { ascending: false });
    setSessions(data || []);
  };

  const fetchSkills = async (childId: string) => {
    const { data } = await supabase
      .from('child_skills')
      .select('*')
      .eq('child_id', childId)
      .order('category', { ascending: true });
    setSkills(data || []);
  };

  const fetchPreferences = async (childId: string) => {
    const { data } = await supabase
      .from('child_preferences')
      .select('*')
      .eq('child_id', childId)
      .order('type', { ascending: true });
    setPreferences(data || []);
  };

  const fetchExternalLinks = async (childId: string) => {
    const { data } = await supabase
      .from('child_external_links')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    setExternalLinks(data || []);
  };

  const fetchPPA = async (childId: string) => {
    setPpaLoading(true);
    try {
      const { data, error } = await supabase
        .from('child_ppa')
        .select('*')
        .eq('child_id', childId)
        .maybeSingle();

      if (error) throw error;
      setPpaData(data);
      if (data) {
        setEditedPpa(data);
      }
    } catch (err) {
      console.error('Erreur chargement PPA:', err);
    } finally {
      setPpaLoading(false);
    }
  };

  const handleSavePPA = async () => {
    if (!child) return;
    setPpaSaving(true);
    try {
      if (ppaData) {
        // Mise à jour
        const { error } = await supabase
          .from('child_ppa')
          .update({
            ...editedPpa,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ppaData.id);
        if (error) throw error;
      } else {
        // Création
        const { error } = await supabase
          .from('child_ppa')
          .insert({
            child_id: child.id,
            ...editedPpa,
          });
        if (error) throw error;
      }
      await fetchPPA(child.id);
      setPpaEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPpaSaving(false);
    }
  };

  // Handlers pour ajouter des éléments
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('child_session_notes').insert({
        child_id: child.id,
        added_by_educator_id: educatorId,
        ...sessionForm,
      });
      if (error) throw error;
      await fetchSessions(child.id);
      setShowSessionModal(false);
      setSessionForm({
        session_date: new Date().toISOString().split('T')[0],
        title: '',
        activities: '',
        observations: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('child_skills').insert({
        child_id: child.id,
        ...skillForm,
      });
      if (error) throw error;
      await fetchSkills(child.id);
      setShowSkillModal(false);
      setSkillForm({ name: '', category: 'communication', mastery_level: 'non_acquis', notes: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('child_external_links').insert({
        child_id: child.id,
        added_by_educator_id: educatorId,
        title: linkForm.title,
        link_type: linkForm.link_type,
        url: linkForm.url || null,
        description: linkForm.description || null,
        document_date: linkForm.document_date || null,
        professional_name: linkForm.professional_name || null,
      });
      if (error) throw error;
      await fetchExternalLinks(child.id);
      setShowLinkModal(false);
      setLinkForm({ title: '', link_type: 'bilan_ortho', url: '', description: '', document_date: '', professional_name: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSkillLevel = async (skillId: string, newLevel: string) => {
    if (!child) return;
    try {
      const { error } = await supabase
        .from('child_skills')
        .update({ mastery_level: newLevel, last_evaluated_at: new Date().toISOString() })
        .eq('id', skillId);
      if (error) throw error;
      await fetchSkills(child.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, progress: number) => {
    if (!child) return;
    try {
      const { error } = await supabase
        .from('child_educational_goals')
        .update({
          progress,
          status: progress >= 100 ? 'atteint' : 'en_cours'
        })
        .eq('id', goalId);
      if (error) throw error;
      await fetchGoals(child.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="sticky top-0 z-40">
          <EducatorNavbar profile={profile} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100 mx-4 px-12">
            <div className="animate-spin rounded-full h-20 w-20 border-4 mx-auto" style={{ borderTopColor: '#41005c', borderRightColor: '#5a1a75', borderBottomColor: '#8b5cf6', borderLeftColor: 'rgba(65, 0, 92, 0.2)' }}></div>
            <p className="text-gray-700 font-semibold mt-6 text-lg">Chargement du dossier...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!child || !appointment) {
    return null;
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Résumé', labelShort: 'Résumé', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'goals' as TabType, label: 'Objectifs', labelShort: 'Objectifs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'sessions' as TabType, label: 'Séances', labelShort: 'Séances', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'skills' as TabType, label: 'Compétences', labelShort: 'Skills', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'preferences' as TabType, label: 'Préférences', labelShort: 'Préférences', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { id: 'documents' as TabType, label: 'Bilans & Docs', labelShort: 'Bilans', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'ppa' as TabType, label: 'PPA', labelShort: 'PPA', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  // Statistiques pour la vue d'ensemble
  const stats = {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status === 'en_cours').length,
    achievedGoals: goals.filter(g => g.status === 'atteint').length,
    totalSessions: sessions.length,
    recentSessions: sessions.filter(s => {
      const date = new Date(s.session_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    }).length,
    totalSkills: skills.length,
    acquiredSkills: skills.filter(s => s.mastery_level === 'acquis' || s.mastery_level === 'acquis_avec_aide').length,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40">
        <EducatorNavbar profile={profile} />
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        {/* Bouton retour */}
        <Link
          href="/dashboard/educator/appointments?tab=in_progress"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-xs md:text-sm"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux rendez-vous
        </Link>

        {/* Header avec infos enfant */}
        <div className="rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 text-white" style={{ background: 'linear-gradient(135deg, #41005c 0%, #5a1a75 50%, #8b5cf6 100%)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-18 sm:h-18 bg-white/20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0 backdrop-blur">
                {child.first_name[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-green-400 text-green-900 text-xs font-bold rounded-full animate-pulse">
                    Session en cours
                  </span>
                </div>
                <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold">Dossier de {child.first_name}</h1>
                <p className="text-white/90 text-[11px] sm:text-xs md:text-sm lg:text-base">
                  {child.age ? `${child.age} ans` : ''}
                  {appointment.family_profiles && ` - Famille ${appointment.family_profiles.first_name} ${appointment.family_profiles.last_name}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 mb-3 sm:mb-4 md:mb-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-4 font-medium text-[10px] sm:text-sm whitespace-nowrap border-b-2 transition flex-1 sm:flex-none min-w-0 ${
                  activeTab === tab.id
                    ? 'border-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === tab.id ? { borderColor: '#41005c', color: '#41005c' } : {}}
              >
                <svg className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="sm:hidden truncate">{tab.labelShort}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-3 sm:mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-r text-xs md:text-sm">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
          </div>
        )}

        {/* Contenu des onglets */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 p-3 sm:p-4 md:p-6">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Vue d'ensemble</h2>

              {/* Description de l'enfant */}
              {child.description && (
                <div className="p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h3 className="font-medium text-purple-900 mb-1 sm:mb-2 text-xs md:text-sm">Description</h3>
                  <p className="text-[11px] md:text-sm text-purple-800">{child.description}</p>
                </div>
              )}

              {/* Objectifs d'accompagnement */}
              {child.accompaniment_goals && (
                <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-medium text-blue-900 mb-1 sm:mb-2 text-xs md:text-sm">Objectifs d'accompagnement</h3>
                  <p className="text-[11px] md:text-sm text-blue-800">{child.accompaniment_goals}</p>
                </div>
              )}

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <div className="rounded-xl p-2.5 sm:p-3 md:p-4 border" style={{ backgroundColor: 'rgba(65, 0, 92, 0.1)', borderColor: 'rgba(65, 0, 92, 0.2)' }}>
                  <p className="text-[11px] md:text-sm font-medium" style={{ color: '#41005c' }}>Objectifs actifs</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: '#41005c' }}>{stats.activeGoals}/{stats.totalGoals}</p>
                </div>
                <div className="rounded-xl p-2.5 sm:p-3 md:p-4 border" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                  <p className="text-[11px] md:text-sm font-medium" style={{ color: '#8b5cf6' }}>Objectifs atteints</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: '#8b5cf6' }}>{stats.achievedGoals}</p>
                </div>
                <div className="rounded-xl p-2.5 sm:p-3 md:p-4 border" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', borderColor: 'rgba(240, 135, 159, 0.2)' }}>
                  <p className="text-[11px] md:text-sm font-medium" style={{ color: '#f0879f' }}>Séances (30j)</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: '#f0879f' }}>{stats.recentSessions}</p>
                </div>
                <div className="rounded-xl p-2.5 sm:p-3 md:p-4 border" style={{ backgroundColor: 'rgba(90, 26, 117, 0.1)', borderColor: 'rgba(90, 26, 117, 0.2)' }}>
                  <p className="text-[11px] md:text-sm font-medium" style={{ color: '#5a1a75' }}>Compétences acquises</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: '#5a1a75' }}>{stats.acquiredSkills}/{stats.totalSkills}</p>
                </div>
              </div>

              {/* Derniers objectifs */}
              {goals.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Objectifs en cours</h3>
                  <div className="space-y-2">
                    {goals.filter(g => g.status === 'en_cours').slice(0, 3).map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            {categoryLabels[goal.category]}
                          </span>
                          <span className="text-sm text-gray-900">{goal.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${goal.progress}%`, backgroundColor: '#41005c' }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{goal.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Objectifs */}
          {activeTab === 'goals' && (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Objectifs éducatifs</h2>
              </div>

              {goals.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 text-xs md:text-sm">Aucun objectif défini.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="border border-gray-200 rounded-xl p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusLabels[goal.status]?.color}`}>
                              {statusLabels[goal.status]?.label}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {categoryLabels[goal.category]}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Barre de progression modifiable */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Progression</span>
                          <span className="text-sm font-medium text-gray-900">{goal.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${goal.progress}%`, backgroundColor: '#41005c' }}
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          {[0, 25, 50, 75, 100].map((value) => (
                            <button
                              key={value}
                              onClick={() => handleUpdateGoalProgress(goal.id, value)}
                              className={`px-2 py-1 text-xs rounded transition ${
                                goal.progress === value
                                  ? 'text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              style={goal.progress === value ? { backgroundColor: '#41005c' } : {}}
                            >
                              {value}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Séances */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Notes de séances</h2>
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-white rounded-xl hover:opacity-90 transition text-xs sm:text-sm font-semibold shadow-md"
                  style={{ backgroundColor: '#41005c' }}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter une note
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 text-xs md:text-sm mb-3 sm:mb-4">Aucune note de séance.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-xl p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {session.title || `Séance du ${new Date(session.session_date).toLocaleDateString('fr-FR')}`}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {new Date(session.session_date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        {session.added_by_educator_id === educatorId && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            Par vous
                          </span>
                        )}
                      </div>

                      {session.activities && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Activités</p>
                          <p className="text-sm text-gray-700">{session.activities}</p>
                        </div>
                      )}

                      {session.observations && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Observations</p>
                          <p className="text-sm text-gray-700">{session.observations}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Compétences */}
          {activeTab === 'skills' && (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Compétences</h2>
                <button
                  onClick={() => setShowSkillModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-white rounded-xl hover:opacity-90 transition text-xs sm:text-sm font-semibold shadow-md"
                  style={{ backgroundColor: '#5a1a75' }}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              </div>

              {skills.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 text-xs md:text-sm">Aucune compétence enregistrée.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(categoryLabels).map(([category, label]) => {
                    const categorySkills = skills.filter(s => s.category === category);
                    if (categorySkills.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="font-medium text-gray-700 mb-2">{label}</h3>
                        <div className="space-y-2">
                          {categorySkills.map((skill) => (
                            <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{skill.name}</p>
                                {skill.notes && (
                                  <p className="text-xs text-gray-500">{skill.notes}</p>
                                )}
                              </div>
                              <select
                                value={skill.mastery_level}
                                onChange={(e) => handleUpdateSkillLevel(skill.id, e.target.value)}
                                className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer ${masteryLabels[skill.mastery_level]?.color}`}
                              >
                                {Object.entries(masteryLabels).map(([value, { label }]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Préférences (lecture seule) */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">Préférences</h2>

              {preferences.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 text-xs md:text-sm">Aucune préférence enregistrée par la famille.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  {Object.entries(preferenceTypeLabels).map(([type, { label, icon, color }]) => {
                    const typePrefs = preferences.filter(p => p.type === type);
                    if (typePrefs.length === 0) return null;

                    return (
                      <div key={type} className={`border rounded-xl p-3 sm:p-4 ${color}`}>
                        <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-xs md:text-sm">
                          <span>{icon}</span> {label}
                        </h3>
                        <div className="space-y-2">
                          {typePrefs.map((pref) => (
                            <div key={pref.id} className="bg-white/70 rounded-lg p-2">
                              <p className="font-medium text-gray-900">{pref.name}</p>
                              {pref.description && (
                                <p className="text-xs text-gray-600">{pref.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Documents / Liens externes */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Bilans & Documents</h2>
                  <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 sm:mt-1">Liens vers les bilans et documents externes</p>
                </div>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-white rounded-xl hover:opacity-90 transition text-xs sm:text-sm font-semibold shadow-md"
                  style={{ backgroundColor: '#41005c' }}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un lien
                </button>
              </div>

              {externalLinks.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 text-xs md:text-sm">Aucun document référencé.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(linkTypeLabels).map(([type, { label, icon, color }]) => {
                    const typeLinks = externalLinks.filter(l => l.link_type === type);
                    if (typeLinks.length === 0) return null;

                    return (
                      <div key={type}>
                        <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span>{icon}</span> {label}
                        </h3>
                        <div className="space-y-2">
                          {typeLinks.map((link) => (
                            <div key={link.id} className={`border rounded-xl p-3 sm:p-4 ${color}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900">{link.title}</h4>
                                    {link.document_date && (
                                      <span className="text-xs text-gray-500 bg-white/50 px-2 py-0.5 rounded">
                                        {new Date(link.document_date).toLocaleDateString('fr-FR')}
                                      </span>
                                    )}
                                  </div>
                                  {link.professional_name && (
                                    <p className="text-sm text-gray-600 mb-1">Par : {link.professional_name}</p>
                                  )}
                                  {link.description && (
                                    <p className="text-sm text-gray-600">{link.description}</p>
                                  )}
                                  {link.url && (
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm font-medium mt-2 hover:underline"
                                      style={{ color: '#41005c' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Ouvrir le lien
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PPA - Projet Personnalisé d'Accompagnement */}
          {activeTab === 'ppa' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Projet Personnalisé d'Accompagnement</h2>
                  <p className="text-sm text-gray-500">Évaluation et plan d'accompagnement de l'enfant</p>
                </div>
                {ppaData && !ppaEditing && (
                  <button
                    onClick={() => setPpaEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition shadow-sm hover:opacity-90"
                    style={{ backgroundColor: '#41005c' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifier
                  </button>
                )}
              </div>

              {ppaLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#41005c' }}></div>
                </div>
              ) : !ppaData && !ppaEditing ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 mb-4">Aucun PPA créé pour cet enfant</p>
                  <button
                    onClick={() => setPpaEditing(true)}
                    className="px-4 py-2 text-white rounded-lg text-sm font-medium transition shadow-sm hover:opacity-90"
                    style={{ backgroundColor: '#41005c' }}
                  >
                    Créer le PPA
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {ppaEditing && (
                    <div className="flex justify-end gap-3 mb-4">
                      <button
                        onClick={() => {
                          setPpaEditing(false);
                          setEditedPpa(ppaData || {});
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSavePPA}
                        disabled={ppaSaving}
                        className="px-4 py-2 text-white rounded-lg text-sm font-medium transition shadow-sm hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#41005c' }}
                      >
                        {ppaSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  )}

                  {/* Section Identification */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#41005c' }}>1</span>
                      Identification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'éducateur</label>
                        {ppaEditing ? (
                          <input
                            type="text"
                            value={editedPpa.educator_name || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, educator_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                          />
                        ) : (
                          <p className="text-gray-900">{ppaData?.educator_name || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Structure</label>
                        {ppaEditing ? (
                          <input
                            type="text"
                            value={editedPpa.educator_structure || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, educator_structure: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                          />
                        ) : (
                          <p className="text-gray-900">{ppaData?.educator_structure || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date d'évaluation</label>
                        {ppaEditing ? (
                          <input
                            type="date"
                            value={editedPpa.evaluation_date || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, evaluation_date: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                          />
                        ) : (
                          <p className="text-gray-900">{ppaData?.evaluation_date ? new Date(ppaData.evaluation_date).toLocaleDateString('fr-FR') : '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Anamnèse */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#41005c' }}>2</span>
                      Anamnèse
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Accompagnements antérieurs</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.previous_support || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, previous_support: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.previous_support || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parcours scolaire</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.schooling_history || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, schooling_history: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.schooling_history || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contexte familial</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.family_context || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, family_context: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.family_context || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Communication */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#41005c' }}>3</span>
                      Communication
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Communication réceptive</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.comm_receptive || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, comm_receptive: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.comm_receptive || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Communication expressive</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.comm_expressive || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, comm_expressive: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.comm_expressive || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Autonomie */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#41005c' }}>4</span>
                      Autonomie
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Autonomie personnelle</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.autonomy_personal || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, autonomy_personal: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.autonomy_personal || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Autonomie domestique</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.autonomy_domestic || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, autonomy_domestic: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.autonomy_domestic || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Socialisation */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#41005c' }}>5</span>
                      Socialisation
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relations interpersonnelles</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.social_interpersonal || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, social_interpersonal: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.social_interpersonal || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loisirs et activités</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.social_leisure || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, social_leisure: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.social_leisure || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Comportement */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#41005c' }}>6</span>
                      Comportement
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comportement général</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.behavior_general || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, behavior_general: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.behavior_general || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stratégies d'intervention</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.behavior_strategies || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, behavior_strategies: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.behavior_strategies || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Synthèse et Recommandations */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#41005c' }}>7</span>
                      Synthèse et Recommandations
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Synthèse</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.synthesis || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, synthesis: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={4}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.synthesis || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priorités</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.priorities || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, priorities: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.priorities || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recommandations</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.recommendations || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, recommendations: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={4}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.recommendations || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prochaines étapes</label>
                        {ppaEditing ? (
                          <textarea
                            value={editedPpa.next_steps || ''}
                            onChange={(e) => setEditedPpa({ ...editedPpa, next_steps: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:outline-none"
                            style={{ '--tw-ring-color': '#41005c' } as any}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-900 whitespace-pre-wrap">{ppaData?.next_steps || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {ppaData?.updated_at && (
                    <p className="text-sm text-gray-500 text-center">
                      Dernière mise à jour : {new Date(ppaData.updated_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Séance */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Note de séance</h2>
              <button onClick={() => setShowSessionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={sessionForm.session_date}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#41005c' } as any}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre (optionnel)</label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#41005c' } as any}
                  placeholder="Ex: Séance communication"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Activités réalisées</label>
                <textarea
                  value={sessionForm.activities}
                  onChange={(e) => setSessionForm({ ...sessionForm, activities: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#41005c' } as any}
                  rows={3}
                  placeholder="Qu'avez-vous travaillé ?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observations</label>
                <textarea
                  value={sessionForm.observations}
                  onChange={(e) => setSessionForm({ ...sessionForm, observations: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#41005c' } as any}
                  rows={3}
                  placeholder="Observations factuelles..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#41005c' }}
                >
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Compétence */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouvelle compétence</h2>
              <button onClick={() => setShowSkillModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSkill} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#5a1a75' } as any}
                  placeholder="Ex: S'habiller seul"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
                  <select
                    value={skillForm.category}
                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#5a1a75' } as any}
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau actuel</label>
                  <select
                    value={skillForm.mastery_level}
                    onChange={(e) => setSkillForm({ ...skillForm, mastery_level: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#5a1a75' } as any}
                  >
                    {Object.entries(masteryLabels).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={skillForm.notes}
                  onChange={(e) => setSkillForm({ ...skillForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#5a1a75' } as any}
                  rows={2}
                  placeholder="Contexte, observations..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#5a1a75' }}
                >
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lien externe */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Ajouter un lien</h2>
              <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddLink} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de document</label>
                <select
                  value={linkForm.link_type}
                  onChange={(e) => setLinkForm({ ...linkForm, link_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#41005c' } as any}
                >
                  {Object.entries(linkTypeLabels).map(([value, { label, icon }]) => (
                    <option key={value} value={value}>{icon} {label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={linkForm.title}
                  onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#41005c' } as any}
                  placeholder="Ex: Bilan orthophonique janvier 2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date du document</label>
                  <input
                    type="date"
                    value={linkForm.document_date}
                    onChange={(e) => setLinkForm({ ...linkForm, document_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#41005c' } as any}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Professionnel</label>
                  <input
                    type="text"
                    value={linkForm.professional_name}
                    onChange={(e) => setLinkForm({ ...linkForm, professional_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#41005c' } as any}
                    placeholder="Ex: Dr. Dupont"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lien URL (optionnel)</label>
                <input
                  type="url"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#41005c' } as any}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={linkForm.description}
                  onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#41005c' } as any}
                  rows={2}
                  placeholder="Conclusions principales..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#41005c' }}
                >
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto" style={{ backgroundColor: '#41005c', height: '40px' }}></div>
    </div>
  );
}
