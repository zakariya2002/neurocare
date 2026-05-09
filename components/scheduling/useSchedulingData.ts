'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import type {
  WorkLocation,
  AvailabilitySlot,
  VacationException,
  Appointment,
  LocationRef,
  SlotFormData,
} from '@/types/scheduling';

interface SchedulingMessage {
  type: 'success' | 'error';
  text: string;
}

interface WeeklyDaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

export function useSchedulingData() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [exceptions, setExceptions] = useState<VacationException[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationReady, setMigrationReady] = useState(true); // tracks if DB has new columns
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<SchedulingMessage | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setMessage(null), 3000);
    }
  }, []);

  // ── Fetch all data ──
  const fetchData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('educator_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);
    const today = format(new Date(), 'yyyy-MM-dd');

    // Try fetching with location join first, fallback to without if migration not run yet
    let slotsQuery = supabase
      .from('educator_availability')
      .select('*, work_location:educator_work_locations(*)')
      .eq('educator_id', profileData.id)
      .gte('availability_date', today)
      .order('availability_date', { ascending: true })
      .order('start_time', { ascending: true });

    const [slotsResult, locResult, excResult, apptResult] = await Promise.all([
      slotsQuery,
      supabase
        .from('educator_work_locations')
        .select('*')
        .eq('educator_id', profileData.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true }),
      supabase
        .from('educator_availability_exceptions')
        .select('*')
        .eq('educator_id', profileData.id)
        .gte('date', today)
        .order('date', { ascending: true }),
      supabase
        .from('appointments')
        .select('id, educator_id, family_id, appointment_date, start_time, end_time, status, location_type, address, family:family_profiles!family_id(first_name, last_name)')
        .eq('educator_id', profileData.id)
        .gte('appointment_date', today)
        .in('status', ['accepted', 'in_progress', 'pending'])
        .order('appointment_date', { ascending: true }),
    ]);

    // If slots query failed (migration not run), retry without join
    let finalSlotsResult = slotsResult;
    let dbMigrated = true;
    if (slotsResult.error) {
      dbMigrated = false;
      finalSlotsResult = await supabase
        .from('educator_availability')
        .select('*')
        .eq('educator_id', profileData.id)
        .gte('availability_date', today)
        .order('availability_date', { ascending: true })
        .order('start_time', { ascending: true });
    }
    setMigrationReady(dbMigrated);

    if (finalSlotsResult.data) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const filtered = finalSlotsResult.data.filter((slot: any) => {
        if (slot.availability_date === today) {
          return slot.end_time > currentTime;
        }
        return true;
      });
      setSlots(filtered);
    }

    if (locResult.data) setLocations(locResult.data);
    if (excResult.data) setExceptions(excResult.data);
    if (apptResult.data) setAppointments(apptResult.data as any);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Slot CRUD ──
  const addSlot = useCallback(async (formData: SlotFormData) => {
    if (!profile) return;
    setSaving(true);

    // Base insert data (works with or without migration)
    const insertData: any = {
      educator_id: profile.id,
      availability_date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      is_available: !formData.isBlocked,
    };

    if (formData.isBlocked && formData.internalNote) {
      insertData.internal_note = formData.internalNote;
    }

    // Only add location columns if migration has been run
    if (migrationReady && !formData.isBlocked) {
      insertData.work_location_id = null;
      insertData.ad_hoc_location_name = null;
      insertData.ad_hoc_location_address = null;

      if (formData.locationRef?.type === 'saved') {
        insertData.work_location_id = formData.locationRef.locationId;
      } else if (formData.locationRef?.type === 'adhoc') {
        insertData.ad_hoc_location_name = formData.locationRef.name;
        insertData.ad_hoc_location_address = formData.locationRef.address;
      }
    }

    const selectQuery = migrationReady
      ? '*, work_location:educator_work_locations(*)'
      : '*';

    const { data, error } = await supabase
      .from('educator_availability')
      .insert(insertData)
      .select(selectQuery)
      .single() as { data: any; error: any };

    setSaving(false);

    if (error) {
      showMessage('error', 'Erreur lors de l\'ajout du creneau');
      return;
    }

    setSlots(prev => [...prev, data as AvailabilitySlot].sort((a, b) => {
      if (a.availability_date !== b.availability_date) return a.availability_date.localeCompare(b.availability_date);
      return a.start_time.localeCompare(b.start_time);
    }));
    showMessage('success', 'Creneau ajoute');

    // Notifier les familles en liste d'attente correspondant à ce créneau (fire-and-forget)
    fetch('/api/waitlist/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        educator_id: profile.id,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
      }),
    }).catch(() => { /* silencieux : ne pas bloquer la création de slot */ });
  }, [profile, migrationReady, showMessage]);

  const updateSlot = useCallback(async (id: string, fields: Partial<AvailabilitySlot>) => {
    setSaving(true);
    const selectQuery = migrationReady ? '*, work_location:educator_work_locations(*)' : '*';
    const { data, error } = await supabase
      .from('educator_availability')
      .update(fields)
      .eq('id', id)
      .select(selectQuery)
      .single() as { data: any; error: any };

    setSaving(false);

    if (error) {
      showMessage('error', 'Erreur lors de la modification');
      return;
    }

    setSlots(prev => prev.map(s => s.id === id ? (data as AvailabilitySlot) : s));
    showMessage('success', 'Creneau modifie');
  }, [migrationReady, showMessage]);

  const deleteSlot = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('educator_availability')
      .delete()
      .eq('id', id);

    if (error) {
      showMessage('error', 'Erreur lors de la suppression');
      return;
    }

    setSlots(prev => prev.filter(s => s.id !== id));
    showMessage('success', 'Creneau supprime');
  }, [showMessage]);

  const toggleSlotAvailability = useCallback(async (id: string, current: boolean) => {
    await updateSlot(id, { is_available: !current });
  }, [updateSlot]);

  // ── Location CRUD ──
  const addLocation = useCallback(async (data: Omit<WorkLocation, 'id' | 'educator_id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!profile) return;
    setSaving(true);

    const { data: newLoc, error } = await supabase
      .from('educator_work_locations')
      .insert({ ...data, educator_id: profile.id, is_active: true })
      .select()
      .single();

    setSaving(false);

    if (error) {
      showMessage('error', 'Erreur lors de l\'ajout du lieu');
      return;
    }

    setLocations(prev => [...prev, newLoc]);
    showMessage('success', 'Lieu ajoute');
  }, [profile, showMessage]);

  const updateLocation = useCallback(async (id: string, fields: Partial<WorkLocation>) => {
    setSaving(true);
    const { data, error } = await supabase
      .from('educator_work_locations')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      showMessage('error', 'Erreur lors de la modification du lieu');
      return;
    }

    setLocations(prev => prev.map(l => l.id === id ? data : l));
    showMessage('success', 'Lieu modifie');
  }, [showMessage]);

  const deleteLocation = useCallback(async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('educator_work_locations')
      .update({ is_active: false })
      .eq('id', id);

    setSaving(false);

    if (error) {
      showMessage('error', 'Erreur lors de la suppression du lieu');
      return;
    }

    setLocations(prev => prev.filter(l => l.id !== id));
    showMessage('success', 'Lieu supprime');
  }, [showMessage]);

  // ── Vacation management ──
  const addVacation = useCallback(async (startDate: string, endDate: string, reason: string) => {
    if (!profile) return;
    setSaving(true);

    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });

    const rows = days.map(day => ({
      educator_id: profile.id,
      date: format(day, 'yyyy-MM-dd'),
      exception_type: 'vacation' as const,
      reason: reason || 'Vacances',
      start_time: null,
      end_time: null,
    }));

    const { data, error } = await supabase
      .from('educator_availability_exceptions')
      .insert(rows)
      .select();

    setSaving(false);

    if (error) {
      showMessage('error', 'Erreur lors de l\'ajout des vacances');
      return;
    }

    if (data) {
      setExceptions(prev => [...prev, ...data].sort((a, b) => a.date.localeCompare(b.date)));
    }
    showMessage('success', `Vacances ajoutees du ${startDate} au ${endDate}`);
  }, [profile, showMessage]);

  const deleteVacation = useCallback(async (ids: string[]) => {
    const { error } = await supabase
      .from('educator_availability_exceptions')
      .delete()
      .in('id', ids);

    if (error) {
      showMessage('error', 'Erreur lors de la suppression');
      return;
    }

    setExceptions(prev => prev.filter(e => !ids.includes(e.id)));
    showMessage('success', 'Vacances supprimees');
  }, [showMessage]);

  // ── Weekly schedule ──
  const applyWeeklySchedule = useCallback(async (
    schedule: Record<number, WeeklyDaySchedule>,
    monthStr: string,
    locationRef: LocationRef
  ) => {
    if (!profile) return;
    setSaving(true);

    const [yearStr, monthNumStr] = monthStr.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthNumStr) - 1;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = format(new Date(), 'yyyy-MM-dd');

    const newSlots: any[] = [];
    const existingDates = new Set(slots.map(s => `${s.availability_date}_${s.start_time}_${s.end_time}`));

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const daySchedule = schedule[dayOfWeek];
      const dateStr = format(d, 'yyyy-MM-dd');

      if (!daySchedule?.enabled) continue;
      if (dateStr < today) continue;

      const key = `${dateStr}_${daySchedule.start}_${daySchedule.end}`;
      if (existingDates.has(key)) continue;

      const slotData: any = {
        educator_id: profile.id,
        availability_date: dateStr,
        start_time: daySchedule.start,
        end_time: daySchedule.end,
        is_available: true,
      };

      if (migrationReady) {
        slotData.work_location_id = null;
        slotData.ad_hoc_location_name = null;
        slotData.ad_hoc_location_address = null;

        if (locationRef?.type === 'saved') {
          slotData.work_location_id = locationRef.locationId;
        } else if (locationRef?.type === 'adhoc') {
          slotData.ad_hoc_location_name = locationRef.name;
          slotData.ad_hoc_location_address = locationRef.address;
        }
      }

      newSlots.push(slotData);
    }

    if (newSlots.length === 0) {
      setSaving(false);
      showMessage('error', 'Aucun nouveau creneau a ajouter (tous existent deja ou sont dans le passe)');
      return;
    }

    const selectQuery = migrationReady ? '*, work_location:educator_work_locations(*)' : '*';
    const { data, error } = await supabase
      .from('educator_availability')
      .insert(newSlots)
      .select(selectQuery) as { data: any[] | null; error: any };

    setSaving(false);

    if (error) {
      showMessage('error', 'Erreur lors de l\'application du planning');
      return;
    }

    if (data) {
      setSlots(prev => [...prev, ...(data as AvailabilitySlot[])].sort((a, b) => {
        if (a.availability_date !== b.availability_date) return a.availability_date.localeCompare(b.availability_date);
        return a.start_time.localeCompare(b.start_time);
      }));
    }
    showMessage('success', `${newSlots.length} creneaux ajoutes`);
  }, [profile, migrationReady, slots, showMessage]);

  return {
    profile,
    slots,
    locations,
    exceptions,
    appointments,
    loading,
    saving,
    message,
    setMessage,
    addSlot,
    updateSlot,
    deleteSlot,
    toggleSlotAvailability,
    addLocation,
    updateLocation,
    deleteLocation,
    addVacation,
    deleteVacation,
    applyWeeklySchedule,
    refreshData: fetchData,
  };
}
