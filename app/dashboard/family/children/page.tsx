'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import { FEATURES } from '@/lib/feature-flags';

interface ChildProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  age: number | null;
  birth_date: string | null;
  tnd_types: string[];
  tnd_other: string | null;
  support_level_needed: string | null;
  description: string | null;
  accompaniment_types: string[];
  accompaniment_goals: string | null;
  schedule_preferences: string | null;
  location_preference: string | null;
  is_active: boolean;
  created_at: string;
}

const tndTypeOptions = [
  { value: 'tsa', label: 'TSA', fullName: 'Trouble du Spectre de l\'Autisme' },
  { value: 'tdah', label: 'TDAH', fullName: 'Trouble Déficit de l\'Attention avec ou sans Hyperactivité' },
  { value: 'dyslexie', label: 'Dyslexie', fullName: 'Trouble de la lecture' },
  { value: 'dyspraxie', label: 'Dyspraxie', fullName: 'Trouble de la coordination motrice' },
  { value: 'dyscalculie', label: 'Dyscalculie', fullName: 'Trouble du calcul' },
  { value: 'dysorthographie', label: 'Dysorthographie', fullName: 'Trouble de l\'écriture' },
  { value: 'dysphasie', label: 'Dysphasie', fullName: 'Trouble du langage oral' },
  { value: 'tdi', label: 'TDI', fullName: 'Trouble du Développement Intellectuel' },
  { value: 'autre', label: 'Autre', fullName: 'Autre trouble' },
];

const tndTypeLabels: Record<string, string> = {
  tsa: 'TSA',
  tdah: 'TDAH',
  dyslexie: 'Dyslexie',
  dyspraxie: 'Dyspraxie',
  dyscalculie: 'Dyscalculie',
  dysorthographie: 'Dysorthographie',
  dysphasie: 'Dysphasie',
  tdi: 'TDI',
  autre: 'Autre',
};

const accompanimentTypeLabels: Record<string, string> = {
  scolaire: 'Soutien scolaire',
  comportemental: 'Gestion du comportement',
  socialisation: 'Socialisation',
  autonomie: 'Autonomie',
  communication: 'Communication',
  motricite: 'Motricité',
  sensoriel: 'Sensoriel',
  loisirs: 'Loisirs',
};

const supportLevelLabels: Record<string, string> = {
  level_1: 'Niveau 1',
  level_2: 'Niveau 2',
  level_3: 'Niveau 3',
};

const scheduleOptions = [
  { value: 'lundi', label: 'Lundi' },
  { value: 'mardi', label: 'Mardi' },
  { value: 'mercredi', label: 'Mercredi' },
  { value: 'jeudi', label: 'Jeudi' },
  { value: 'vendredi', label: 'Vendredi' },
  { value: 'samedi', label: 'Samedi' },
  { value: 'dimanche', label: 'Dimanche' },
  { value: 'matin', label: 'Matin (8h-12h)' },
  { value: 'journee', label: 'Journée (9h-16h)' },
  { value: 'apres-midi', label: 'Après-midi (14h-17h)' },
  { value: 'soir', label: 'Soir (17h-20h)' },
];

export default function ChildrenPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mdphStatuses, setMdphStatuses] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    tnd_types: [] as string[],
    tnd_other: '',
    support_level_needed: 'level_1',
    description: '',
    accompaniment_types: [] as string[],
    accompaniment_goals: '',
    schedule_preferences: [] as string[],
    location_preference: 'both',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

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
      setFamilyId(familyProfile.id);

      // Récupérer les enfants
      const { data: childrenData, error: childrenError } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('family_id', familyProfile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);

      // Récupérer les statuts MDPH
      const childIds = (childrenData || []).map((c: any) => c.id);
      if (childIds.length > 0) {
        const { data: mdphData } = await supabase
          .from('child_mdph_status')
          .select('child_id, status, expiry_date')
          .in('child_id', childIds);
        const mdphMap: Record<string, any> = {};
        (mdphData || []).forEach((m: any) => { mdphMap[m.child_id] = m; });
        setMdphStatuses(mdphMap);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      birth_date: '',
      tnd_types: [],
      tnd_other: '',
      support_level_needed: 'level_1',
      description: '',
      accompaniment_types: [],
      accompaniment_goals: '',
      schedule_preferences: [],
      location_preference: 'both',
    });
    setEditingChild(null);
    setError('');
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (child: ChildProfile) => {
    // Parse schedule_preferences (peut être une string JSON ou un tableau)
    let schedulePrefs: string[] = [];
    if (child.schedule_preferences) {
      if (Array.isArray(child.schedule_preferences)) {
        schedulePrefs = child.schedule_preferences;
      } else if (typeof child.schedule_preferences === 'string') {
        try {
          schedulePrefs = JSON.parse(child.schedule_preferences);
        } catch {
          // Si ce n'est pas du JSON, on le garde comme string vide
          schedulePrefs = [];
        }
      }
    }

    setFormData({
      first_name: child.first_name,
      last_name: child.last_name || '',
      birth_date: child.birth_date || '',
      tnd_types: child.tnd_types || [],
      tnd_other: child.tnd_other || '',
      support_level_needed: child.support_level_needed || 'level_1',
      description: child.description || '',
      accompaniment_types: child.accompaniment_types || [],
      accompaniment_goals: child.accompaniment_goals || '',
      schedule_preferences: schedulePrefs,
      location_preference: child.location_preference || 'both',
    });
    setEditingChild(child);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleTndTypeToggle = (type: string) => {
    const current = formData.tnd_types;
    if (current.includes(type)) {
      setFormData({ ...formData, tnd_types: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, tnd_types: [...current, type] });
    }
  };

  const handleAccompanimentTypeToggle = (type: string) => {
    const current = formData.accompaniment_types;
    if (current.includes(type)) {
      setFormData({ ...formData, accompaniment_types: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, accompaniment_types: [...current, type] });
    }
  };

  const handleScheduleToggle = (value: string) => {
    const current = formData.schedule_preferences;
    if (current.includes(value)) {
      setFormData({ ...formData, schedule_preferences: current.filter(v => v !== value) });
    } else {
      setFormData({ ...formData, schedule_preferences: [...current, value] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) {
      setError('Le prénom est obligatoire');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const childData = {
        family_id: profile.id,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || null,
        birth_date: formData.birth_date || null,
        tnd_types: formData.tnd_types,
        tnd_other: formData.tnd_types.includes('autre') ? formData.tnd_other.trim() || null : null,
        support_level_needed: formData.support_level_needed,
        description: formData.description || null,
        accompaniment_types: formData.accompaniment_types,
        accompaniment_goals: formData.accompaniment_goals || null,
        schedule_preferences: formData.schedule_preferences.length > 0 ? JSON.stringify(formData.schedule_preferences) : null,
        location_preference: formData.location_preference,
      };

      if (editingChild) {
        // Mise à jour
        const { error: updateError } = await supabase
          .from('child_profiles')
          .update(childData)
          .eq('id', editingChild.id);

        if (updateError) throw updateError;
      } else {
        // Création
        const { error: insertError } = await supabase
          .from('child_profiles')
          .insert(childData);

        if (insertError) throw insertError;
      }

      await fetchData();
      closeModal();
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet accompagnement ?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('child_profiles')
        .update({ is_active: false })
        .eq('id', childId);

      if (deleteError) throw deleteError;
      await fetchData();
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="sticky top-0 z-40">
          <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100 mx-4 px-12">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4" style={{ borderColor: 'rgba(2, 126, 126, 0.2)' }} aria-hidden="true"></div>
              </div>
              <div className="animate-spin rounded-full h-20 w-20 border-4 mx-auto" style={{ borderTopColor: '#027e7e', borderRightColor: '#3a9e9e', borderBottomColor: '#6bbebe', borderLeftColor: 'rgba(2, 126, 126, 0.2)' }} aria-hidden="true"></div>
            </div>
            <p className="text-gray-700 font-semibold mt-6 text-lg" style={{ fontFamily: 'Verdana, sans-serif' }}>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={profile} familyId={familyId} userId={userId} />
      </div>

      {/* Section Titre */}
      <section className="py-3 sm:py-5 md:py-8 px-3 sm:px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
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
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center p-1" style={{ backgroundColor: '#027e7e' }}>
            <img
              src="/images/icons/3.svg"
              alt=""
              className="w-full h-full"
            />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Mes proches
          </h1>
          <div className="w-24 sm:w-32 h-[2px] bg-gray-300 mx-auto mb-3 sm:mb-4 md:mb-6"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-3 sm:mb-4 md:mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Gérez les profils des personnes que vous accompagnez
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 md:px-6 md:py-3 text-white rounded-xl hover:opacity-90 transition-all text-xs sm:text-sm md:text-base font-bold shadow-md hover:shadow-lg"
            style={{ backgroundColor: '#f0879f' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un proche
          </button>
        </div>
      </section>

      <div className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-16 w-full">
        {/* Liste des enfants */}
        {children.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
              <svg className="w-12 h-12" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>Aucun proche enregistré</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Ajoutez un proche pour personnaliser le suivi et faciliter la recherche de professionnels adaptés.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
              style={{ backgroundColor: '#027e7e' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter mon premier proche
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            {children.map((child) => (
              <div key={child.id} className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group relative">
                {/* Actions en position absolue sur mobile */}
                <div className="absolute top-4 right-4 flex items-center gap-1 sm:hidden z-10">
                  <button
                    onClick={() => openEditModal(child)}
                    className="p-2 rounded-full hover:bg-teal-50 transition"
                    style={{ color: '#027e7e' }}
                    title="Modifier"
                    aria-label="Modifier l'accompagnement"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(child.id)}
                    className="p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Supprimer"
                    aria-label="Supprimer l'accompagnement"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4 sm:gap-5 pr-20 sm:pr-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      <div className="relative">
                        <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 sm:border-3 border-white transition-all" style={{ backgroundColor: 'rgba(2, 126, 126, 0.1)' }}>
                          <span className="text-xl sm:text-2xl font-bold" style={{ color: '#027e7e' }}>
                            {child.first_name[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors" style={{ fontFamily: 'Verdana, sans-serif' }}>{child.first_name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {child.birth_date && (
                              <span className="text-xs sm:text-sm text-gray-500" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                                Né(e) le {new Date(child.birth_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {!child.birth_date && child.age && (
                              <span className="text-xs sm:text-sm text-gray-500">{child.age} ans</span>
                            )}
                            {child.location_preference && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border" style={{ backgroundColor: 'rgba(107, 190, 190, 0.1)', color: '#6bbebe', borderColor: 'rgba(107, 190, 190, 0.2)' }}>
                                {child.location_preference === 'domicile' ? 'Domicile' :
                                 child.location_preference === 'exterieur' ? 'Extérieur' : 'Dom./Ext.'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions desktop */}
                        <div className="hidden sm:flex items-center gap-2 mt-2 sm:mt-0">
                          <button
                            onClick={() => openEditModal(child)}
                            className="p-2 rounded-lg hover:bg-teal-50 transition"
                            style={{ color: '#027e7e' }}
                            title="Modifier les infos de base"
                            aria-label="Modifier l'accompagnement"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer"
                            aria-label="Supprimer l'accompagnement"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {child.tnd_types && child.tnd_types.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {child.tnd_types.map((type) => (
                            <span key={type} className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium border" style={{ backgroundColor: 'rgba(240, 135, 159, 0.1)', color: '#f0879f', borderColor: 'rgba(240, 135, 159, 0.2)' }}>
                              {type === 'autre' && child.tnd_other
                                ? `Autre: ${child.tnd_other}`
                                : tndTypeLabels[type] || type}
                            </span>
                          ))}
                        </div>
                      )}

                      {child.accompaniment_types && child.accompaniment_types.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {child.accompaniment_types.map((type) => (
                            <span key={type} className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium border" style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', color: '#027e7e', borderColor: 'rgba(2, 126, 126, 0.2)' }}>
                              {accompanimentTypeLabels[type] || type}
                            </span>
                          ))}
                        </div>
                      )}

                      {child.description && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2" style={{ fontFamily: 'Open Sans, sans-serif' }}>{child.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Boutons d'action - bien visibles */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {/* Bouton dossier MDPH */}
                    <Link
                      href={`/dashboard/family/children/${child.id}/dossier?tab=mdph`}
                      className="flex items-center justify-between w-full p-3 sm:p-4 rounded-xl transition-all group/link border"
                      style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)', borderColor: 'rgba(79, 70, 229, 0.2)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition flex-shrink-0 shadow-md" style={{ backgroundColor: '#4f46e5' }}>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-bold block text-sm sm:text-base" style={{ color: '#4f46e5', fontFamily: 'Verdana, sans-serif' }}>Dossier MDPH</span>
                          <span className="text-xs text-gray-500 hidden sm:block" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                            {mdphStatuses[child.id]
                              ? (() => {
                                  const s = mdphStatuses[child.id].status;
                                  const labels: Record<string, string> = { non_depose: 'Non deposé', en_cours: 'En cours', accepte: 'Accepté', refuse: 'Refusé', renouvellement: 'Renouvellement' };
                                  return `Statut : ${labels[s] || s}`;
                                })()
                              : 'Suivi des droits, aides AEEH/PCH, AESH...'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {mdphStatuses[child.id]?.expiry_date && (() => {
                          const days = Math.ceil((new Date(mdphStatuses[child.id].expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          if (days <= 0) return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">Expiré</span>;
                          if (days <= 90) return <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">{days}j restants</span>;
                          return null;
                        })()}
                        <svg className="w-5 h-5 group-hover/link:translate-x-1 transition-transform flex-shrink-0" style={{ color: '#4f46e5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>

                    {/* Bouton dossier complet */}
                    <Link
                      href={`/dashboard/family/children/${child.id}/dossier`}
                      className="flex items-center justify-between w-full p-3 sm:p-4 rounded-xl transition-all group/link border"
                      style={{ backgroundColor: 'rgba(2, 126, 126, 0.05)', borderColor: 'rgba(2, 126, 126, 0.2)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition flex-shrink-0 shadow-md" style={{ backgroundColor: '#027e7e' }}>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-bold block text-sm sm:text-base" style={{ color: '#027e7e', fontFamily: 'Verdana, sans-serif' }}>Dossier complet</span>
                          <span className="text-xs text-gray-500 hidden sm:block" style={{ fontFamily: 'Open Sans, sans-serif' }}>Profil, compétences, objectifs, PPA...</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 group-hover/link:translate-x-1 transition-transform flex-shrink-0" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    {/* Bouton Scolarité (B3') */}
                    {FEATURES.scolarite && (
                      <Link
                        href={`/dashboard/family/children/${child.id}/scolarite`}
                        className="flex items-center justify-between w-full p-3 sm:p-4 rounded-xl transition-all group/link border"
                        style={{ backgroundColor: 'rgba(58, 158, 158, 0.05)', borderColor: 'rgba(58, 158, 158, 0.2)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition flex-shrink-0 shadow-md" style={{ backgroundColor: '#3a9e9e' }}>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-bold block text-sm sm:text-base" style={{ color: '#3a9e9e', fontFamily: 'Verdana, sans-serif' }}>Scolarité</span>
                            <span className="text-xs text-gray-500 hidden sm:block" style={{ fontFamily: 'Open Sans, sans-serif' }}>École, dispositif, AESH, ESS…</span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 group-hover/link:translate-x-1 transition-transform flex-shrink-0" style={{ color: '#3a9e9e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajout/Edition */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-stretch sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white sm:rounded-2xl shadow-xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#027e7e' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  {editingChild ? 'Modifier le profil' : 'Ajouter un proche'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Fermer la modale">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r" role="alert">
                  {error}
                </div>
              )}

              {/* Prénom, Nom et date de naissance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Prénom <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
                    style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
                    placeholder="Prénom du proche"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
                    style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
                    placeholder="Nom du proche"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Date de naissance</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
                    style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
                  style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
                  placeholder="Personnalité, centres d'intérêt, forces..."
                />
              </div>

              {/* Types de TND */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Troubles du Neurodéveloppement (TND)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Sélectionnez le ou les troubles diagnostiqués
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {tndTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.tnd_types.includes(option.value)
                          ? 'border-transparent'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={formData.tnd_types.includes(option.value) ? { backgroundColor: 'rgba(240, 135, 159, 0.1)', borderColor: '#f0879f' } : {}}
                      title={option.fullName}
                    >
                      <input
                        type="checkbox"
                        checked={formData.tnd_types.includes(option.value)}
                        onChange={() => handleTndTypeToggle(option.value)}
                        className="h-4 w-4 border-gray-300 rounded flex-shrink-0"
                        style={{ accentColor: '#f0879f' }}
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700 font-medium truncate">{option.label}</span>
                    </label>
                  ))}
                </div>
                {formData.tnd_types.length > 0 && (
                  <p className="mt-2 text-xs font-medium" style={{ color: '#f0879f' }}>
                    {formData.tnd_types.length} trouble(s) sélectionné(s)
                  </p>
                )}

                {/* Champ texte si "Autre" est sélectionné */}
                {formData.tnd_types.includes('autre') && (
                  <div className="mt-3">
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                      Précisez le trouble
                    </label>
                    <input
                      type="text"
                      value={formData.tnd_other}
                      onChange={(e) => setFormData({ ...formData, tnd_other: e.target.value })}
                      className="w-full border rounded-lg py-3 px-4 focus:ring-2 focus:outline-none focus:border-transparent text-base"
                      style={{ borderColor: '#f0879f', '--tw-ring-color': '#f0879f', fontSize: '16px' } as any}
                      placeholder="Ex: Syndrome de Gilles de la Tourette..."
                    />
                  </div>
                )}
              </div>

              {/* Types d'accompagnement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">Accompagnement recherché</label>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {Object.entries(accompanimentTypeLabels).map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex items-center p-2 sm:p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.accompaniment_types.includes(value)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.accompaniment_types.includes(value)}
                        onChange={() => handleAccompanimentTypeToggle(value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded flex-shrink-0"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-700 truncate">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Objectifs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Objectifs d'accompagnement</label>
                <textarea
                  rows={2}
                  value={formData.accompaniment_goals}
                  onChange={(e) => setFormData({ ...formData, accompaniment_goals: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:outline-none text-base"
                  style={{ '--tw-ring-color': '#027e7e', fontSize: '16px' } as any}
                  placeholder="Quels sont vos objectifs pour cet accompagnement ?"
                />
              </div>

              {/* Préférences horaires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">Préférences horaires</label>
                <div className="space-y-3">
                  {/* Jours */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Jours préférés</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {scheduleOptions.slice(0, 7).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleScheduleToggle(option.value)}
                          className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-all ${
                            formData.schedule_preferences.includes(option.value)
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Créneaux */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Créneaux préférés</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {scheduleOptions.slice(7).map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleScheduleToggle(option.value)}
                          className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-all ${
                            formData.schedule_preferences.includes(option.value)
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Préférence de lieu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Préférence de lieu</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { value: 'domicile', label: 'Domicile', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { value: 'exterieur', label: 'Extérieur', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
                    { value: 'both', label: 'Les deux', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-col items-center p-2 sm:p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.location_preference === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="location_preference"
                        value={option.value}
                        checked={formData.location_preference === option.value}
                        onChange={(e) => setFormData({ ...formData, location_preference: e.target.value })}
                        className="sr-only"
                      />
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                      </svg>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-6 sm:pb-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-6 py-3.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-semibold text-base"
                  style={{ fontSize: '16px' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition font-semibold shadow-md text-base"
                  style={{ backgroundColor: '#027e7e', fontSize: '16px' }}
                >
                  {saving ? 'Enregistrement...' : (editingChild ? 'Enregistrer' : 'Ajouter')}
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
