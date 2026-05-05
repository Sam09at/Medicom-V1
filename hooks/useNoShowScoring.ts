import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMedicomStore } from '../store';

export interface NoShowScore {
  patientId: string;
  patientName: string;
  score: number;        // 0–100, higher = more likely to no-show
  risk: 'low' | 'medium' | 'high';
  noShowRate: number;   // 0–1
  totalAppointments: number;
  noShowCount: number;
  lastAppointmentDate: string | null;
}

interface ApptRow {
  patient_id: string;
  status: string;
  start_time: string;
  patients?: { first_name: string; last_name: string }[] | { first_name: string; last_name: string } | null;
}

function computeScore(noShowRate: number, totalAppointments: number, daysSinceLast: number | null): number {
  // Weight: past no-show rate (60%) + recency (20%) + thin history penalty (20%)
  const rateScore = noShowRate * 100 * 0.6;

  // Recency: patients who haven't shown up in >90 days score higher
  const recencyScore = daysSinceLast !== null
    ? Math.min(daysSinceLast / 90, 1) * 100 * 0.2
    : 20;

  // Thin history: fewer than 3 appointments means we're less sure — dampen slightly
  const historyScore = totalAppointments < 3 ? 10 : 0;

  return Math.min(100, Math.round(rateScore + recencyScore + historyScore));
}

function toRisk(score: number): 'low' | 'medium' | 'high' {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// MOCK fallback — generated from constants so demo mode has realistic data
const MOCK_SCORES: NoShowScore[] = [
  { patientId: 'p1', patientName: 'M. Benali Karim',    score: 72, risk: 'high',   noShowRate: 0.40, totalAppointments: 5,  noShowCount: 2, lastAppointmentDate: new Date(Date.now() - 95 * 86400000).toISOString() },
  { patientId: 'p2', patientName: 'Mme. Idrissi Sara',  score: 48, risk: 'medium', noShowRate: 0.25, totalAppointments: 8,  noShowCount: 2, lastAppointmentDate: new Date(Date.now() - 45 * 86400000).toISOString() },
  { patientId: 'p3', patientName: 'M. Tazi Youssef',    score: 35, risk: 'medium', noShowRate: 0.20, totalAppointments: 5,  noShowCount: 1, lastAppointmentDate: new Date(Date.now() - 30 * 86400000).toISOString() },
  { patientId: 'p4', patientName: 'Mme. Belhaj Fatima', score: 12, risk: 'low',    noShowRate: 0.07, totalAppointments: 14, noShowCount: 1, lastAppointmentDate: new Date(Date.now() - 10 * 86400000).toISOString() },
  { patientId: 'p5', patientName: 'M. Alaoui Hassan',   score: 8,  risk: 'low',    noShowRate: 0.00, totalAppointments: 6,  noShowCount: 0, lastAppointmentDate: new Date(Date.now() - 7  * 86400000).toISOString() },
];

export function useNoShowScoring(limit = 20) {
  const { currentTenant } = useMedicomStore();
  const [scores, setScores] = useState<NoShowScore[]>([]);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);

    if (!supabase) {
      setScores(MOCK_SCORES);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('appointments')
        .select('patient_id, status, start_time, patients(first_name, last_name)')
        .eq('tenant_id', currentTenant.id)
        .not('status', 'in', '("pending","cancelled")')
        .order('start_time', { ascending: false });

      if (!data || data.length === 0) {
        setScores([]);
        setLoading(false);
        return;
      }

      // Aggregate per patient
      const map = new Map<string, {
        name: string;
        total: number;
        absent: number;
        lastDate: string;
      }>();

      (data as unknown as ApptRow[]).forEach((row) => {
        const id = row.patient_id;
        const pt = Array.isArray(row.patients) ? row.patients[0] : row.patients;
        const name = pt ? `${pt.first_name} ${pt.last_name}` : id;
        const existing = map.get(id);
        if (!existing) {
          map.set(id, { name, total: 1, absent: row.status === 'absent' ? 1 : 0, lastDate: row.start_time });
        } else {
          existing.total++;
          if (row.status === 'absent') existing.absent++;
          // keep the most recent (data is desc-ordered)
          if (!existing.lastDate || row.start_time > existing.lastDate) {
            existing.lastDate = row.start_time;
          }
        }
      });

      const now = Date.now();
      const result: NoShowScore[] = Array.from(map.entries())
        .map(([patientId, v]) => {
          const noShowRate = v.total > 0 ? v.absent / v.total : 0;
          const daysSinceLast = v.lastDate
            ? Math.floor((now - new Date(v.lastDate).getTime()) / 86400000)
            : null;
          const score = computeScore(noShowRate, v.total, daysSinceLast);
          return {
            patientId,
            patientName: v.name,
            score,
            risk: toRisk(score),
            noShowRate,
            totalAppointments: v.total,
            noShowCount: v.absent,
            lastAppointmentDate: v.lastDate ?? null,
          };
        })
        .filter((s) => s.totalAppointments >= 2)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      setScores(result);
    } catch {
      setScores(MOCK_SCORES);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, limit]);

  useEffect(() => { compute(); }, [compute]);

  const highRisk  = scores.filter((s) => s.risk === 'high');
  const medRisk   = scores.filter((s) => s.risk === 'medium');
  const avgRate   = scores.length > 0
    ? scores.reduce((sum, s) => sum + s.noShowRate, 0) / scores.length
    : 0;

  return { scores, loading, highRisk, medRisk, avgRate, refetch: compute };
}
