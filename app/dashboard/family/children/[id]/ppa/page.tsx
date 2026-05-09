'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import { useToast } from '@/components/Toast';
import PpaAccessSection from '@/components/family/PpaAccessSection';

// Debounce hook for auto-save
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface ChildProfile {
  id: string;
  first_name: string;
  age: number | null;
  birth_date: string | null;
  description: string | null;
  accompaniment_types: string[];
  accompaniment_goals: string | null;
  interests: string | null;
  strengths: string | null;
  challenges: string | null;
}

interface FamilyProfile {
  first_name: string;
  last_name: string;
  phone: string | null;
  location: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  progress: number;
  measurable: string | null;
  target_date: string | null;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  mastery_level: string;
}

interface Preference {
  id: string;
  type: string;
  name: string;
  description: string | null;
}

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

const masteryLabels: Record<string, string> = {
  non_acquis: 'Non acquis',
  en_emergence: 'En émergence',
  en_cours: 'En cours d\'acquisition',
  acquis_avec_aide: 'Acquis avec aide',
  acquis: 'Acquis',
};

export default function PPAPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams();
  const childId = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [ppaId, setPpaId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // États pour le versioning
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [viewingVersion, setViewingVersion] = useState(false);

  // Champs éditables pour le PPA
  const [ppaData, setPpaData] = useState({
    // Section 1: Identification
    educator_name: '',
    educator_structure: '',
    evaluation_date: new Date().toISOString().split('T')[0],
    evaluation_period_start: '',
    evaluation_period_end: '',

    // Section 2: Anamnèse (sans jalons développementaux)
    previous_support: '',
    schooling_history: '',
    family_context: '',
    significant_events: '',
    life_events: '', // Événements de vie récents

    // Section 3: Contexte
    school_info: '',
    other_professionals: '',
    family_expectations: '',

    // Section 4: Évaluation par domaine - Communication
    comm_receptive: '',
    comm_expressive: '',
    comm_written: '',

    // Évaluation - Autonomie vie quotidienne
    autonomy_personal: '',
    autonomy_domestic: '',
    autonomy_community: '',

    // Évaluation - Socialisation
    social_interpersonal: '',
    social_leisure: '',
    social_adaptation: '',

    // Évaluation - Motricité
    motor_global: '',
    motor_fine: '',

    // Évaluation - Profil sensoriel (7 sens)
    sensory_visual: '',
    sensory_auditory: '',
    sensory_gustatory: '',
    sensory_olfactory: '',
    sensory_tactile: '',
    sensory_proprioceptive: '',
    sensory_vestibular: '',

    // Évaluation - Cognitif & Apprentissages
    cognitive_facilitating_conditions: '',
    cognitive_position: '',
    cognitive_guidance: '',
    cognitive_material_structure: '',
    cognitive_attention_time: '',
    cognitive_max_tasks: '',
    cognitive_work_leads: '',

    // Évaluation - Psycho-affectif
    psycho_affective: '',

    // Évaluation - Comportements problèmes
    problem_behaviors: '',

    // Section Objectifs
    priority_axes: '',

    // Section Modalités
    session_frequency: '',
    intervention_locations: [] as string[],
    resources_needed: '',

    // Section Révision
    next_review_date: '',
    review_frequency: '',
    observations: '',
  });

  // Debounce pour auto-save (2 secondes après arrêt de frappe)
  const debouncedPpaData = useDebounce(ppaData, 2000);

  // Sauvegarder le PPA
  const savePPA = useCallback(async () => {
    if (!childId) return;

    setSaving(true);
    setSaveStatus('saving');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const ppaPayload = {
        child_id: childId,
        // Identification
        educator_name: ppaData.educator_name || null,
        educator_structure: ppaData.educator_structure || null,
        evaluation_date: ppaData.evaluation_date || null,
        evaluation_period_start: ppaData.evaluation_period_start || null,
        evaluation_period_end: ppaData.evaluation_period_end || null,
        // Anamnèse
        previous_support: ppaData.previous_support || null,
        schooling_history: ppaData.schooling_history || null,
        family_context: ppaData.family_context || null,
        significant_events: ppaData.significant_events || null,
        life_events: ppaData.life_events || null,
        // Contexte
        school_info: ppaData.school_info || null,
        other_professionals: ppaData.other_professionals || null,
        family_expectations: ppaData.family_expectations || null,
        // Communication
        comm_receptive: ppaData.comm_receptive || null,
        comm_expressive: ppaData.comm_expressive || null,
        comm_written: ppaData.comm_written || null,
        // Autonomie
        autonomy_personal: ppaData.autonomy_personal || null,
        autonomy_domestic: ppaData.autonomy_domestic || null,
        autonomy_community: ppaData.autonomy_community || null,
        // Socialisation
        social_interpersonal: ppaData.social_interpersonal || null,
        social_leisure: ppaData.social_leisure || null,
        social_adaptation: ppaData.social_adaptation || null,
        // Motricité
        motor_global: ppaData.motor_global || null,
        motor_fine: ppaData.motor_fine || null,
        // Sensoriel
        sensory_visual: ppaData.sensory_visual || null,
        sensory_auditory: ppaData.sensory_auditory || null,
        sensory_gustatory: ppaData.sensory_gustatory || null,
        sensory_olfactory: ppaData.sensory_olfactory || null,
        sensory_tactile: ppaData.sensory_tactile || null,
        sensory_proprioceptive: ppaData.sensory_proprioceptive || null,
        sensory_vestibular: ppaData.sensory_vestibular || null,
        // Cognitif
        cognitive_facilitating_conditions: ppaData.cognitive_facilitating_conditions || null,
        cognitive_position: ppaData.cognitive_position || null,
        cognitive_guidance: ppaData.cognitive_guidance || null,
        cognitive_material_structure: ppaData.cognitive_material_structure || null,
        cognitive_attention_time: ppaData.cognitive_attention_time || null,
        cognitive_max_tasks: ppaData.cognitive_max_tasks || null,
        cognitive_work_leads: ppaData.cognitive_work_leads || null,
        // Psycho-affectif & Comportements
        psycho_affective: ppaData.psycho_affective || null,
        problem_behaviors: ppaData.problem_behaviors || null,
        // Objectifs & Modalités
        priority_axes: ppaData.priority_axes || null,
        session_frequency: ppaData.session_frequency || null,
        intervention_locations: ppaData.intervention_locations.length > 0 ? ppaData.intervention_locations : null,
        resources_needed: ppaData.resources_needed || null,
        // Révision
        next_review_date: ppaData.next_review_date || null,
        review_frequency: ppaData.review_frequency || null,
        observations: ppaData.observations || null,
        last_updated_by: session.user.id,
      };

      if (ppaId) {
        // Update existing PPA
        const { error } = await supabase
          .from('child_ppa')
          .update(ppaPayload)
          .eq('id', ppaId);

        if (error) throw error;
      } else {
        // Create new PPA
        const { data, error } = await supabase
          .from('child_ppa')
          .insert({ ...ppaPayload, created_by: session.user.id })
          .select()
          .single();

        if (error) throw error;
        if (data) setPpaId(data.id);
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (err) {
      console.error('Erreur sauvegarde PPA:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [childId, ppaId, ppaData]);

  // Auto-save quand les données changent (après debounce)
  useEffect(() => {
    if (loading) return; // Ne pas sauvegarder pendant le chargement initial
    savePPA();
  }, [debouncedPpaData]);

  useEffect(() => {
    fetchData();
    fetchVersions();
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

      if (familyProfile) {
        setFamily(familyProfile);
      }

      // Récupérer l'enfant
      const { data: childData } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', childId)
        .single();

      if (childData) {
        setChild(childData);
      }

      // Récupérer les objectifs
      const { data: goalsData } = await supabase
        .from('child_educational_goals')
        .select('*')
        .eq('child_id', childId)
        .eq('status', 'en_cours')
        .order('created_at', { ascending: false });
      setGoals(goalsData || []);

      // Récupérer les compétences
      const { data: skillsData } = await supabase
        .from('child_skills')
        .select('*')
        .eq('child_id', childId)
        .order('category');
      setSkills(skillsData || []);

      // Récupérer les préférences
      const { data: prefsData } = await supabase
        .from('child_preferences')
        .select('*')
        .eq('child_id', childId);
      setPreferences(prefsData || []);

      // Récupérer le PPA existant
      const { data: ppaExisting } = await supabase
        .from('child_ppa')
        .select('*')
        .eq('child_id', childId)
        .single();

      if (ppaExisting) {
        setPpaId(ppaExisting.id);
        setPpaData({
          // Identification
          educator_name: ppaExisting.educator_name || '',
          educator_structure: ppaExisting.educator_structure || '',
          evaluation_date: ppaExisting.evaluation_date || new Date().toISOString().split('T')[0],
          evaluation_period_start: ppaExisting.evaluation_period_start || '',
          evaluation_period_end: ppaExisting.evaluation_period_end || '',
          // Anamnèse
          previous_support: ppaExisting.previous_support || '',
          schooling_history: ppaExisting.schooling_history || '',
          family_context: ppaExisting.family_context || '',
          significant_events: ppaExisting.significant_events || '',
          life_events: ppaExisting.life_events || '',
          // Contexte
          school_info: ppaExisting.school_info || '',
          other_professionals: ppaExisting.other_professionals || '',
          family_expectations: ppaExisting.family_expectations || '',
          // Communication
          comm_receptive: ppaExisting.comm_receptive || '',
          comm_expressive: ppaExisting.comm_expressive || '',
          comm_written: ppaExisting.comm_written || '',
          // Autonomie
          autonomy_personal: ppaExisting.autonomy_personal || '',
          autonomy_domestic: ppaExisting.autonomy_domestic || '',
          autonomy_community: ppaExisting.autonomy_community || '',
          // Socialisation
          social_interpersonal: ppaExisting.social_interpersonal || '',
          social_leisure: ppaExisting.social_leisure || '',
          social_adaptation: ppaExisting.social_adaptation || '',
          // Motricité
          motor_global: ppaExisting.motor_global || '',
          motor_fine: ppaExisting.motor_fine || '',
          // Sensoriel
          sensory_visual: ppaExisting.sensory_visual || '',
          sensory_auditory: ppaExisting.sensory_auditory || '',
          sensory_gustatory: ppaExisting.sensory_gustatory || '',
          sensory_olfactory: ppaExisting.sensory_olfactory || '',
          sensory_tactile: ppaExisting.sensory_tactile || '',
          sensory_proprioceptive: ppaExisting.sensory_proprioceptive || '',
          sensory_vestibular: ppaExisting.sensory_vestibular || '',
          // Cognitif
          cognitive_facilitating_conditions: ppaExisting.cognitive_facilitating_conditions || '',
          cognitive_position: ppaExisting.cognitive_position || '',
          cognitive_guidance: ppaExisting.cognitive_guidance || '',
          cognitive_material_structure: ppaExisting.cognitive_material_structure || '',
          cognitive_attention_time: ppaExisting.cognitive_attention_time || '',
          cognitive_max_tasks: ppaExisting.cognitive_max_tasks || '',
          cognitive_work_leads: ppaExisting.cognitive_work_leads || '',
          // Psycho-affectif & Comportements
          psycho_affective: ppaExisting.psycho_affective || '',
          problem_behaviors: ppaExisting.problem_behaviors || '',
          // Objectifs & Modalités
          priority_axes: ppaExisting.priority_axes || '',
          session_frequency: ppaExisting.session_frequency || '',
          intervention_locations: ppaExisting.intervention_locations || [],
          resources_needed: ppaExisting.resources_needed || '',
          // Révision
          next_review_date: ppaExisting.next_review_date || '',
          review_frequency: ppaExisting.review_frequency || '',
          observations: ppaExisting.observations || '',
        });
        setLastSaved(new Date(ppaExisting.updated_at));
      }

    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Récupérer l'historique des versions
  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/ppa/${childId}/versions`);
      const data = await response.json();
      if (data.versions) {
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Erreur récupération versions:', error);
    }
  };

  // Créer une nouvelle version
  const createVersion = async () => {
    if (!ppaId) {
      showToast('Veuillez d\'abord enregistrer le PPA avant de créer une version.', 'info');
      return;
    }

    setCreatingVersion(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const response = await fetch(`/api/ppa/${childId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          versionLabel: versionLabel || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Version créée avec succès !');
        setShowVersionModal(false);
        setVersionLabel('');
        fetchVersions();
      } else {
        showToast('Erreur: ' + (data.error || 'Erreur inconnue'), 'error');
      }
    } catch (error: any) {
      console.error('Erreur création version:', error);
      showToast('Erreur lors de la création de la version', 'error');
    } finally {
      setCreatingVersion(false);
    }
  };

  // Voir une version spécifique
  const viewVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/ppa/${childId}/versions/${versionId}`);
      const data = await response.json();

      if (data.version) {
        setSelectedVersion(data.version);
        setViewingVersion(true);
        setShowHistoryModal(false);
      }
    } catch (error) {
      console.error('Erreur chargement version:', error);
      showToast('Erreur lors du chargement de la version', 'error');
    }
  };

  // Supprimer une version
  const deleteVersion = async (versionId: string) => {
    if (!confirm('Supprimer cette version ? Cette action est irréversible.')) return;

    try {
      const response = await fetch(`/api/ppa/${childId}/versions/${versionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showToast('Version supprimée');
        fetchVersions();
      } else {
        showToast('Erreur: ' + (data.error || 'Erreur inconnue'), 'error');
      }
    } catch (error) {
      console.error('Erreur suppression version:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#027e7e' }}></div>
      </div>
    );
  }

  if (!child) return null;

  const reinforcers = preferences.filter(p => p.type === 'reinforcer');
  const interests = preferences.filter(p => p.type === 'interest');
  const strategies = preferences.filter(p => p.type === 'strategy');
  const toAvoid = preferences.filter(p => p.type === 'avoid');

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar */}
      <div className="no-print sticky top-0 z-50">
        <FamilyNavbar profile={family} />
      </div>

      {/* Styles d'impression et mobile */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ppa-document, #ppa-document * {
            visibility: visible;
          }
          #ppa-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-before: always;
          }
          input, textarea {
            border: 1px solid #ccc !important;
            background: #fff !important;
          }
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 12px);
        }
      `}</style>

      {/* Barre d'outils (non imprimée) */}
      <div className="no-print bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <Link
            href={`/dashboard/family/children/${childId}/dossier`}
            className="flex items-center gap-2 text-gray-600 hover:opacity-80 text-sm sm:text-base"
            style={{ color: '#027e7e' }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden xs:inline">Retour au dossier</span>
            <span className="xs:hidden">Retour</span>
          </Link>

          {/* Indicateur de sauvegarde */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-2 text-blue-600">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sauvegarde...
              </span>
            )}
            {saveStatus === 'saved' && lastSaved && (
              <span className="flex items-center gap-2 text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegardé {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-2 text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Erreur de sauvegarde
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Bouton Versions précédentes */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm"
              title="Consulter les versions précédentes du PPA"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Versions</span>
              {versions.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#e6f4f4', color: '#027e7e' }}>
                  {versions.length}
                </span>
              )}
            </button>

            {/* Bouton Créer une copie */}
            <button
              onClick={() => setShowVersionModal(true)}
              disabled={!ppaId}
              className="flex items-center gap-1.5 px-3 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              title={!ppaId ? 'Enregistrez d\'abord le PPA' : 'Créer une copie de sauvegarde avant modification'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span>Copie</span>
            </button>

            {/* Bouton Sauvegarder */}
            <button
              onClick={savePPA}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-xs sm:text-sm"
              title="Sauvegarder les modifications (sauvegarde automatique activée)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sauvegarder</span>
            </button>

            {/* Bouton Imprimer / PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg hover:opacity-90 transition text-xs sm:text-sm"
              style={{ backgroundColor: '#027e7e' }}
              title="Imprimer ou exporter en PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document PPA */}
      <div className="flex-1 pb-24 sm:pb-8">
      <div id="ppa-document" ref={printRef} className="max-w-5xl mx-auto bg-white p-3 sm:p-4 md:p-6 lg:p-8 print:my-0 sm:shadow-sm sm:rounded-lg sm:my-4">

        {/* En-tête */}
        <div className="border-b-4 pb-4 sm:pb-6 mb-6 sm:mb-8" style={{ borderColor: '#027e7e' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Projet Personnalisé d'Accompagnement
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-1">PPA - Document de suivi éducatif</p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-gray-500">Date d'élaboration</p>
              <input
                type="date"
                value={ppaData.evaluation_date}
                onChange={(e) => setPpaData({ ...ppaData, evaluation_date: e.target.value })}
                className="text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-300 outline-none w-full sm:w-auto" style={{ '--focus-border-color': '#027e7e' } as any}
              />
            </div>
          </div>
        </div>

        {/* Section 1: Identification */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white px-3 sm:px-4 py-2 rounded-t-lg" style={{ backgroundColor: '#027e7e' }}>
            1. IDENTIFICATION
          </h2>
          <div className="border border-gray-300 border-t-0 rounded-b-lg p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Enfant */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 border-b pb-1">Personne accompagnée</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-24 text-gray-600">Prénom :</span>
                    <span className="font-medium">{child.first_name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-gray-600">Date de naissance :</span>
                    <span className="font-medium">
                      {child.birth_date
                        ? new Date(child.birth_date).toLocaleDateString('fr-FR')
                        : '____/____/________'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-gray-600">Âge :</span>
                    <span className="font-medium">
                      {child.birth_date
                        ? `${Math.floor((Date.now() - new Date(child.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} ans`
                        : child.age ? `${child.age} ans` : '_____ ans'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Famille */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 border-b pb-1">Responsable légal</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-24 text-gray-600">Nom :</span>
                    <span className="font-medium">{family?.first_name} {family?.last_name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-gray-600">Adresse :</span>
                    <span className="font-medium">{family?.location || '_________________'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Intervenant */}
            <div className="mt-4 sm:mt-6 pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Intervenant principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Nom de l'intervenant :</label>
                  <input
                    type="text"
                    value={ppaData.educator_name}
                    onChange={(e) => setPpaData({ ...ppaData, educator_name: e.target.value })}
                    className="w-full border-b border-gray-300 outline-none py-1"
                    placeholder="Nom et prénom"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Structure / Statut :</label>
                  <input
                    type="text"
                    value={ppaData.educator_structure}
                    onChange={(e) => setPpaData({ ...ppaData, educator_structure: e.target.value })}
                    className="w-full border-b border-gray-300 outline-none py-1"
                    placeholder="Ex: Libéral, Association..."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Anamnèse */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white px-3 sm:px-4 py-2 rounded-t-lg" style={{ backgroundColor: '#027e7e' }}>
            2. ANAMNÈSE
          </h2>
          <div className="border border-gray-300 border-t-0 rounded-b-lg p-3 sm:p-4">

            {/* Partie A: Historique éducatif (stockable) */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4 pb-2 border-b flex items-center gap-2" style={{ color: '#027e7e' }}>
                <span className="px-2 py-1 rounded text-sm" style={{ backgroundColor: '#e6f4f4', color: '#027e7e' }}>A</span>
                Parcours éducatif et développemental
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="font-medium text-gray-900 block mb-2">Parcours scolaire</label>
                  <textarea
                    value={ppaData.schooling_history}
                    onChange={(e) => setPpaData({ ...ppaData, schooling_history: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 min-h-[70px] text-sm"
                    placeholder="Historique de scolarisation (écoles, classes, aménagements, redoublements, orientations...)"
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-900 block mb-2">Accompagnements antérieurs</label>
                  <textarea
                    value={ppaData.previous_support}
                    onChange={(e) => setPpaData({ ...ppaData, previous_support: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 min-h-[70px] text-sm"
                    placeholder="Éducateurs, structures (IME, SESSAD...), durées, méthodes utilisées..."
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-900 block mb-2">Contexte familial</label>
                  <textarea
                    value={ppaData.family_context}
                    onChange={(e) => setPpaData({ ...ppaData, family_context: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 min-h-[50px] text-sm"
                    placeholder="Composition familiale, fratrie, situation, éléments pertinents pour l'accompagnement..."
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-900 block mb-2">Événements significatifs</label>
                  <textarea
                    value={ppaData.significant_events}
                    onChange={(e) => setPpaData({ ...ppaData, significant_events: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 min-h-[50px] text-sm"
                    placeholder="Événements marquants dans le parcours (déménagements, changements majeurs, régressions, progrès notables...)"
                  />
                </div>

                <div>
                  <label className="font-medium text-gray-900 block mb-2">Événements de vie récents</label>
                  <textarea
                    value={ppaData.life_events}
                    onChange={(e) => setPpaData({ ...ppaData, life_events: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 min-h-[50px] text-sm"
                    placeholder="Événements survenus sur la période d'évaluation (changements d'environnement, nouvelles activités, faits marquants...)"
                  />
                </div>
              </div>
            </div>

            {/* Partie B: Anamnèse médicale (impression uniquement) */}
            <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300">
              <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">B</span>
                Informations médicales
                <span className="ml-auto text-xs font-normal text-gray-500 italic">
                  (à compléter à la main - non stocké numériquement)
                </span>
              </h3>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Diagnostic(s)</label>
                    <div className="border border-gray-300 bg-white rounded p-2 min-h-[60px]">
                      <div className="text-gray-300 text-sm">____________________________________</div>
                      <div className="text-gray-300 text-sm mt-2">____________________________________</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Date du diagnostic</label>
                    <div className="border border-gray-300 bg-white rounded p-2 min-h-[60px]">
                      <div className="text-gray-300 text-sm">____/____/________</div>
                      <div className="text-gray-300 text-sm mt-2">Par : ____________________________</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Bilans réalisés (type, date, professionnel)</label>
                  <div className="border border-gray-300 bg-white rounded p-2 min-h-[80px]">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-1 text-gray-300">Type : ____________</td>
                          <td className="py-1 text-gray-300">Date : ____/____/____</td>
                          <td className="py-1 text-gray-300">Par : ____________</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-300">Type : ____________</td>
                          <td className="py-1 text-gray-300">Date : ____/____/____</td>
                          <td className="py-1 text-gray-300">Par : ____________</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-300">Type : ____________</td>
                          <td className="py-1 text-gray-300">Date : ____/____/____</td>
                          <td className="py-1 text-gray-300">Par : ____________</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Traitements en cours</label>
                    <div className="border border-gray-300 bg-white rounded p-2 min-h-[60px]">
                      <div className="text-gray-300 text-sm">____________________________________</div>
                      <div className="text-gray-300 text-sm mt-2">____________________________________</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Allergies / Contre-indications</label>
                    <div className="border border-gray-300 bg-white rounded p-2 min-h-[60px]">
                      <div className="text-gray-300 text-sm">____________________________________</div>
                      <div className="text-gray-300 text-sm mt-2">____________________________________</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Antécédents médicaux pertinents</label>
                  <div className="border border-gray-300 bg-white rounded p-2 min-h-[60px]">
                    <div className="text-gray-300 text-sm">__________________________________________________________________________</div>
                    <div className="text-gray-300 text-sm mt-2">__________________________________________________________________________</div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 italic text-center mt-2">
                  Ces informations médicales ne sont pas stockées sur la plateforme.
                  Cette section est destinée à être complétée manuellement après impression.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Contexte */}
        <section className="mb-6 sm:mb-8 print-break">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white px-3 sm:px-4 py-2 rounded-t-lg" style={{ backgroundColor: '#027e7e' }}>
            3. CONTEXTE ET ENVIRONNEMENT
          </h2>
          <div className="border border-gray-300 border-t-0 rounded-b-lg p-3 sm:p-4">
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-gray-900 block mb-2">Scolarité / Lieu d'accueil</label>
                <textarea
                  value={ppaData.school_info}
                  onChange={(e) => setPpaData({ ...ppaData, school_info: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 min-h-[60px]"
                  placeholder="École, classe, dispositif (ULIS, UEMA...), AVS..."
                />
              </div>
              <div>
                <label className="font-semibold text-gray-900 block mb-2">Autres professionnels intervenant</label>
                <textarea
                  value={ppaData.other_professionals}
                  onChange={(e) => setPpaData({ ...ppaData, other_professionals: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 min-h-[60px]"
                  placeholder="Orthophoniste, psychomotricien, psychologue, SESSAD..."
                />
              </div>
              <div>
                <label className="font-semibold text-gray-900 block mb-2">Attentes de la famille</label>
                <textarea
                  value={ppaData.family_expectations}
                  onChange={(e) => setPpaData({ ...ppaData, family_expectations: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 min-h-[60px]"
                  placeholder="Priorités et souhaits exprimés par la famille..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Synthèse d'évaluation par domaine */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white px-3 sm:px-4 py-2 rounded-t-lg" style={{ backgroundColor: '#027e7e' }}>
            4. SYNTHÈSE D'ÉVALUATION PAR DOMAINE
          </h2>
          <div className="border border-gray-300 border-t-0 rounded-b-lg p-3 sm:p-4">
            <p className="text-sm text-gray-600 mb-4 italic">
              Basé sur les évaluations VABS-2, EFI-Ré/TTAP et observations cliniques
            </p>

            {/* Communication */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 pb-1 border-b-2" style={{ color: '#027e7e', borderColor: '#c9eaea' }}>
                COMMUNICATION
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Réceptive</label>
                  <textarea
                    value={ppaData.comm_receptive}
                    onChange={(e) => setPpaData({ ...ppaData, comm_receptive: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Compréhension des consignes, instructions..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Expressive</label>
                  <textarea
                    value={ppaData.comm_expressive}
                    onChange={(e) => setPpaData({ ...ppaData, comm_expressive: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Expression verbale, non-verbale, PECS..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Écrite</label>
                  <textarea
                    value={ppaData.comm_written}
                    onChange={(e) => setPpaData({ ...ppaData, comm_written: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Lecture, écriture, niveau..."
                  />
                </div>
              </div>
            </div>

            {/* Autonomie */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 pb-1 border-b-2" style={{ color: '#027e7e', borderColor: '#c9eaea' }}>
                AUTONOMIE DANS LA VIE QUOTIDIENNE
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Personnelle</label>
                  <textarea
                    value={ppaData.autonomy_personal}
                    onChange={(e) => setPpaData({ ...ppaData, autonomy_personal: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Toilette, habillage, alimentation..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Domestique</label>
                  <textarea
                    value={ppaData.autonomy_domestic}
                    onChange={(e) => setPpaData({ ...ppaData, autonomy_domestic: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Tâches ménagères, rangement..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Communautaire</label>
                  <textarea
                    value={ppaData.autonomy_community}
                    onChange={(e) => setPpaData({ ...ppaData, autonomy_community: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Déplacements, courses, transports..."
                  />
                </div>
              </div>
            </div>

            {/* Socialisation */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 pb-1 border-b-2" style={{ color: '#027e7e', borderColor: '#c9eaea' }}>
                SOCIALISATION
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Relations interpersonnelles</label>
                  <textarea
                    value={ppaData.social_interpersonal}
                    onChange={(e) => setPpaData({ ...ppaData, social_interpersonal: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Interactions avec pairs, adultes..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Jeu et temps libre</label>
                  <textarea
                    value={ppaData.social_leisure}
                    onChange={(e) => setPpaData({ ...ppaData, social_leisure: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Types de jeux, activités de loisirs..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Adaptation</label>
                  <textarea
                    value={ppaData.social_adaptation}
                    onChange={(e) => setPpaData({ ...ppaData, social_adaptation: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Gestion des changements, flexibilité..."
                  />
                </div>
              </div>
            </div>

            {/* Motricité */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 pb-1 border-b-2" style={{ color: '#027e7e', borderColor: '#c9eaea' }}>
                MOTRICITÉ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Globale</label>
                  <textarea
                    value={ppaData.motor_global}
                    onChange={(e) => setPpaData({ ...ppaData, motor_global: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Équilibre, coordination, déplacements..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Fine</label>
                  <textarea
                    value={ppaData.motor_fine}
                    onChange={(e) => setPpaData({ ...ppaData, motor_fine: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                    placeholder="Préhension, graphisme, manipulation..."
                  />
                </div>
              </div>
            </div>

            {/* Profil Sensoriel */}
            <div className="mb-6 print-break">
              <h3 className="font-bold mb-3 pb-1 border-b-2 text-sm sm:text-base" style={{ color: '#027e7e', borderColor: '#c9eaea' }}>
                PROFIL SENSORIEL
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Visuel</label>
                  <textarea
                    value={ppaData.sensory_visual}
                    onChange={(e) => setPpaData({ ...ppaData, sensory_visual: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Hyper/hypo sensibilité..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Auditif</label>
                  <textarea
                    value={ppaData.sensory_auditory}
                    onChange={(e) => setPpaData({ ...ppaData, sensory_auditory: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Réactions aux sons..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Gustatif</label>
                  <textarea
                    value={ppaData.sensory_gustatory}
                    onChange={(e) => setPpaData({ ...ppaData, sensory_gustatory: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Préférences alimentaires..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Olfactif</label>
                  <textarea
                    value={ppaData.sensory_olfactory}
                    onChange={(e) => setPpaData({ ...ppaData, sensory_olfactory: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Réactions aux odeurs..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Tactile</label>
                  <textarea
                    value={ppaData.sensory_tactile}
                    onChange={(e) => setPpaData({ ...ppaData, sensory_tactile: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Textures, toucher..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Proprioceptif</label>
                  <textarea
                    value={ppaData.sensory_proprioceptive}
                    onChange={(e) => setPpaData({ ...ppaData, sensory_proprioceptive: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Perception du corps..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Vestibulaire</label>
                  <textarea
                    value={ppaData.sensory_vestibular}
                    onChange={(e) => setPpaData({ ...ppaData, sensory_vestibular: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Équilibre, mouvements..."
                  />
                </div>
              </div>
            </div>

            {/* Cognitif & Apprentissages */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 pb-1 border-b-2" style={{ color: '#027e7e', borderColor: '#c9eaea' }}>
                COGNITIF & APPRENTISSAGES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Conditions facilitant la participation</label>
                  <textarea
                    value={ppaData.cognitive_facilitating_conditions}
                    onChange={(e) => setPpaData({ ...ppaData, cognitive_facilitating_conditions: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Environnement calme, routines..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Position de travail</label>
                  <textarea
                    value={ppaData.cognitive_position}
                    onChange={(e) => setPpaData({ ...ppaData, cognitive_position: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Assis, debout, position préférée..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Guidances et incitations</label>
                  <textarea
                    value={ppaData.cognitive_guidance}
                    onChange={(e) => setPpaData({ ...ppaData, cognitive_guidance: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Physique, gestuelle, verbale..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Structuration du matériel</label>
                  <textarea
                    value={ppaData.cognitive_material_structure}
                    onChange={(e) => setPpaData({ ...ppaData, cognitive_material_structure: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm min-h-[60px]"
                    placeholder="Organisation, présentation..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Temps d'attention max</label>
                  <input
                    type="text"
                    value={ppaData.cognitive_attention_time}
                    onChange={(e) => setPpaData({ ...ppaData, cognitive_attention_time: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    placeholder="Ex: 10-15 minutes"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nombre max de tâches</label>
                  <input
                    type="text"
                    value={ppaData.cognitive_max_tasks}
                    onChange={(e) => setPpaData({ ...ppaData, cognitive_max_tasks: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    placeholder="Ex: 3-4 tâches/séance"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Pistes de travail</label>
                  <input
                    type="text"
                    value={ppaData.cognitive_work_leads}
                    onChange={(e) => setPpaData({ ...ppaData, cognitive_work_leads: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    placeholder="Axes à développer..."
                  />
                </div>
              </div>
            </div>

            {/* Psycho-affectif */}
            <div className="mb-6">
              <h3 className="font-bold mb-3 pb-1 border-b-2" style={{ color: '#027e7e', borderColor: '#c9eaea' }}>
                PSYCHO-AFFECTIF
              </h3>
              <textarea
                value={ppaData.psycho_affective}
                onChange={(e) => setPpaData({ ...ppaData, psycho_affective: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                placeholder="État émotionnel, régulation, anxiété, humeur, relations affectives..."
              />
            </div>

            {/* Comportements problèmes */}
            <div className="mb-2">
              <h3 className="font-bold mb-3 pb-1 border-b-2" style={{ color: '#027e7e', borderColor: '#c9eaea' }}>
                COMPORTEMENTS PROBLÈMES
              </h3>
              <textarea
                value={ppaData.problem_behaviors}
                onChange={(e) => setPpaData({ ...ppaData, problem_behaviors: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-sm min-h-[80px]"
                placeholder="Description des comportements, fréquence, déclencheurs identifiés, stratégies de gestion..."
              />
            </div>
          </div>
        </section>

        {/* Section 5: Objectifs */}
        <section className="mb-6 sm:mb-8 print-break">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white px-3 sm:px-4 py-2 rounded-t-lg" style={{ backgroundColor: '#027e7e' }}>
            5. OBJECTIFS D'ACCOMPAGNEMENT
          </h2>
          <div className="border border-gray-300 border-t-0 rounded-b-lg p-3 sm:p-4">
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#027e7e' }}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">Domaine : {categoryLabels[goal.category]}</p>
                        {goal.description && (
                          <p className="text-sm text-gray-700 mb-2">{goal.description}</p>
                        )}
                        {goal.measurable && (
                          <p className="text-sm"><strong>Critère de réussite :</strong> {goal.measurable}</p>
                        )}
                        {goal.target_date && (
                          <p className="text-sm"><strong>Échéance :</strong> {new Date(goal.target_date).toLocaleDateString('fr-FR')}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-gray-600">Progression :</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-xs">
                            <div className="h-2 rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: '#027e7e' }} />
                          </div>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: '#027e7e' }}>
                        {i}
                      </span>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-sm text-gray-600">Objectif :</label>
                          <div className="border-b border-gray-300 py-1">_________________________________</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-600">Domaine :</label>
                            <div className="border-b border-gray-300 py-1">____________</div>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Échéance :</label>
                            <div className="border-b border-gray-300 py-1">____/____/____</div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Critère de réussite :</label>
                          <div className="border-b border-gray-300 py-1">_________________________________</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Moyens/Stratégies :</label>
                          <div className="border-b border-gray-300 py-1">_________________________________</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Axes prioritaires */}
            <div className="mt-6 pt-4 border-t">
              <label className="font-semibold text-gray-900 block mb-2">Axes prioritaires de travail</label>
              <textarea
                value={ppaData.priority_axes}
                onChange={(e) => setPpaData({ ...ppaData, priority_axes: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 min-h-[60px]"
                placeholder="1. ...\n2. ...\n3. ..."
              />
            </div>
          </div>
        </section>

        {/* Section 6: Modalités */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white px-3 sm:px-4 py-2 rounded-t-lg" style={{ backgroundColor: '#027e7e' }}>
            6. MODALITÉS D'ACCOMPAGNEMENT
          </h2>
          <div className="border border-gray-300 border-t-0 rounded-b-lg p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="font-semibold text-gray-900 block mb-2">Fréquence des séances</label>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="frequency"
                      checked={ppaData.session_frequency === '1x_semaine'}
                      onChange={() => setPpaData({ ...ppaData, session_frequency: '1x_semaine' })}
                      className="rounded"
                    /> 1 fois/semaine
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="frequency"
                      checked={ppaData.session_frequency === '2x_semaine'}
                      onChange={() => setPpaData({ ...ppaData, session_frequency: '2x_semaine' })}
                      className="rounded"
                    /> 2 fois/semaine
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="frequency"
                      checked={ppaData.session_frequency === '3x_semaine'}
                      onChange={() => setPpaData({ ...ppaData, session_frequency: '3x_semaine' })}
                      className="rounded"
                    /> 3 fois/semaine
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="frequency"
                      checked={ppaData.session_frequency === 'autre'}
                      onChange={() => setPpaData({ ...ppaData, session_frequency: 'autre' })}
                      className="rounded"
                    /> Autre
                  </label>
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-900 block mb-2">Lieu d'intervention</label>
                <div className="space-y-2 text-sm">
                  {['domicile', 'cabinet', 'ecole', 'exterieur'].map(lieu => (
                    <label key={lieu} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ppaData.intervention_locations.includes(lieu)}
                        onChange={(e) => {
                          const newLocations = e.target.checked
                            ? [...ppaData.intervention_locations, lieu]
                            : ppaData.intervention_locations.filter(l => l !== lieu);
                          setPpaData({ ...ppaData, intervention_locations: newLocations });
                        }}
                        className="rounded"
                      /> {lieu === 'domicile' ? 'Domicile' : lieu === 'cabinet' ? 'Cabinet' : lieu === 'ecole' ? 'École' : 'Extérieur'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="font-semibold text-gray-900 block mb-2">Ressources / Matériel nécessaire</label>
              <textarea
                value={ppaData.resources_needed}
                onChange={(e) => setPpaData({ ...ppaData, resources_needed: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 min-h-[60px]"
                placeholder="Timer, supports visuels, pictogrammes..."
              />
            </div>
          </div>
        </section>

        {/* Section 7: Révision */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white px-3 sm:px-4 py-2 rounded-t-lg" style={{ backgroundColor: '#027e7e' }}>
            7. RÉVISION ET SUIVI
          </h2>
          <div className="border border-gray-300 border-t-0 rounded-b-lg p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="font-semibold text-gray-900 block mb-2">Date de prochaine révision</label>
                <input
                  type="date"
                  value={ppaData.next_review_date}
                  onChange={(e) => setPpaData({ ...ppaData, next_review_date: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-900 block mb-2">Fréquence de révision</label>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="review"
                      checked={ppaData.review_frequency === 'trimestrielle'}
                      onChange={() => setPpaData({ ...ppaData, review_frequency: 'trimestrielle' })}
                      className="rounded"
                    /> Trimestrielle
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="review"
                      checked={ppaData.review_frequency === 'semestrielle'}
                      onChange={() => setPpaData({ ...ppaData, review_frequency: 'semestrielle' })}
                      className="rounded"
                    /> Semestrielle
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="review"
                      checked={ppaData.review_frequency === 'annuelle'}
                      onChange={() => setPpaData({ ...ppaData, review_frequency: 'annuelle' })}
                      className="rounded"
                    /> Annuelle
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="font-semibold text-gray-900 block mb-2">Observations / Notes complémentaires</label>
              <textarea
                value={ppaData.observations}
                onChange={(e) => setPpaData({ ...ppaData, observations: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 min-h-[80px]"
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>
        </section>

        {/* Signatures */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white bg-gray-700 px-3 sm:px-4 py-2 rounded-t-lg">
            SIGNATURES
          </h2>
          <div className="border border-gray-300 border-t-0 rounded-b-lg p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-4">Responsable légal</p>
                <div className="border-b border-gray-400 h-20 mb-2"></div>
                <p className="text-sm text-gray-600">Date : ____/____/________</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-4">Intervenant</p>
                <div className="border-b border-gray-400 h-20 mb-2"></div>
                <p className="text-sm text-gray-600">Date : ____/____/________</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center italic">
              Ce document est établi en concertation avec la famille et l'ensemble des professionnels intervenant auprès de la personne.
              Il est révisé régulièrement selon l'évolution des besoins et des objectifs.
            </p>
          </div>
        </section>

        {/* Pied de page */}
        <footer className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">
          <p>Document généré via neurocare - {new Date().toLocaleDateString('fr-FR')}</p>
          <p>Ce document ne contient aucune donnée médicale - Usage éducatif uniquement</p>
        </footer>
      </div>

        {/* Gestion des accès PPA partagés */}
        <div className="no-print max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mt-4">
          <PpaAccessSection childId={childId} />
        </div>
      </div>

      {/* Modal Créer une version */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Créer une version
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Archiver l'état actuel du PPA avant de faire des modifications importantes.
              Vous pourrez consulter cette version ultérieurement.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la version (optionnel)
              </label>
              <input
                type="text"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="Ex: Révision trimestrielle T1 2025"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:border-transparent" style={{ '--tw-ring-color': '#027e7e' } as any}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createVersion}
                disabled={creatingVersion}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
              >
                {creatingVersion ? 'Création...' : 'Créer la version'}
              </button>
              <button
                onClick={() => {
                  setShowVersionModal(false);
                  setVersionLabel('');
                }}
                disabled={creatingVersion}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique des versions */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#027e7e' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historique des versions
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {versions.length} version{versions.length > 1 ? 's' : ''} archivée{versions.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {versions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Aucune version archivée</p>
                  <p className="text-sm mt-1">Créez une version pour sauvegarder l'état actuel du PPA</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {version.version_label || `Version ${version.version_number}`}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Archivée le {new Date(version.archived_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {version.evaluation_date && (
                            <p className="text-xs text-gray-400 mt-1">
                              Date d'évaluation : {new Date(version.evaluation_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          v{version.version_number}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => viewVersion(version.id)}
                          className="flex-1 text-sm px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#e6f4f4', color: '#027e7e' }}
                        >
                          Consulter
                        </button>
                        <button
                          onClick={() => deleteVersion(version.id)}
                          className="text-sm px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualisation d'une version */}
      {viewingVersion && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b bg-amber-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {selectedVersion.version_label || `Version ${selectedVersion.version_number}`}
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Version archivée - Lecture seule
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                  Archive
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Intervenant</h4>
                    <p className="text-gray-900">{selectedVersion.educator_name || '-'}</p>
                    <p className="text-sm text-gray-500">{selectedVersion.educator_structure || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Période d'évaluation</h4>
                    <p className="text-gray-900">
                      {selectedVersion.evaluation_period_start
                        ? new Date(selectedVersion.evaluation_period_start).toLocaleDateString('fr-FR')
                        : '-'}
                      {' → '}
                      {selectedVersion.evaluation_period_end
                        ? new Date(selectedVersion.evaluation_period_end).toLocaleDateString('fr-FR')
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Sections principales */}
                {selectedVersion.previous_support && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Accompagnements antérieurs</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedVersion.previous_support}</p>
                  </div>
                )}

                {selectedVersion.family_expectations && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Attentes de la famille</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedVersion.family_expectations}</p>
                  </div>
                )}

                {selectedVersion.priority_axes && (
                  <div className="border rounded-lg p-4" style={{ backgroundColor: '#e6f4f4' }}>
                    <h4 className="font-semibold mb-2" style={{ color: '#027e7e' }}>Axes prioritaires</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedVersion.priority_axes}</p>
                  </div>
                )}

                {selectedVersion.observations && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Observations</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedVersion.observations}</p>
                  </div>
                )}

                {/* Métadonnées */}
                <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-500">
                  <p>Créé le : {selectedVersion.original_created_at ? new Date(selectedVersion.original_created_at).toLocaleString('fr-FR') : '-'}</p>
                  <p>Dernière modification : {selectedVersion.original_updated_at ? new Date(selectedVersion.original_updated_at).toLocaleString('fr-FR') : '-'}</p>
                  <p>Archivé le : {new Date(selectedVersion.archived_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setViewingVersion(false);
                  setSelectedVersion(null);
                  setShowHistoryModal(true);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Retour à l'historique
              </button>
              <button
                onClick={() => {
                  setViewingVersion(false);
                  setSelectedVersion(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'action fixe mobile */}
      <div className="no-print fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 sm:hidden z-50 safe-area-bottom">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Versions</span>
          </button>
          <button
            onClick={savePPA}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-white rounded-lg text-xs"
            style={{ backgroundColor: '#027e7e' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Footer teal */}
      <div className="no-print mt-auto hidden sm:block" style={{ backgroundColor: '#027e7e', height: '40px' }}></div>
    </div>
  );
}
