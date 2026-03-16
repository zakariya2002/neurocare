'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import FamilyNavbar from '@/components/FamilyNavbar';
import { useToast } from '@/components/Toast';

export default function CreateReviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');
  const educatorId = searchParams.get('educator');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [familyId, setFamilyId] = useState('');
  const [familyProfile, setFamilyProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [educator, setEducator] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserId(user.id);

      // Parallelize all independent queries
      const queries: PromiseLike<any>[] = [
        supabase
          .from('family_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ];

      if (educatorId) {
        queries.push(
          supabase
            .from('educator_profiles')
            .select('id, first_name, last_name, avatar_url, profession_type')
            .eq('id', educatorId)
            .single()
        );
      }

      if (bookingId) {
        queries.push(
          supabase
            .from('appointments')
            .select('id, appointment_date, start_time')
            .eq('id', bookingId)
            .single()
        );
      }

      const results = await Promise.all(queries);

      // Profile is always the first result
      const profileResult = results[0];
      if (profileResult.data) {
        setFamilyId(profileResult.data.id);
        setFamilyProfile(profileResult.data);
      }

      // Educator and appointment results depend on which queries were added
      let resultIndex = 1;
      if (educatorId) {
        const educatorResult = results[resultIndex];
        if (educatorResult?.data) {
          setEducator(educatorResult.data);
        }
        resultIndex++;
      }

      if (bookingId) {
        const appointmentResult = results[resultIndex];
        if (appointmentResult?.data) {
          setAppointment(appointmentResult.data);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insérer l'avis
      const { error } = await supabase
        .from('reviews')
        .insert({
          educator_id: educatorId,
          family_id: familyId,
          booking_id: bookingId,
          rating,
          comment,
        });

      if (error) throw error;

      // Mettre à jour le rating moyen de l'éducateur
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('educator_id', educatorId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabase
          .from('educator_profiles')
          .update({
            rating: Math.round(avgRating * 10) / 10,
            total_reviews: reviews.length
          })
          .eq('id', educatorId);
      }

      showToast('Merci pour votre avis !');
      router.push('/dashboard/family/bookings');
    } catch (error: any) {
      showToast('Erreur: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return 'Très insatisfait';
      case 2: return 'Insatisfait';
      case 3: return 'Moyen';
      case 4: return 'Satisfait';
      case 5: return 'Très satisfait';
      default: return '';
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#027e7e' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar */}
      <div className="sticky top-0 z-40">
        <FamilyNavbar profile={familyProfile} familyId={familyId} userId={userId} />
      </div>

      <div className="flex-1 max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 w-full">
        {/* En-tête */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0879f' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Laisser un avis</h1>
          <p className="text-gray-500 text-sm mt-1">Partagez votre expérience</p>
        </div>

        {/* Carte professionnel */}
        {educator && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-4">
              {educator.avatar_url ? (
                <img
                  src={educator.avatar_url}
                  alt={`${educator.first_name} ${educator.last_name}`}
                  className="w-14 h-14 rounded-full object-cover border-2"
                  style={{ borderColor: '#e6f4f4' }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f4f4' }}>
                  <svg className="w-7 h-7" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {educator.first_name} {educator.last_name}
                </h3>
                {appointment && (
                  <p className="text-sm text-gray-500">
                    RDV du {formatDate(appointment.appointment_date)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Note */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-3">
              Votre note
            </label>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <svg
                    className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${star <= rating ? '' : 'text-gray-300'}`}
                    style={star <= rating ? { color: '#f0879f' } : {}}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="text-center text-sm font-medium" style={{ color: '#f0879f' }}>
              {getRatingLabel(rating)}
            </p>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
              Votre commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience avec ce professionnel..."
              className="w-full border border-gray-300 rounded-xl shadow-sm py-1.5 md:py-2 lg:py-3 px-2.5 md:px-3 lg:px-4 focus:ring-2 focus:border-transparent transition-all resize-none text-sm text-gray-900"
              style={{ outlineColor: '#027e7e' }}
            />
            <p className="text-[11px] md:text-xs text-gray-400 mt-1">
              Votre avis aidera d'autres familles à faire leur choix
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/family/bookings"
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-center text-xs sm:text-sm md:text-base font-medium transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-white rounded-xl text-xs sm:text-sm md:text-base font-medium transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#027e7e' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Publier l'avis
                </>
              )}
            </button>
          </div>
        </form>

        {/* Note de confidentialité */}
        <p className="text-[11px] md:text-xs text-gray-400 text-center mt-4 sm:mt-6">
          Votre avis sera publié avec votre prénom. Vous pouvez le modifier ou le supprimer à tout moment.
        </p>
      </div>
    </div>
  );
}
