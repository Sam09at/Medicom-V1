import { supabase } from '../supabase';

export type EmailType =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancellation'
  | 'appointment_reschedule'
  | 'welcome'
  | 'password_reset';

export interface EmailParams {
  to: string;
  type: EmailType;
  params: Record<string, string>;
  tenantId?: string;
}

/**
 * Triggers an email via the send-email Supabase Edge Function.
 * Falls back silently when Supabase is unavailable (demo mode).
 */
export async function sendEmail(opts: EmailParams): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: opts.to,
      type: opts.type,
      params: opts.params,
      tenant_id: opts.tenantId,
    },
  });

  if (error) {
    console.error('[email] send failed:', error);
  }
}

// ── Convenience wrappers ─────────────────────────────────────────────────────

export function sendAppointmentConfirmation(opts: {
  to: string;
  patientName: string;
  clinicName: string;
  date: string;
  time: string;
  ref: string;
  cancelUrl: string;
  rescheduleUrl: string;
  tenantId: string;
}) {
  return sendEmail({
    to: opts.to,
    type: 'appointment_confirmation',
    tenantId: opts.tenantId,
    params: {
      patient_name:    opts.patientName,
      clinic_name:     opts.clinicName,
      date:            opts.date,
      time:            opts.time,
      ref:             opts.ref,
      cancel_url:      opts.cancelUrl,
      reschedule_url:  opts.rescheduleUrl,
    },
  });
}

export function sendAppointmentReminder(opts: {
  to: string;
  patientName: string;
  clinicName: string;
  date: string;
  time: string;
  cancelUrl: string;
  tenantId: string;
}) {
  return sendEmail({
    to: opts.to,
    type: 'appointment_reminder',
    tenantId: opts.tenantId,
    params: {
      patient_name: opts.patientName,
      clinic_name:  opts.clinicName,
      date:         opts.date,
      time:         opts.time,
      cancel_url:   opts.cancelUrl,
    },
  });
}
