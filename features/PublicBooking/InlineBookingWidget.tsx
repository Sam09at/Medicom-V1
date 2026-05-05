import React, { useCallback, useEffect, useState } from 'react';
import type { LandingPage, PageSection } from '../../types';
import type { TimeSlot } from '../../lib/api/publicBooking';
import { getAvailableSlots, createPublicBooking } from '../../lib/api/publicBooking';
import { StepSelectSlot } from './StepSelectSlot';
import { StepPatientInfo } from './StepPatientInfo';
import { StepSuccess } from './StepSuccess';
import type { HoursContent } from '../LandingPageBuilder/sectionConfig';

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

const STEPS = ['Créneau', 'Vos infos', 'Confirmé'];

function StepBar({ step, accent }: { step: number; accent: string }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: done || active ? accent : '#e2e8f0',
                  color: done || active ? '#fff' : '#94a3b8',
                }}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className="text-sm font-semibold hidden sm:inline" style={{ color: active ? accent : done ? '#64748b' : '#cbd5e1' }}>
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

interface Props {
  page: LandingPage;
  heading?: string;
  body?: string;
}

export const InlineBookingWidget: React.FC<Props> = ({ page, heading, body }) => {
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

  const loadSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const result = await getAvailableSlots(page.tenantId, date, scheduleRows);
    setSlots(result);
    setLoadingSlots(false);
  }, [page.tenantId, scheduleRows]);

  useEffect(() => { loadSlots(selectedDate); }, [selectedDate, loadSlots]);

  const handleDateChange = (d: Date) => {
    setSelectedDate(d);
    loadSlots(d);
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
      setSubmitError('Une erreur est survenue. Veuillez réessayer ou appeler le cabinet directement.');
    }
  };

  const handleReset = () => {
    setStep(0);
    setSelectedSlot(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setReason('');
    setSubmitError(null);
    setSelectedDate(todayDate());
  };

  return (
    <section className="py-20 px-6 bg-slate-50/60">
      <div className="max-w-2xl mx-auto">
        {heading && (
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{heading}</h2>
            {body && <p className="text-slate-500 text-base leading-relaxed">{body}</p>}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <StepBar step={step} accent={accent} />

          {step === 0 && (
            <>
              <StepSelectSlot
                slots={slots}
                loadingSlots={loadingSlots}
                selectedSlot={selectedSlot}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                onSlotSelect={setSelectedSlot}
                accentColor={accent}
                scheduleRows={scheduleRows}
              />
              <button
                onClick={() => { if (selectedSlot) setStep(1); }}
                disabled={!selectedSlot}
                className="mt-6 w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                Continuer →
              </button>
            </>
          )}

          {step === 1 && selectedSlot && (
            <>
              <button
                onClick={() => setStep(0)}
                className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Choisir un autre créneau
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
            <>
              <StepSuccess
                slot={selectedSlot}
                firstName={firstName}
                clinicName={clinicName}
                clinicPhone={page.contactPhone}
                accentColor={accent}
                onClose={handleReset}
              />
              <button
                onClick={handleReset}
                className="mt-6 w-full py-3 rounded-2xl font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Prendre un autre rendez-vous
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
