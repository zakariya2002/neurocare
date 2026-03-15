'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CityAutocomplete from '@/components/CityAutocomplete';
import { CertificationType } from '@/types';

export default function CreateEducatorProfile() {
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
    bio: '',
    phone: '',
    location: '',
    years_of_experience: 0,
    hourly_rate: '',
    specializations: '',
    languages: '',
  });

  const [certifications, setCertifications] = useState<Array<{
    type: CertificationType;
    name: string;
    issuing_organization: string;
    issue_date: string;
  }>>([]);

  const addCertification = () => {
    setCertifications([...certifications, {
      type: 'ABA',
      name: '',
      issuing_organization: '',
      issue_date: '',
    }]);
  };

  const updateCertification = (index: number, field: string, value: any) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Créer le profil éducateur
      const { data: profile, error: profileError } = await supabase
        .from('educator_profiles')
        .insert({
          user_id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          phone: formData.phone,
          location: formData.location,
          years_of_experience: formData.years_of_experience,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          specializations: formData.specializations.split(',').map(s => s.trim()).filter(Boolean),
          languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Ajouter les certifications
      if (certifications.length > 0) {
        const certsToInsert = certifications.map(cert => ({
          educator_id: profile.id,
          ...cert,
        }));

        const { error: certsError } = await supabase
          .from('certifications')
          .insert(certsToInsert);

        if (certsError) throw certsError;
      }

      router.push('/dashboard/educator');
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
          Créer votre profil éducateur
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-white shadow-sm rounded-lg md:rounded-xl p-3 sm:p-4 md:p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Informations personnelles */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Informations personnelles</h3>
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
              <label className="block text-xs md:text-sm font-medium text-gray-700">Bio</label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Présentez-vous et décrivez votre expérience..."
              />
            </div>
          </div>

          {/* Expérience et tarifs */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Expérience et tarifs</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Années d'expérience *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.years_of_experience}
                  onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Tarif horaire (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Spécialisations (séparées par des virgules)</label>
              <input
                type="text"
                placeholder="Ex: Troubles du comportement, Communication, Autonomie"
                value={formData.specializations}
                onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Langues parlées (séparées par des virgules)</label>
              <input
                type="text"
                placeholder="Ex: Français, Anglais, Arabe"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Certifications */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Certifications</h3>
              <button
                type="button"
                onClick={addCertification}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Ajouter une certification
              </button>
            </div>

            {certifications.map((cert, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Certification {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeCertification(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={cert.type}
                      onChange={(e) => updateCertification(index, 'type', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="ABA">ABA</option>
                      <option value="TEACCH">TEACCH</option>
                      <option value="PECS">PECS</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Nom de la certification</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCertification(index, 'name', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Organisme émetteur</label>
                    <input
                      type="text"
                      value={cert.issuing_organization}
                      onChange={(e) => updateCertification(index, 'issuing_organization', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Date d'obtention</label>
                    <input
                      type="date"
                      value={cert.issue_date}
                      onChange={(e) => updateCertification(index, 'issue_date', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 md:py-2 px-2.5 md:px-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))}
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
