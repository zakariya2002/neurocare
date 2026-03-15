'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CityAutocomplete from '@/components/CityAutocomplete';
import { SupportLevel } from '@/types';

export default function CreateFamilyProfile() {
  const router = useRouter();

  // Redirection vers la nouvelle page d'inscription
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signup');
      }
    };
    checkAuth();
  }, [router]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    relationship: 'parent',
    person_with_autism_age: '',
    support_level_needed: 'level_1' as SupportLevel,
    specific_needs: '',
    preferred_certifications: [] as string[],
    budget_min: '',
    budget_max: '',
  });

  const handleCertificationToggle = (cert: string) => {
    const current = formData.preferred_certifications;
    if (current.includes(cert)) {
      setFormData({
        ...formData,
        preferred_certifications: current.filter(c => c !== cert),
      });
    } else {
      setFormData({
        ...formData,
        preferred_certifications: [...current, cert],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error: profileError } = await supabase
        .from('family_profiles')
        .insert({
          user_id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          location: formData.location,
          relationship: formData.relationship,
          person_with_autism_age: formData.person_with_autism_age ? parseInt(formData.person_with_autism_age) : null,
          support_level_needed: formData.support_level_needed,
          specific_needs: formData.specific_needs.split(',').map(s => s.trim()).filter(Boolean),
          preferred_certifications: formData.preferred_certifications,
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        });

      if (profileError) throw profileError;

      router.push('/dashboard/family');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-5 sm:mb-8">
          Créer votre profil famille
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-white shadow-sm rounded-lg md:rounded-xl p-3 sm:p-4 md:p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations personnelles */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Informations de contact</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Localisation *</label>
              <CityAutocomplete
                value={formData.location}
                onChange={(val) => setFormData({ ...formData, location: val })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Vous êtes *</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="parent">Parent</option>
                <option value="guardian">Tuteur</option>
                <option value="self">Personne avec TSA</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          {/* Informations sur la personne avec TSA */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Informations sur la personne avec TSA</h3>

            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Âge</label>
              <input
                type="number"
                min="0"
                max="150"
                value={formData.person_with_autism_age}
                onChange={(e) => setFormData({ ...formData, person_with_autism_age: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Niveau de soutien requis *</label>
              <select
                value={formData.support_level_needed}
                onChange={(e) => setFormData({ ...formData, support_level_needed: e.target.value as SupportLevel })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="level_1">Niveau 1 - Nécessite un soutien</option>
                <option value="level_2">Niveau 2 - Nécessite un soutien important</option>
                <option value="level_3">Niveau 3 - Nécessite un soutien très important</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Selon la classification DSM-5
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Besoins spécifiques (séparés par des virgules)</label>
              <textarea
                rows={3}
                placeholder="Ex: Communication non verbale, Gestion des comportements, Développement des compétences sociales"
                value={formData.specific_needs}
                onChange={(e) => setFormData({ ...formData, specific_needs: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Préférences */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Préférences</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications préférées (optionnel)
              </label>
              <div className="space-y-2">
                {['ABA', 'TEACCH', 'PECS'].map(cert => (
                  <label key={cert} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferred_certifications.includes(cert)}
                      onChange={() => handleCertificationToggle(cert)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{cert}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Budget minimum (€/heure)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget_min}
                  onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Budget maximum (€/heure)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Création du profil...' : 'Créer mon profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
