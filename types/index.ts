// Types pour les utilisateurs
export type UserRole = 'educator' | 'family';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Types pour les profils éducateurs
export type CertificationType = 'ABA' | 'TEACCH' | 'PECS' | 'DEES' | 'DEME' | 'OTHER';

export interface Certification {
  id: string;
  type: CertificationType;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  document_url?: string;
}

export interface EducatorProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  profile_image_url?: string;
  avatar_url?: string;
  avatar_moderation_status?: 'pending' | 'approved' | 'rejected';
  phone?: string;
  location: string;
  years_of_experience: number;
  hourly_rate?: number;
  certifications: Certification[];
  specializations: string[];
  languages: string[];
  availability: AvailabilitySlot[];
  rating: number;
  total_reviews: number;
  verification_badge?: boolean;
  profession_type?: string;
  gender?: 'male' | 'female' | null;
  // Stripe Connect
  stripe_account_id?: string;
  stripe_onboarding_complete?: boolean;
  stripe_payouts_enabled?: boolean;
  stripe_charges_enabled?: boolean;
  stripe_onboarding_started_at?: string;
  stripe_onboarding_completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les profils familles/TSA
export type SupportLevel = 'level_1' | 'level_2' | 'level_3';

export interface FamilyProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location: string;
  profile_image_url?: string;
  relationship: 'parent' | 'guardian' | 'self' | 'other';
  person_with_autism_age?: number;
  support_level_needed: SupportLevel;
  specific_needs: string[];
  preferred_certifications: CertificationType[];
  budget_range?: {
    min: number;
    max: number;
  };
  created_at: string;
  updated_at: string;
}

// Types pour la disponibilité
export interface AvailabilitySlot {
  id: string;
  educator_id: string;
  day_of_week: number; // 0-6 (Dimanche-Samedi)
  start_time: string; // Format HH:mm
  end_time: string;
  is_available: boolean;
}

// Types pour les réservations
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  educator_id: string;
  family_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les messages
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  educator_id: string;
  family_id: string;
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

// Types pour les évaluations
export interface Review {
  id: string;
  educator_id: string;
  family_id: string;
  booking_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
  updated_at: string;
}

// Types pour les filtres de recherche
export interface SearchFilters {
  location?: string;
  certifications?: CertificationType[];
  minExperience?: number;
  maxHourlyRate?: number;
  minRating?: number;
  languages?: string[];
  availability?: {
    day: number;
    time: string;
  };
}
