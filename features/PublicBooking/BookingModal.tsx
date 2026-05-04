import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LandingPage, PageSection } from '../../types';
import type { TimeSlot } from '../../lib/api/publicBooking';
import { getAvailableSlots, createPublicBooking } from '../../lib/api/publicBooking';
import { StepSelectSlot } from './StepSelectSlot';
import { StepPatientInfo } from './StepPatientInfo';
import { StepSuccess } from './StepSuccess';
import type { HoursContent } from '../LandingPageBuilder/sectionConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractScheduleRows(sections: PageSection[]) {
  const hoursSection = sections.find(s => s.type === 'hours' && s.visible);
  if (!hoursSection) return undefined;
  return (hoursSection.content as unknown as HoursContent).schedule;
}

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Créneau', 'Vos infos', 'Confirmé'];

function StepBar({ step, accent }: { step: number; accent: string }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                style={{
                  backgroundColor: done || active ? accent : '#e2e8f0',
                  color: done || active ? '#fff' : '#94a3b8',
                }}
              >
                {done ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className="text-xs font-semibold hidden sm:inline" style={{ color: active ? accent : done ? '#64748b' : '#cbd5e1' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px transition-colors" style={{ backgroundColor: i < step ? accent : '#e2e8f0' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  page: LandingPage;
  onClose: () => void;
}

export const BookingModal: React.FC<Props> = ({ page, onClose }) => {
  const accent = page.accentColor || '#136cfb';
  const clinicName = page.headline ?? page.slug;
  const scheduleRows = extractScheduleRows(page.sectionsJson ?? []);

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Load slots when date changes
  const loadSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const result = await getAvailableSlots(page.tenantId, date, scheduleRows);
    setSlots(result);
    setLoadingSlots(false);
  }, [page.tenantId, scheduleRows]);

  useEffect(() => { loadSlots(selectedDate); }, [selectedDate, loadSlots]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDateChange = (d: Date) => {
    setSelectedDate(d);
    loadSlots(d);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const goToStep2 = () => {
    if (selectedSlot) setStep(1);
  };

  const handleSubmit = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await createPublicBooking({
      tenantId: page.tenantId,
      slug: page.slug,
      slotStart: selectedSlot.start,
      slotEnd: selectedSlot.end,
      firstName,
      lastName,
      phone,
      reason,
    });
    setSubmitting(false);
    if (result.success) {
      setStep(2);
    } else {
      setSubmitError("Une erreur est survenue. Veuillez réessayer ou appeler le cabinet directement.");
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Modal panel */}
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[86vh]"
        style={{ animation: 'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Prendre rendez-vous</h2>
            <p className="text-xs text-slate-500 font-medium">{clinicName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step bar */}
        {step < 2 && (
          <div className="px-6 shrink-0">
            <StepBar step={step} accent={accent} />
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {step === 0 && (
            <>
              <StepSelectSlot
                slots={slots}
                loadingSlots={loadingSlots}
                selectedSlot={selectedSlot}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                onSlotSelect={handleSlotSelect}
                accentColor={accent}
                scheduleRows={scheduleRows}
              />
              {/* Next CTA */}
              <div className="mt-6">
                <button
                  disabled={!selectedSlot}
                  onClick={goToStep2}
                  className="w-full py-3.5 rounded-2xl text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ backgroundColor: accent }}
                >
                  {selectedSlot
                    ? `Continuer — ${selectedSlot.label}`
                    : 'Choisissez un créneau'}
                </button>
              </div>
            </>
          )}

          {step === 1 && selectedSlot && (
            <>
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Modifier le créneau
              </button>
              <StepPatientInfo
                slot={selectedSlot}
                clinicName={clinicName}
                accentColor={accent}
                firstName={firstName}
                lastName={lastName}
                phone={phone}
                reason={reason}
                onFirstName={setFirstName}
                onLastName={setLastName}
                onPhone={setPhone}
                onReason={setReason}
                onSubmit={handleSubmit}
                loading={submitting}
                error={submitError}
              />
            </>
          )}

          {step === 2 && selectedSlot && (
            <StepSuccess
              slot={selectedSlot}
              firstName={firstName}
              clinicName={clinicName}
              clinicPhone={page.contactPhone}
              accentColor={accent}
              onClose={onClose}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};
