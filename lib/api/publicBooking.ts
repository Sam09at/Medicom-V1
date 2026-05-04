import { supabase } from '../supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string; // "09:00"
}

export interface BookingRequest {
  tenantId: string;
  slug: string;
  slotStart: Date;
  slotEnd: Date;
  firstName: string;
  lastName: string;
  phone: string;
  reason?: string;
}

export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  error?: string;
}

// ─── Slot generation ──────────────────────────────────────────────────────────

const SLOT_DURATION_MIN = 30;

function pad(n: number) { return String(n).padStart(2, '0'); }

function generateSlots(date: Date, openHour: number, openMin: number, closeHour: number, closeMin: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();

  let h = openHour;
  let m = openMin;

  while (h < closeHour || (h === closeHour && m < closeMin)) {
    const start = new Date(date);
    start.setHours(h, m, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + SLOT_DURATION_MIN);

    // Skip past slots
    if (start > now) {
      slots.push({ start, end, label: `${pad(h)}:${pad(m)}` });
    }

    m += SLOT_DURATION_MIN;
    if (m >= 60) { h += 1; m -= 60; }
  }
  return slots;
}

function parseHours(timeRange: string): { open: [number, number]; close: [number, number] } | null {
  // Expects "HH:MM – HH:MM" or "HH:MM - HH:MM"
  const match = timeRange.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return {
    open: [parseInt(match[1]), parseInt(match[2])],
    close: [parseInt(match[3]), parseInt(match[4])],
  };
}

/** Day names in French → JS getDay() (0=Sun, 1=Mon, …) */
const FR_DAY_INDEX: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
};

/**
 * Get available 30-min slots for a given date.
 * Uses Supabase function when connected; falls back to schedule-based generation in mock mode.
 * @param scheduleRows - the HoursContent.schedule array from the landing page sections
 */
export async function getAvailableSlots(
  tenantId: string,
  date: Date,
  scheduleRows?: Array<{ day: string; hours: string; closed: boolean }>
): Promise<TimeSlot[]> {
  const dayOfWeek = date.getDay();

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_tenant_id: tenantId,
        p_date: date.toISOString().slice(0, 10),
      });
      if (!error && data) {
        return (data as any[]).map((row: any) => {
          const start = new Date(row.slot_start);
          const end = new Date(row.slot_end);
          return { start, end, label: `${pad(start.getHours())}:${pad(start.getMinutes())}` };
        });
      }
    } catch { /* fall through to mock */ }
  }

  // Mock mode: derive from scheduleRows or use default 9–18 M-F
  if (scheduleRows && scheduleRows.length > 0) {
    const row = scheduleRows.find(r => {
      const idx = FR_DAY_INDEX[r.day.toLowerCase()];
      return idx === dayOfWeek;
    });
    if (!row || row.closed) return [];
    const parsed = parseHours(row.hours);
    if (!parsed) return [];
    return generateSlots(date, parsed.open[0], parsed.open[1], parsed.close[0], parsed.close[1]);
  }

  // Default: 9–18, closed Sunday
  if (dayOfWeek === 0) return [];
  return generateSlots(date, 9, 0, 18, 0);
}

/** Check if any slots exist for a week starting from `weekStart`. Used for day-disabling. */
export function hasAnySlots(
  date: Date,
  scheduleRows?: Array<{ day: string; hours: string; closed: boolean }>
): boolean {
  const dayOfWeek = date.getDay();
  if (!scheduleRows || scheduleRows.length === 0) {
    return dayOfWeek !== 0;
  }
  const row = scheduleRows.find(r => FR_DAY_INDEX[r.day.toLowerCase()] === dayOfWeek);
  return !!row && !row.closed;
}

// ─── Booking creation ─────────────────────────────────────────────────────────

export async function createPublicBooking(req: BookingRequest): Promise<BookingResult> {
  if (supabase) {
    try {
      // 1. Upsert patient
      const { data: patientData } = await supabase
        .from('patients')
        .upsert(
          {
            tenant_id: req.tenantId,
            first_name: req.firstName,
            last_name: req.lastName,
            phone: req.phone,
            source: 'public_booking',
          },
          { onConflict: 'tenant_id,phone', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      const patientId = patientData?.id;
      if (!patientId) return { success: false, error: 'patient_error' };

      // 2. Create appointment
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: req.tenantId,
          patient_id: patientId,
          start_time: req.slotStart.toISOString(),
          end_time: req.slotEnd.toISOString(),
          status: 'pending',
          source: 'public_booking',
          notes: req.reason ?? null,
        })
        .select('id')
        .single();

      if (apptError || !apptData) return { success: false, error: 'appointment_error' };
      return { success: true, appointmentId: apptData.id };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'unknown_error' };
    }
  }

  // Mock mode: save to localStorage for demo
  const mockId = `mock-appt-${Date.now()}`;
  try {
    const bookings = JSON.parse(localStorage.getItem('medicom_public_bookings') ?? '[]');
    bookings.unshift({
      id: mockId,
      tenantId: req.tenantId,
      slug: req.slug,
      patientName: `${req.firstName} ${req.lastName}`,
      phone: req.phone,
      slotStart: req.slotStart.toISOString(),
      slotEnd: req.slotEnd.toISOString(),
      reason: req.reason,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('medicom_public_bookings', JSON.stringify(bookings));
  } catch { /* ignore */ }

  return { success: true, appointmentId: mockId };
}
