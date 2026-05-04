export type LocationType = 'office' | 'home' | 'institution' | 'online' | 'other';

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  office: 'Cabinet',
  home: 'Domicile patient',
  institution: 'Institution',
  online: 'En ligne',
  other: 'Autre',
};

export const LOCATION_COLORS = [
  '#027e7e', // teal
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ef4444', // red
  '#10b981', // emerald
  '#8b5cf6', // violet
] as const;

export interface WorkLocation {
  id: string;
  educator_id: string;
  name: string;
  location_type: LocationType;
  address: string | null;
  color: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  educator_id: string;
  availability_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  work_location_id: string | null;
  ad_hoc_location_name: string | null;
  ad_hoc_location_address: string | null;
  /** Note privée pour les créneaux bloqués manuellement (RDV externe). Visible uniquement par le pro. */
  internal_note?: string | null;
  work_location?: WorkLocation | null;
}

export interface VacationException {
  id: string;
  educator_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  exception_type: 'blocked' | 'available' | 'vacation';
  reason: string | null;
}

export interface VacationPeriod {
  startDate: string;
  endDate: string;
  reason: string;
  exceptionIds: string[];
}

export interface Appointment {
  id: string;
  educator_id: string;
  family_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  location_type: string | null;
  address: string | null;
  family?: { first_name: string; last_name: string } | null;
}

export type CalendarView = 'week' | 'month';

export type LocationRef =
  | { type: 'saved'; locationId: string }
  | { type: 'adhoc'; name: string; address: string }
  | null;

export interface SlotFormData {
  date: string;
  startTime: string;
  endTime: string;
  locationRef: LocationRef;
  /** Si true, le créneau est bloqué (RDV externe), pas réservable par les familles. */
  isBlocked?: boolean;
  /** Note pour le créneau bloqué (ex: "RDV avec Julien"). Privée. */
  internalNote?: string;
}
