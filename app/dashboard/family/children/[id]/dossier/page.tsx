'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';

// Types
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

interface MdphStatus {
  id: string;
  child_id: string;
  mdph_number: string | null;
  department_code: string | null;
  status: string;
  submission_date: string | null;
  notification_date: string | null;
  start_date: string | null;
  expiry_date: string | null;
  disability_rate: string | null;
  aeeh_status: string;
  aeeh_complement: number | null;
  pch_status: string;
  aesh_status: string;
  aesh_hours_per_week: number | null;
  notes: string | null;
}

type TabType = 'overview' | 'goals' | 'sessions' | 'skills' | 'preferences' | 'documents' | 'mdph';

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
  interest: { label: 'Centre d\'intérêt', icon: '❤️', color: 'bg-pink-50 border-pink-200' },
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

const mdphStatusLabels: Record<string, { label: string; color: string }> = {
  non_depose: { label: 'Non deposé', color: 'bg-gray-100 text-gray-600' },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  accepte: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  renouvellement: { label: 'Renouvellement', color: 'bg-orange-100 text-orange-700' },
};

const disabilityRateLabels: Record<string, string> = {
  moins_50: 'Moins de 50%',
  '50_79': 'Entre 50% et 79%',
  '80_plus': '80% ou plus',
};

const aidStatusLabels: Record<string, { label: string; color: string }> = {
  non_demande: { label: 'Non demandé', color: 'bg-gray-100 text-gray-500' },
  demande: { label: 'Demandé', color: 'bg-blue-100 text-blue-700' },
  accorde: { label: 'Accordé', color: 'bg-green-100 text-green-700' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
};

export default function ChildDossierPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const childId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && ['overview', 'goals', 'sessions', 'skills', 'preferences', 'documents', 'mdph'].includes(tabParam) ? tabParam as TabType : 'overview'
  );

  // Data states
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [mdphStatus, setMdphStatus] = useState<MdphStatus | null>(null);

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showMdphModal, setShowMdphModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'communication',
    specific: '',
    measurable: '',
    target_date: '',
  });

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

  const [preferenceForm, setPreferenceForm] = useState({
    type: 'interest',
    name: '',
    description: '',
    effectiveness: 'efficace',
  });

  const [linkForm, setLinkForm] = useState({
    title: '',
    link_type: 'bilan_ortho',
    url: '',
    description: '',
    document_date: '',
    professional_name: '',
  });

  const defaultMdphForm = {
    mdph_number: '',
    department_code: '',
    status: 'non_depose',
    submission_date: '',
    notification_date: '',
    start_date: '',
    expiry_date: '',
    disability_rate: '',
    aeeh_status: 'non_demande',
    aeeh_complement: '' as string,
    pch_status: 'non_demande',
    aesh_status: 'non_demande',
    aesh_hours_per_week: '' as string,
    notes: '',
  };
  const [mdphForm, setMdphForm] = useState(defaultMdphForm);

  useEffect(() => {
    fetchData();
  }, [childId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      // Récupérer le profil famille
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

      // Récupérer l'enfant
      const { data: childData, error: childError } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', childId)
        .eq('family_id', familyProfile.id)
        .single();

      if (childError || !childData) {
        router.push('/dashboard/family/children');
        return;
      }

      setChild(childData);

      // Charger les données du dossier
      await Promise.all([
        fetchGoals(),
        fetchSessions(),
        fetchSkills(),
        fetchPreferences(),
        fetchExternalLinks(),
        fetchMdphStatus(),
      ]);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('child_educational_goals')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    setGoals(data || []);
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('child_session_notes')
      .select('*')
      .eq('child_id', childId)
      .order('session_date', { ascending: false });
    setSessions(data || []);
  };

  const fetchSkills = async () => {
    const { data } = await supabase
      .from('child_skills')
      .select('*')
      .eq('child_id', childId)
      .order('category', { ascending: true });
    setSkills(data || []);
  };

  const fetchPreferences = async () => {
    const { data } = await supabase
      .from('child_preferences')
      .select('*')
      .eq('child_id', childId)
      .order('type', { ascending: true });
    setPreferences(data || []);
  };

  const fetchExternalLinks = async () => {
    const { data } = await supabase
      .from('child_external_links')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    setExternalLinks(data || []);
  };

  const fetchMdphStatus = async () => {
    const { data } = await supabase
      .from('child_mdph_status')
      .select('*')
      .eq('child_id', childId)
      .maybeSingle();
    setMdphStatus(data || null);
  };

  // Handlers pour ajouter des éléments
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('child_educational_goals').insert({
        child_id: childId,
        ...goalForm,
        target_date: goalForm.target_date || null,
      });
      if (error) throw error;
      await fetchGoals();
      setShowGoalModal(false);
      setGoalForm({ title: '', description: '', category: 'communication', specific: '', measurable: '', target_date: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('child_session_notes').insert({
        child_id: childId,
        ...sessionForm,
      });
      if (error) throw error;
      await fetchSessions();
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
    setSaving(true);
    try {
      const { error } = await supabase.from('child_skills').insert({
        child_id: childId,
        ...skillForm,
      });
      if (error) throw error;
      await fetchSkills();
      setShowSkillModal(false);
      setSkillForm({ name: '', category: 'communication', mastery_level: 'non_acquis', notes: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('child_preferences').insert({
        child_id: childId,
        ...preferenceForm,
      });
      if (error) throw error;
      await fetchPreferences();
      setShowPreferenceModal(false);
      setPreferenceForm({ type: 'interest', name: '', description: '', effectiveness: 'efficace' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('child_external_links').insert({
        child_id: childId,
        added_by_family_id: profile?.id,
        title: linkForm.title,
        link_type: linkForm.link_type,
        url: linkForm.url || null,
        description: linkForm.description || null,
        document_date: linkForm.document_date || null,
        professional_name: linkForm.professional_name || null,
      });
      if (error) throw error;
      await fetchExternalLinks();
      setShowLinkModal(false);
      setLinkForm({ title: '', link_type: 'bilan_ortho', url: '', description: '', document_date: '', professional_name: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Supprimer ce lien ?')) return;
    try {
      const { error } = await supabase
        .from('child_external_links')
        .delete()
        .eq('id', linkId);
      if (error) throw error;
      await fetchExternalLinks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateSkillLevel = async (skillId: string, newLevel: string) => {
    try {
      const { error } = await supabase
        .from('child_skills')
        .update({ mastery_level: newLevel, last_evaluated_at: new Date().toISOString() })
        .eq('id', skillId);
      if (error) throw error;
      await fetchSkills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('child_educational_goals')
        .update({
          progress,
          status: progress >= 100 ? 'atteint' : 'en_cours'
        })
        .eq('id', goalId);
      if (error) throw error;
      await fetchGoals();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openMdphModal = () => {
    if (mdphStatus) {
      setMdphForm({
        mdph_number: mdphStatus.mdph_number || '',
        department_code: mdphStatus.department_code || '',
        status: mdphStatus.status || 'non_depose',
        submission_date: mdphStatus.submission_date || '',
        notification_date: mdphStatus.notification_date || '',
        start_date: mdphStatus.start_date || '',
        expiry_date: mdphStatus.expiry_date || '',
        disability_rate: mdphStatus.disability_rate || '',
        aeeh_status: mdphStatus.aeeh_status || 'non_demande',
        aeeh_complement: mdphStatus.aeeh_complement?.toString() || '',
        pch_status: mdphStatus.pch_status || 'non_demande',
        aesh_status: mdphStatus.aesh_status || 'non_demande',
        aesh_hours_per_week: mdphStatus.aesh_hours_per_week?.toString() || '',
        notes: mdphStatus.notes || '',
      });
    } else {
      setMdphForm(defaultMdphForm);
    }
    setShowMdphModal(true);
  };

  const handleSaveMdph = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        child_id: childId,
        mdph_number: mdphForm.mdph_number || null,
        department_code: mdphForm.department_code || null,
        status: mdphForm.status,
        submission_date: mdphForm.submission_date || null,
        notification_date: mdphForm.notification_date || null,
        start_date: mdphForm.start_date || null,
        expiry_date: mdphForm.expiry_date || null,
        disability_rate: mdphForm.disability_rate || null,
        aeeh_status: mdphForm.aeeh_status,
        aeeh_complement: mdphForm.aeeh_complement ? parseInt(mdphForm.aeeh_complement) : null,
        pch_status: mdphForm.pch_status,
        aesh_status: mdphForm.aesh_status,
        aesh_hours_per_week: mdphForm.aesh_hours_per_week ? parseFloat(mdphForm.aesh_hours_per_week) : null,
        notes: mdphForm.notes || null,
      };

      if (mdphStatus) {
        const { error } = await supabase
          .from('child_mdph_status')
          .update(payload)
          .eq('id', mdphStatus.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('child_mdph_status')
          .insert(payload);
        if (error) throw error;
      }

      await fetchMdphStatus();
      setShowMdphModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="sticky top-0 z-40">
          <FamilyNavbar profile={profile} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100 mx-4 px-12">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4" style={{ borderColor: 'rgba(2, 126, 126, 0.2)' }} aria-hidden="true"></div>
              </div>
              <div className="animate-spin rounded-full h-20 w-20 border-4 mx-auto" style={{ borderTopColor: '#027e7e', borderRightColor: '#3a9e9e', borderBottomColor: '#6bbebe', borderLeftColor: 'rgba(2, 126, 126, 0.2)' }} aria-hidden="true"></div>
            </div>
            <p className="text-gray-700 font-semibold mt-6 text-lg" style={{ fontFamily: 'Verdana, sans-serif' }}>Chargement du dossier...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!child) {
    return null;
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Résumé', labelShort: 'Résumé', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'goals' as TabType, label: 'Objectifs', labelShort: 'Objectifs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'sessions' as TabType, label: 'Séances', labelShort: 'Séances', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'skills' as TabType, label: 'Compétences', labelShort: 'Skills', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'preferences' as TabType, label: 'Préférences', labelShort: 'Préférences', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { id: 'documents' as TabType, label: 'Bilans & Docs', labelShort: 'Bilans', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'mdph' as TabType, label: 'MDPH', labelShort: 'MDPH', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
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
        <FamilyNavbar profile={profile} />
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        {/* Header avec infos enfant */}
        <div className="rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 text-white" style={{ background: 'linear-gradient(135deg, #3a9e9e 0%, #6bbebe 50%, #f8c3cf 100%)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-18 sm:h-18 bg-white/20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0 backdrop-blur">
                {child.first_name[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ fontFamily: 'Verdana, sans-serif' }}>Dossier de {child.first_name}</h1>
                <p className="text-white/90 text-sm sm:text-base" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  {child.age ? `${child.age} ans` : ''}
                  {child.accompaniment_goals && <span className="hidden sm:inline"> • {child.accompaniment_goals.substring(0, 50)}...</span>}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/family/children/${childId}/ppa`}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition backdrop-blur text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start font-semibold shadow-md"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Générer PPA</span>
            </Link>
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
                style={activeTab === tab.id ? { borderColor: '#027e7e', color: '#027e7e' } : {}}
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
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
          </div>
        )}

        {/* Contenu des onglets */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-100 p-3 sm:p-4 md:p-6">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Vue d'ensemble</h2>

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)', borderColor: 'rgba(2, 126, 126, 0.2)' }}>
                  <p className="text-sm font-medium" style={{ color: '#027e7e' }}>Objectifs actifs</p>
                  <p className="text-2xl font-bold" style={{ color: '#027e7e' }}>{stats.activeGoals}/{stats.totalGoals}</p>
                </div>
                <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(58, 158, 158, 0.1)', borderColor: 'rgba(58, 158, 158, 0.2)' }}>
                  <p className="text-sm font-medium" style={{ color: '#3a9e9e' }}>Objectifs atteints</p>
                  <p className="text-2xl font-bold" style={{ color: '#3a9e9e' }}>{stats.achievedGoals}</p>
                </div>
                <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', borderColor: 'rgba(240, 135, 159, 0.2)' }}>
                  <p className="text-sm font-medium" style={{ color: '#f0879f' }}>Séances (30j)</p>
                  <p className="text-2xl font-bold" style={{ color: '#f0879f' }}>{stats.recentSessions}</p>
                </div>
                <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(107, 190, 190, 0.1)', borderColor: 'rgba(107, 190, 190, 0.2)' }}>
                  <p className="text-sm font-medium" style={{ color: '#6bbebe' }}>Compétences acquises</p>
                  <p className="text-2xl font-bold" style={{ color: '#6bbebe' }}>{stats.acquiredSkills}/{stats.totalSkills}</p>
                </div>
                {mdphStatus && mdphStatus.status !== 'non_depose' && (
                  <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', borderColor: 'rgba(79, 70, 229, 0.2)' }}>
                    <p className="text-sm font-medium" style={{ color: '#4f46e5' }}>MDPH</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${mdphStatusLabels[mdphStatus.status]?.color}`}>
                      {mdphStatusLabels[mdphStatus.status]?.label}
                    </span>
                    {mdphStatus.expiry_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Expire le {new Date(mdphStatus.expiry_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Alerte expiration MDPH */}
              {mdphStatus?.expiry_date && (() => {
                const daysUntilExpiry = Math.ceil((new Date(mdphStatus.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiry <= 0) {
                  return (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                      <p className="text-sm font-medium text-red-800">
                        Les droits MDPH ont expiré le {new Date(mdphStatus.expiry_date).toLocaleDateString('fr-FR')}.
                      </p>
                    </div>
                  );
                }
                if (daysUntilExpiry <= 90) {
                  return (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-sm font-medium text-orange-800">
                        Les droits MDPH expirent dans {daysUntilExpiry} jours ({new Date(mdphStatus.expiry_date).toLocaleDateString('fr-FR')}). Pensez au renouvellement !
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Derniers objectifs */}
              {goals.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Objectifs récents</h3>
                  <div className="space-y-2">
                    {goals.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusLabels[goal.status]?.color || 'bg-gray-100'}`}>
                            {statusLabels[goal.status]?.label || goal.status}
                          </span>
                          <span className="text-sm text-gray-900">{goal.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-primary-600 rounded-full"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{goal.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dernières séances */}
              {sessions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Dernières séances</h3>
                  <div className="space-y-2">
                    {sessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {session.title || 'Séance'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(session.session_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {session.activities && (
                          <p className="text-xs text-gray-600 line-clamp-1">{session.activities}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {goals.length === 0 && sessions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Commencez à remplir le dossier en ajoutant des objectifs ou des notes de séances.</p>
                </div>
              )}
            </div>
          )}

          {/* Objectifs */}
          {activeTab === 'goals' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Objectifs éducatifs</h2>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition text-sm w-full sm:w-auto justify-center font-semibold shadow-md"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouvel objectif
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun objectif</h3>
                  <p className="text-gray-500 mb-4">Définissez des objectifs éducatifs pour suivre la progression.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="border border-gray-200 rounded-xl p-4">
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
                        {goal.target_date && (
                          <span className="text-xs text-gray-500">
                            Objectif: {new Date(goal.target_date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>

                      {/* Barre de progression */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Progression</span>
                          <span className="text-sm font-medium text-gray-900">{goal.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-primary-600 rounded-full transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          {[0, 25, 50, 75, 100].map((value) => (
                            <button
                              key={value}
                              onClick={() => handleUpdateGoalProgress(goal.id, value)}
                              className={`px-2 py-1 text-xs rounded ${
                                goal.progress === value
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Notes de séances</h2>
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition text-sm w-full sm:w-auto justify-center font-semibold shadow-md"
                  style={{ backgroundColor: '#f0879f' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouvelle note
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune note de séance</h3>
                  <p className="text-gray-500 mb-4">Notez les observations après chaque séance.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-xl p-4">
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
                        </div>

                      {session.activities && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Activités</p>
                          <p className="text-sm text-gray-700">{session.activities}</p>
                        </div>
                      )}

                      {session.observations && (
                        <div className="mb-2">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Compétences</h2>
                <button
                  onClick={() => setShowSkillModal(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition text-sm w-full sm:w-auto justify-center font-semibold shadow-md"
                  style={{ backgroundColor: '#3a9e9e' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden xs:inline">Ajouter une</span> compétence
                </button>
              </div>

              {skills.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune compétence</h3>
                  <p className="text-gray-500 mb-4">Suivez l'acquisition des compétences.</p>
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
                                className={`text-xs font-medium px-2 py-1 rounded border-0 ${masteryLabels[skill.mastery_level]?.color}`}
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

          {/* Préférences */}
          {activeTab === 'preferences' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Préférences</h2>
                <button
                  onClick={() => setShowPreferenceModal(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition text-sm w-full sm:w-auto justify-center font-semibold shadow-md"
                  style={{ backgroundColor: '#6bbebe' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              </div>

              {preferences.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune préférence</h3>
                  <p className="text-gray-500 mb-4">Notez les renforçateurs, intérêts et éléments à éviter.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(preferenceTypeLabels).map(([type, { label, icon, color }]) => {
                    const typePrefs = preferences.filter(p => p.type === type);
                    if (typePrefs.length === 0) return null;

                    return (
                      <div key={type} className={`border rounded-xl p-4 ${color}`}>
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Bilans & Documents</h2>
                  <p className="text-sm text-gray-500 mt-1">Liens vers les bilans et documents externes (non stockés sur la plateforme)</p>
                </div>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition text-sm w-full sm:w-auto justify-center font-semibold shadow-md"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un lien
                </button>
              </div>

              {externalLinks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
                  <p className="text-gray-500 mb-4">Ajoutez des liens vers les bilans et documents importants.</p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Note : Les documents ne sont pas stockés sur notre plateforme. Vous pouvez ajouter des liens vers des services de stockage sécurisés (Google Drive, Dropbox, etc.) ou simplement noter les références des documents.
                  </p>
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
                            <div key={link.id} className={`border rounded-xl p-4 ${color}`}>
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
                                    <p className="text-sm text-gray-600 mb-1">
                                      Par : {link.professional_name}
                                    </p>
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
                                      style={{ color: '#027e7e' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Ouvrir le lien
                                    </a>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-white/50 rounded-lg transition"
                                  title="Supprimer"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Pourquoi des liens externes ?</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Pour des raisons de conformité légale (données de santé), les documents médicaux ne sont pas stockés sur notre plateforme. Vous pouvez utiliser des services sécurisés (Doctolib, Google Drive, etc.) et simplement référencer les documents ici.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MDPH */}
          {activeTab === 'mdph' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>Suivi MDPH</h2>
                  <p className="text-sm text-gray-500 mt-1">Dossier MDPH, droits et aides</p>
                </div>
                <button
                  onClick={openMdphModal}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-white rounded-xl hover:opacity-90 transition text-sm w-full sm:w-auto justify-center font-semibold shadow-md"
                  style={{ backgroundColor: '#4f46e5' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mdphStatus ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                  </svg>
                  {mdphStatus ? 'Modifier' : 'Configurer le suivi MDPH'}
                </button>
              </div>

              {!mdphStatus ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun suivi MDPH</h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    Configurez le suivi du dossier MDPH pour suivre les droits, aides (AEEH, PCH) et accompagnements (AESH).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Alerte expiration */}
                  {mdphStatus.expiry_date && (() => {
                    const daysUntilExpiry = Math.ceil((new Date(mdphStatus.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysUntilExpiry <= 0) {
                      return (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                          <p className="text-sm font-medium text-red-800">Droits expirés depuis le {new Date(mdphStatus.expiry_date).toLocaleDateString('fr-FR')}</p>
                        </div>
                      );
                    }
                    if (daysUntilExpiry <= 90) {
                      return (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                          <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <p className="text-sm font-medium text-orange-800">Expiration dans {daysUntilExpiry} jours. Pensez au renouvellement !</p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Statut principal */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-indigo-600 font-medium mb-1">Statut du dossier</p>
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${mdphStatusLabels[mdphStatus.status]?.color}`}>
                          {mdphStatusLabels[mdphStatus.status]?.label}
                        </span>
                      </div>
                      {mdphStatus.mdph_number && (
                        <div className="text-right">
                          <p className="text-xs text-indigo-600 font-medium mb-1">N° dossier</p>
                          <p className="text-sm font-semibold text-gray-900">{mdphStatus.mdph_number}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infos principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dates */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Dates
                      </h3>
                      <div className="space-y-2 text-sm">
                        {mdphStatus.submission_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Dépôt</span>
                            <span className="font-medium">{new Date(mdphStatus.submission_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                        {mdphStatus.notification_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Notification</span>
                            <span className="font-medium">{new Date(mdphStatus.notification_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                        {mdphStatus.start_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Début droits</span>
                            <span className="font-medium">{new Date(mdphStatus.start_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                        {mdphStatus.expiry_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Expiration</span>
                            <span className="font-medium">{new Date(mdphStatus.expiry_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                        {!mdphStatus.submission_date && !mdphStatus.notification_date && !mdphStatus.start_date && !mdphStatus.expiry_date && (
                          <p className="text-gray-400 text-xs">Aucune date renseignée</p>
                        )}
                      </div>
                    </div>

                    {/* Taux d'incapacité */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Taux d'incapacité
                      </h3>
                      {mdphStatus.disability_rate ? (
                        <p className="text-lg font-bold text-indigo-600">{disabilityRateLabels[mdphStatus.disability_rate]}</p>
                      ) : (
                        <p className="text-gray-400 text-sm">Non renseigné</p>
                      )}
                      {mdphStatus.department_code && (
                        <p className="text-xs text-gray-500 mt-2">Département : {mdphStatus.department_code}</p>
                      )}
                    </div>
                  </div>

                  {/* Aides financières */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Aides financières
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">AEEH</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${aidStatusLabels[mdphStatus.aeeh_status]?.color}`}>
                          {aidStatusLabels[mdphStatus.aeeh_status]?.label}
                        </span>
                        {mdphStatus.aeeh_complement && (
                          <p className="text-xs text-gray-600 mt-1">Complément {mdphStatus.aeeh_complement}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">PCH</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${aidStatusLabels[mdphStatus.pch_status]?.color}`}>
                          {aidStatusLabels[mdphStatus.pch_status]?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AESH */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      Accompagnement scolaire (AESH)
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${aidStatusLabels[mdphStatus.aesh_status]?.color}`}>
                        {aidStatusLabels[mdphStatus.aesh_status]?.label}
                      </span>
                      {mdphStatus.aesh_hours_per_week && (
                        <span className="text-sm text-gray-600">{mdphStatus.aesh_hours_per_week}h/semaine</span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {mdphStatus.notes && (
                    <div className="border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{mdphStatus.notes}</p>
                    </div>
                  )}

                  {/* Lien vers les aides */}
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-indigo-800 font-medium">Besoin d'aide ?</p>
                        <p className="text-xs text-indigo-600 mt-1">
                          Consultez notre <Link href="/dashboard/family/aides" className="underline font-medium">guide des aides financières</Link> ou notre <Link href="/blog/mdph-dossier" className="underline font-medium">guide pour constituer un dossier MDPH</Link>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Objectif */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Verdana, sans-serif' }}>Nouvel objectif</h2>
              <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                  placeholder="Ex: Dire bonjour aux adultes"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
                <select
                  value={goalForm.category}
                  onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                  rows={2}
                  placeholder="Détails de l'objectif..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment mesurer (critère de réussite)</label>
                <input
                  type="text"
                  value={goalForm.measurable}
                  onChange={(e) => setGoalForm({ ...goalForm, measurable: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                  placeholder="Ex: 8 fois sur 10 sans rappel"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date cible</label>
                <input
                  type="date"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-3 md:px-4 py-2 md:py-2.5 text-xs sm:text-sm md:text-base text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Séance */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Verdana, sans-serif' }}>Note de séance</h2>
              <button onClick={() => setShowSessionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSession} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={sessionForm.session_date}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#f0879f' } as any}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre (optionnel)</label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#f0879f' } as any}
                  placeholder="Ex: Séance communication"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Activités réalisées</label>
                <textarea
                  value={sessionForm.activities}
                  onChange={(e) => setSessionForm({ ...sessionForm, activities: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#f0879f' } as any}
                  rows={2}
                  placeholder="Qu'avez-vous travaillé ?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observations</label>
                <textarea
                  value={sessionForm.observations}
                  onChange={(e) => setSessionForm({ ...sessionForm, observations: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#f0879f' } as any}
                  rows={2}
                  placeholder="Observations factuelles..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-3 md:px-4 py-2 md:py-2.5 text-xs sm:text-sm md:text-base text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#f0879f' }}
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
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-lg w-full">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Verdana, sans-serif' }}>Nouvelle compétence</h2>
              <button onClick={() => setShowSkillModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddSkill} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la compétence <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#3a9e9e' } as any}
                  placeholder="Ex: S'habiller seul"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
                  <select
                    value={skillForm.category}
                    onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                    style={{ '--tw-ring-color': '#3a9e9e' } as any}
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
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                    style={{ '--tw-ring-color': '#3a9e9e' } as any}
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
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#3a9e9e' } as any}
                  rows={2}
                  placeholder="Contexte, observations..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="px-3 md:px-4 py-2 md:py-2.5 text-xs sm:text-sm md:text-base text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#3a9e9e' }}
                >
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Préférence */}
      {showPreferenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-lg w-full">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Verdana, sans-serif' }}>Nouvelle préférence</h2>
              <button onClick={() => setShowPreferenceModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddPreference} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={preferenceForm.type}
                  onChange={(e) => setPreferenceForm({ ...preferenceForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                >
                  {Object.entries(preferenceTypeLabels).map(([value, { label, icon }]) => (
                    <option key={value} value={value}>{icon} {label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={preferenceForm.name}
                  onChange={(e) => setPreferenceForm({ ...preferenceForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                  placeholder="Ex: Dinosaures, Puzzle, Timer visuel..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={preferenceForm.description}
                  onChange={(e) => setPreferenceForm({ ...preferenceForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                  rows={2}
                  placeholder="Détails, comment utiliser..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPreferenceModal(false)}
                  className="px-3 md:px-4 py-2 md:py-2.5 text-xs sm:text-sm md:text-base text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#027e7e' }}
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
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Verdana, sans-serif' }}>Ajouter un lien</h2>
              <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddLink} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de document</label>
                <select
                  value={linkForm.link_type}
                  onChange={(e) => setLinkForm({ ...linkForm, link_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
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
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                  placeholder="Ex: Bilan orthophonique janvier 2024"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date du document</label>
                  <input
                    type="date"
                    value={linkForm.document_date}
                    onChange={(e) => setLinkForm({ ...linkForm, document_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                    style={{ '--tw-ring-color': '#027e7e' } as any}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Professionnel</label>
                  <input
                    type="text"
                    value={linkForm.professional_name}
                    onChange={(e) => setLinkForm({ ...linkForm, professional_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                    style={{ '--tw-ring-color': '#027e7e' } as any}
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
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-xs text-gray-500 mt-1">Lien vers le document (Google Drive, Dropbox, Doctolib...)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes / Description</label>
                <textarea
                  value={linkForm.description}
                  onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#027e7e' } as any}
                  rows={2}
                  placeholder="Conclusions principales, recommandations..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 md:px-4 py-2 md:py-2.5 text-xs sm:text-sm md:text-base text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#027e7e' }}
                >
                  {saving ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal MDPH */}
      {showMdphModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Verdana, sans-serif' }}>
                {mdphStatus ? 'Modifier le suivi MDPH' : 'Configurer le suivi MDPH'}
              </h2>
              <button onClick={() => setShowMdphModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveMdph} className="p-3 sm:p-4 md:p-6 space-y-5">
              {/* Dossier */}
              <div>
                <h3 className="text-sm font-semibold text-indigo-700 mb-3">Dossier</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut <span className="text-red-500">*</span></label>
                    <select
                      value={mdphForm.status}
                      onChange={(e) => setMdphForm({ ...mdphForm, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                    >
                      {Object.entries(mdphStatusLabels).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° dossier</label>
                    <input
                      type="text"
                      value={mdphForm.mdph_number}
                      onChange={(e) => setMdphForm({ ...mdphForm, mdph_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                      placeholder="Numéro de dossier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={mdphForm.department_code}
                      onChange={(e) => setMdphForm({ ...mdphForm, department_code: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                      placeholder="Ex: 75"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-sm font-semibold text-indigo-700 mb-3">Dates</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dépôt</label>
                    <input
                      type="date"
                      value={mdphForm.submission_date}
                      onChange={(e) => setMdphForm({ ...mdphForm, submission_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notification</label>
                    <input
                      type="date"
                      value={mdphForm.notification_date}
                      onChange={(e) => setMdphForm({ ...mdphForm, notification_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Début droits</label>
                    <input
                      type="date"
                      value={mdphForm.start_date}
                      onChange={(e) => setMdphForm({ ...mdphForm, start_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Expiration</label>
                    <input
                      type="date"
                      value={mdphForm.expiry_date}
                      onChange={(e) => setMdphForm({ ...mdphForm, expiry_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                    />
                  </div>
                </div>
              </div>

              {/* Taux d'incapacité */}
              <div>
                <h3 className="text-sm font-semibold text-indigo-700 mb-3">Reconnaissance</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux d'incapacité</label>
                  <select
                    value={mdphForm.disability_rate}
                    onChange={(e) => setMdphForm({ ...mdphForm, disability_rate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                    style={{ '--tw-ring-color': '#4f46e5' } as any}
                  >
                    <option value="">Non renseigné</option>
                    {Object.entries(disabilityRateLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aides financières */}
              <div>
                <h3 className="text-sm font-semibold text-indigo-700 mb-3">Aides financières</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AEEH</label>
                    <select
                      value={mdphForm.aeeh_status}
                      onChange={(e) => setMdphForm({ ...mdphForm, aeeh_status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                    >
                      {Object.entries(aidStatusLabels).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {mdphForm.aeeh_status === 'accorde' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complément AEEH (1-6)</label>
                      <select
                        value={mdphForm.aeeh_complement}
                        onChange={(e) => setMdphForm({ ...mdphForm, aeeh_complement: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                        style={{ '--tw-ring-color': '#4f46e5' } as any}
                      >
                        <option value="">Aucun complément</option>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>Complément {n}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PCH</label>
                    <select
                      value={mdphForm.pch_status}
                      onChange={(e) => setMdphForm({ ...mdphForm, pch_status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                    >
                      {Object.entries(aidStatusLabels).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* AESH */}
              <div>
                <h3 className="text-sm font-semibold text-indigo-700 mb-3">Accompagnement scolaire</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AESH</label>
                    <select
                      value={mdphForm.aesh_status}
                      onChange={(e) => setMdphForm({ ...mdphForm, aesh_status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                      style={{ '--tw-ring-color': '#4f46e5' } as any}
                    >
                      {Object.entries(aidStatusLabels).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {mdphForm.aesh_status === 'accorde' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heures AESH / semaine</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="40"
                        value={mdphForm.aesh_hours_per_week}
                        onChange={(e) => setMdphForm({ ...mdphForm, aesh_hours_per_week: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                        style={{ '--tw-ring-color': '#4f46e5' } as any}
                        placeholder="Ex: 12"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={mdphForm.notes}
                  onChange={(e) => setMdphForm({ ...mdphForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:outline-none focus:border-transparent"
                  style={{ '--tw-ring-color': '#4f46e5' } as any}
                  rows={3}
                  placeholder="Informations complémentaires..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMdphModal(false)}
                  className="px-3 md:px-4 py-2 md:py-2.5 text-xs sm:text-sm md:text-base text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 md:px-6 md:py-3 text-xs sm:text-sm md:text-base text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-semibold shadow-md"
                  style={{ backgroundColor: '#4f46e5' }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer teal */}
      <div className="mt-auto" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
