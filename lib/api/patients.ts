import { supabase } from '../supabase';
import { MedicomError, ERROR_CODES, fromSupabaseError } from '../errors';
import { validateMoroccanPhone } from '../utils';
import type { Patient } from '../../types';

// ── DB row ↔ Frontend type mappers ──

interface PatientRow {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  insurance_type: string;
  insurance_number: string | null;
  allergies: string[];
  pathologies: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/** Maps a Supabase row to the frontend Patient type */
function toPatient(row: PatientRow): Patient {
  const dob = row.date_of_birth ? new Date(row.date_of_birth) : null;
  const now = new Date();
  const age = dob
    ? Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone ?? '',
    age,
    gender: (row.gender as 'M' | 'F') ?? 'M',
    insuranceType: mapInsuranceType(row.insurance_type),
    lastVisit: undefined, // populated by join in future
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    insuranceNumber: row.insurance_number ?? undefined,
    allergies: row.allergies ?? [],
    pathologies: row.pathologies ?? [],
    notes: row.notes ?? undefined,
    medicalHistory: row.pathologies ?? [],
    isActive: row.is_active,
  };
}

function mapInsuranceType(dbType: string): 'CNOPS' | 'CNSS' | 'Private' | 'None' {
  const map: Record<string, 'CNOPS' | 'CNSS' | 'Private' | 'None'> = {
    cnops: 'CNOPS',
    cnss: 'CNSS',
    private: 'Private',
    none: 'None',
  };
  return map[dbType] ?? 'None';
}

function toDbInsuranceType(type: string): string {
  const map: Record<string, string> = {
    CNOPS: 'cnops',
    CNSS: 'cnss',
    Private: 'private',
    None: 'none',
  };
  return map[type] ?? 'none';
}

// ── Audit helper ──

async function writeAuditLog(
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> }
): Promise<void> {
  if (!supabase) return;
  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes: changes ?? null,
  });
}

// ═══════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════

/**
 * Fetches patients for a given tenant with optional filtering and pagination.
 * @param tenantId - The tenant UUID
 * @param filters - Optional search, insurance type, and active status filters
 * @param pagination - Optional page number and page size
 */
export async function getPatients(
  tenantId: string,
  filters?: { search?: string; insuranceType?: string; isActive?: boolean },
  pagination?: { page: number; pageSize: number }
): Promise<{ data: Patient[]; count: number }> {
  if (!supabase) {
    // Fallback to mock data — import dynamically to avoid circular deps
    const { MOCK_PATIENTS } = await import('../../constants');
    return { data: MOCK_PATIENTS, count: MOCK_PATIENTS.length };
  }

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    );
  }
  if (filters?.insuranceType) {
    query = query.eq('insurance_type', toDbInsuranceType(filters.insuranceType));
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw fromSupabaseError(error);
  return {
    data: (data as PatientRow[]).map(toPatient),
    count: count ?? 0,
  };
}

/**
 * Fetches a single patient by ID within a tenant.
 * @throws MedicomError if not found
 */
export async function getPatient(id: string, tenantId: string): Promise<Patient> {
  if (!supabase) {
    const { MOCK_PATIENTS } = await import('../../constants');
    const p = MOCK_PATIENTS.find((pt) => pt.id === id);
    if (!p) throw new MedicomError(ERROR_CODES.PATIENT_NOT_FOUND, `Patient ${id} not found`, 404);
    return p;
  }

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data)
    throw new MedicomError(ERROR_CODES.PATIENT_NOT_FOUND, `Patient ${id} not found`, 404);
  return toPatient(data as PatientRow);
}

/**
 * Creates a new patient within a tenant.
 * Validates Moroccan phone, checks for duplicates.
 * @throws MedicomError on duplicate phone or invalid data
 */
export async function createPatient(
  data: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    gender?: 'M' | 'F';
    dateOfBirth?: string;
    address?: string;
    city?: string;
    insuranceType?: string;
    insuranceNumber?: string;
    allergies?: string[];
    pathologies?: string[];
    notes?: string;
  },
  tenantId: string,
  userId: string
): Promise<Patient> {
  // Validate phone if provided
  if (data.phone && !validateMoroccanPhone(data.phone)) {
    throw new MedicomError(
      ERROR_CODES.PATIENT_DUPLICATE_PHONE,
      'Invalid Moroccan phone number',
      400
    );
  }

  if (!supabase) {
    // Mock mode: return a fake patient
    return {
      id: `PAT-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? '',
      age: 0,
      gender: data.gender ?? 'M',
      insuranceType: (data.insuranceType as 'CNOPS' | 'CNSS' | 'Private' | 'None') ?? 'None',
    };
  }

  const { data: created, error } = await supabase
    .from('patients')
    .insert({
      tenant_id: tenantId,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || null,
      email: data.email || null,
      gender: data.gender || null,
      date_of_birth: data.dateOfBirth || null,
      address: data.address || null,
      city: data.city || null,
      insurance_type: toDbInsuranceType(data.insuranceType ?? 'None'),
      insurance_number: data.insuranceNumber || null,
      allergies: data.allergies ?? [],
      pathologies: data.pathologies ?? [],
      notes: data.notes || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw fromSupabaseError(error);

  // Write audit log
  await writeAuditLog(tenantId, userId, 'patient.create', 'Patient', created.id, {
    after: { firstName: data.firstName, lastName: data.lastName },
  });

  return toPatient(created as PatientRow);
}

/**
 * Updates an existing patient.
 * @throws MedicomError if not found
 */
export async function updatePatient(
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    gender: 'M' | 'F';
    dateOfBirth: string;
    address: string;
    city: string;
    insuranceType: string;
    insuranceNumber: string;
    allergies: string[];
    pathologies: string[];
    notes: string;
  }>,
  tenantId: string,
  userId: string
): Promise<Patient> {
  if (!supabase) {
    return getPatient(id, tenantId);
  }

  // Build update object mapping camelCase → snake_case
  const updates: Record<string, unknown> = {};
  if (data.firstName !== undefined) updates.first_name = data.firstName;
  if (data.lastName !== undefined) updates.last_name = data.lastName;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.email !== undefined) updates.email = data.email;
  if (data.gender !== undefined) updates.gender = data.gender;
  if (data.dateOfBirth !== undefined) updates.date_of_birth = data.dateOfBirth;
  if (data.address !== undefined) updates.address = data.address;
  if (data.city !== undefined) updates.city = data.city;
  if (data.insuranceType !== undefined)
    updates.insurance_type = toDbInsuranceType(data.insuranceType);
  if (data.insuranceNumber !== undefined) updates.insurance_number = data.insuranceNumber;
  if (data.allergies !== undefined) updates.allergies = data.allergies;
  if (data.pathologies !== undefined) updates.pathologies = data.pathologies;
  if (data.notes !== undefined) updates.notes = data.notes;

  const { data: updated, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw fromSupabaseError(error);
  if (!updated)
    throw new MedicomError(ERROR_CODES.PATIENT_NOT_FOUND, `Patient ${id} not found`, 404);

  await writeAuditLog(tenantId, userId, 'patient.update', 'Patient', id, {
    after: data as Record<string, unknown>,
  });

  return toPatient(updated as PatientRow);
}

/**
 * Soft-deletes a patient (sets is_active = false).
 * @throws MedicomError if not found
 */
export async function softDeletePatient(
  id: string,
  tenantId: string,
  userId: string
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('patients')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw fromSupabaseError(error);

  await writeAuditLog(tenantId, userId, 'patient.soft_delete', 'Patient', id);
}
