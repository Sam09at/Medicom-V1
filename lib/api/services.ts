import { supabase } from '../supabase';
import type { MedicalService } from '../../types';
import { MOCK_SERVICES } from '../../constants';

interface ServiceRow {
  id: string;
  tenant_id: string;
  name: string;
  category: string | null;
  duration_minutes: number;
  price: number;
  tva_rate: number;
  is_active: boolean;
  created_at: string;
}

function toService(row: ServiceRow): MedicalService {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    category: row.category ?? undefined,
    durationMinutes: row.duration_minutes,
    price: row.price,
    tvaRate: row.tva_rate,
    isActive: row.is_active,
  };
}

export async function getServices(tenantId: string): Promise<MedicalService[]> {
  if (!supabase) return MOCK_SERVICES;

  const { data } = await supabase
    .from('medical_services')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');

  return (data ?? []).map((r) => toService(r as ServiceRow));
}

export async function getAllServices(tenantId: string): Promise<MedicalService[]> {
  if (!supabase) return MOCK_SERVICES;

  const { data } = await supabase
    .from('medical_services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  return (data ?? []).map((r) => toService(r as ServiceRow));
}

export async function upsertService(
  tenantId: string,
  service: Omit<MedicalService, 'tenantId' | 'id'> & { id?: string }
): Promise<MedicalService | null> {
  if (!supabase) return null;

  const row: Partial<ServiceRow> & { tenant_id: string } = {
    tenant_id: tenantId,
    name: service.name,
    category: service.category ?? null,
    duration_minutes: service.durationMinutes,
    price: service.price,
    tva_rate: service.tvaRate ?? 0,
    is_active: service.isActive,
  };
  if (service.id) (row as any).id = service.id;

  const { data, error } = await supabase
    .from('medical_services')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error || !data) return null;
  return toService(data as ServiceRow);
}

export async function toggleServiceActive(id: string, isActive: boolean): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase
    .from('medical_services')
    .update({ is_active: isActive })
    .eq('id', id);
  return !error;
}
