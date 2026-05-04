import { supabase } from '../supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NoShowRisk {
  appointmentId: string;
  score: number;       // 0–100
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

// ─── Scoring weights ──────────────────────────────────────────────────────────

const W = {
  pastNoShowRate: 40,
  bookingSource:  15,
  leadTimeDays:   15,
  appointmentType: 15,
  noWhatsApp:     15,
};

const APPOINTMENT_TYPE_RISK: Record<string, number> = {
  urgence:     0,
  consultation: 40,
  suivi:       60,
  controle:    70,
  bilan:       60,
};

function levelFor(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ─── Client-side scoring (no DB needed) ──────────────────────────────────────

export function scoreNoShow(opts: {
  appointmentId: string;
  patientNoShowRate: number;   // 0–1 fraction
  source: 'manual' | 'public_booking' | 'phone';
  leadTimeDays: number;        // days between booking and appointment
  appointmentType: string;
  whatsappConfirmed: boolean;
}): NoShowRisk {
  const { appointmentId, patientNoShowRate, source, leadTimeDays, appointmentType, whatsappConfirmed } = opts;
  const factors: string[] = [];

  // Past no-show rate (0–40)
  const pastScore = Math.round(patientNoShowRate * W.pastNoShowRate);
  if (patientNoShowRate > 0.3) factors.push(`Historique d'absences (${Math.round(patientNoShowRate * 100)}%)`);

  // Booking source (0–15)
  const sourceScore = source === 'public_booking' ? W.bookingSource : 0;
  if (source === 'public_booking') factors.push('Réservation en ligne (anonyme)');

  // Lead time (0–15)
  let leadScore = 0;
  if (leadTimeDays === 0) { leadScore = 0; }
  else if (leadTimeDays <= 2) { leadScore = 5; }
  else if (leadTimeDays <= 7) { leadScore = 10; }
  else { leadScore = W.leadTimeDays; factors.push(`RDV pris ${leadTimeDays}j à l'avance`); }

  // Appointment type (0–15)
  const typeRaw = APPOINTMENT_TYPE_RISK[appointmentType.toLowerCase()] ?? 40;
  const typeScore = Math.round((typeRaw / 100) * W.appointmentType);
  if (typeScore >= 9) factors.push(`Type de consultation : ${appointmentType}`);

  // WhatsApp confirmation (0–15)
  const waScore = whatsappConfirmed ? 0 : W.noWhatsApp;
  if (!whatsappConfirmed) factors.push('Pas de confirmation WhatsApp');

  const score = Math.min(100, pastScore + sourceScore + leadScore + typeScore + waScore);

  return { appointmentId, score, level: levelFor(score), factors };
}

// ─── Batch fetch from Supabase (super_admin use) ─────────────────────────────

export interface AppointmentRiskRow {
  id: string;
  patient_id: string;
  source: string;
  start_time: string;
  created_at: string;
  type: string;
  whatsapp_confirmed_at: string | null;
  no_show_score: number | null;
}

export async function getHighRiskAppointments(tenantId: string, date: Date): Promise<NoShowRisk[]> {
  if (!supabase) return [];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from('appointments')
    .select('id, patient_id, source, start_time, created_at, type, whatsapp_confirmed_at, no_show_score')
    .eq('tenant_id', tenantId)
    .gte('start_time', dayStart.toISOString())
    .lte('start_time', dayEnd.toISOString())
    .not('status', 'in', '("cancelled","absent","completed")');

  if (!data) return [];

  return (data as AppointmentRiskRow[])
    .map(row => {
      if (row.no_show_score !== null) {
        return { appointmentId: row.id, score: row.no_show_score, level: levelFor(row.no_show_score), factors: [] };
      }
      const leadTimeDays = Math.floor((new Date(row.start_time).getTime() - new Date(row.created_at).getTime()) / 86400000);
      return scoreNoShow({
        appointmentId: row.id,
        patientNoShowRate: 0,
        source: (row.source ?? 'manual') as 'manual' | 'public_booking' | 'phone',
        leadTimeDays: Math.max(0, leadTimeDays),
        appointmentType: row.type ?? 'consultation',
        whatsappConfirmed: !!row.whatsapp_confirmed_at,
      });
    })
    .filter(r => r.level === 'high');
}
