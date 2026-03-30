'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EducatorNavbar from '@/components/EducatorNavbar';
import WeekView from '@/components/scheduling/WeekView';
import MonthView from '@/components/scheduling/MonthView';
import ViewToggle from '@/components/scheduling/ViewToggle';
import LocationManager from '@/components/scheduling/LocationManager';
import VacationManager from '@/components/scheduling/VacationManager';
import SlotCreationModal from '@/components/scheduling/SlotCreationModal';
import WeeklyTemplateForm from '@/components/scheduling/WeeklyTemplateForm';
import { useSchedulingData } from '@/components/scheduling/useSchedulingData';
import { startOfWeek, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import type { CalendarView, AvailabilitySlot } from '@/types/scheduling';

export default function EducatorAvailability() {
  const router = useRouter();

  // View state
  const [view, setView] = useState<CalendarView>('month');
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPrefillDate, setModalPrefillDate] = useState<string>();
  const [modalPrefillStart, setModalPrefillStart] = useState<string>();
  const [modalPrefillEnd, setModalPrefillEnd] = useState<string>();
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);

  // Data hook
  const {
    profile,
    subscription,
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
  } = useSchedulingData();

  // ── Navigation handlers ──
  const handleWeekNavigate = useCallback((direction: -1 | 1) => {
    setCurrentWeekStart((prev) =>
      direction === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  }, []);

  const handleMonthNavigate = useCallback((direction: -1 | 1) => {
    setCurrentMonth((prev) =>
      direction === 1 ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  }, []);

  const handleTodayClick = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  // ── Modal handlers ──
  const handleEmptyCellClick = useCallback((date: string, hour: number) => {
    setEditingSlot(null);
    setModalPrefillDate(date);
    setModalPrefillStart(`${String(hour).padStart(2, '0')}:00`);
    setModalPrefillEnd(`${String(hour + 1).padStart(2, '0')}:00`);
    setModalOpen(true);
  }, []);

  const handleSlotClick = useCallback((slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setModalPrefillDate(undefined);
    setModalPrefillStart(undefined);
    setModalPrefillEnd(undefined);
    setModalOpen(true);
  }, []);

  const handleModalSave = useCallback(async (formData: any) => {
    if (editingSlot) {
      const updateData: any = {
        availability_date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        work_location_id: null,
        ad_hoc_location_name: null,
        ad_hoc_location_address: null,
      };
      if (formData.locationRef?.type === 'saved') {
        updateData.work_location_id = formData.locationRef.locationId;
      } else if (formData.locationRef?.type === 'adhoc') {
        updateData.ad_hoc_location_name = formData.locationRef.name;
        updateData.ad_hoc_location_address = formData.locationRef.address;
      }
      await updateSlot(editingSlot.id, updateData);
    } else {
      await addSlot(formData);
    }
  }, [editingSlot, updateSlot, addSlot]);

  const handleAddSlotButton = useCallback(() => {
    setEditingSlot(null);
    setModalPrefillDate(undefined);
    setModalPrefillStart('09:00');
    setModalPrefillEnd('17:00');
    setModalOpen(true);
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f4' }}>
        <div
          className="animate-spin h-12 w-12 border-4 border-t-transparent rounded-full"
          style={{ borderColor: '#41005c', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40">
        <EducatorNavbar profile={profile} subscription={subscription} />
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-5 md:py-8 pb-24 sm:pb-8 w-full">
        {/* Header - style cohérent avec les autres pages du dashboard */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Retour</span>
          </button>

          <div className="text-center mb-6">
            {/* Icon - horloge avec coche, style Disponibilites du dashboard */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#ede9fe' }}>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.5l1.5 1.5 3-3" strokeWidth={2} stroke="#6d28d9" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#1a1a2e' }}>Mes disponibilites</h1>
            <p className="text-sm text-gray-500 mt-1">Gerez vos creneaux, lieux de travail et vacances</p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleAddSlotButton}
              className="px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#027e7e' }}
            >
              + Ajouter un creneau
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right text-current opacity-50 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Management sections (collapsible) */}
        <LocationManager
          locations={locations}
          saving={saving}
          onAdd={addLocation}
          onUpdate={updateLocation}
          onDelete={deleteLocation}
        />

        <VacationManager
          exceptions={exceptions}
          saving={saving}
          onAddVacation={addVacation}
          onDeleteVacation={deleteVacation}
        />

        <WeeklyTemplateForm
          locations={locations}
          saving={saving}
          onApply={applyWeeklySchedule}
        />

        {/* View toggle + Calendar */}
        <div className="flex items-center justify-between mb-4">
          <ViewToggle currentView={view} onViewChange={setView} />
          <div className="text-sm text-gray-500">
            {slots.length} creneau{slots.length !== 1 ? 'x' : ''} &middot; {appointments.length} RDV
          </div>
        </div>

        {view === 'week' ? (
          <WeekView
            currentWeekStart={currentWeekStart}
            slots={slots}
            appointments={appointments}
            exceptions={exceptions}
            onNavigate={handleWeekNavigate}
            onSlotClick={handleSlotClick}
            onEmptyCellClick={handleEmptyCellClick}
            onTodayClick={handleTodayClick}
          />
        ) : (
          <MonthView
            currentMonth={currentMonth}
            slots={slots}
            appointments={appointments}
            exceptions={exceptions}
            onNavigate={handleMonthNavigate}
            onDateClick={setSelectedMonthDate}
            selectedDate={selectedMonthDate}
            onSlotClick={handleSlotClick}
            onDeleteSlot={deleteSlot}
            onAddSlot={addSlot}
            onUpdateSlot={updateSlot}
            saving={saving}
          />
        )}

        {/* Slot creation/edit modal */}
        <SlotCreationModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingSlot(null); }}
          onSave={handleModalSave}
          onDelete={deleteSlot}
          locations={locations}
          prefillDate={modalPrefillDate}
          prefillStartTime={modalPrefillStart}
          prefillEndTime={modalPrefillEnd}
          editingSlot={editingSlot}
          saving={saving}
        />
      </div>
    </div>
  );
}
