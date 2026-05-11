import { supabase } from '../../supabase';
import type { TenantDetailed, ModuleConfiguration } from '../../../types';

// ── Mapper ────────────────────────────────────────────────────────────────────

function toTenantDetailed(t: any): TenantDetailed {
  const planRaw = (t.plan ?? t.plan_tier ?? 'starter').toLowerCase();
  const planDisplay = (planRaw === 'pro' ? 'Pro' : planRaw === 'premium' ? 'Premium' : 'Starter') as
    | 'Starter' | 'Pro' | 'Premium';

  const statusRaw = (t.status ?? '').toLowerCase();
  const statusDisplay: TenantDetailed['status'] =
    statusRaw === 'suspended' ? 'Suspended' :
    statusRaw === 'pending'   ? 'Pending'   : 'Active';

  const defaultModules: ModuleConfiguration = {
    dashboard: true, calendar: true, patients: true, treatments: true,
    inventory: true, labOrders: true, documents: true, records: true,
    billing: true, reports: true, support: true, landingPageBuilder: false,
  };

  return {
    id: t.id,
    name: t.name ?? '',
    contactName: t.contact_name ?? t.name ?? '',
    email: t.email ?? t.contact_email ?? '',
    plan: planDisplay,
    planTier: (['starter', 'pro', 'premium'].includes(planRaw) ? planRaw : 'starter') as
      'starter' | 'pro' | 'premium',
    status: statusDisplay,
    usersCount: t.users_count ?? 0,
    storageUsed: t.storage_used ?? '0 MB',
    joinedAt: t.joined_at ?? t.created_at ?? new Date().toISOString(),
    mrr: t.mrr ?? 0,
    region: t.region ?? '',
    enabledModules: defaultModules,
    domain: t.subdomain ?? t.domain ?? null,
    logoUrl: t.logo_url ?? null,
    address: t.address ?? null,
    city: t.city ?? t.location ?? null,
    phone: t.phone ?? null,
    website: null,
    ice: null,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllTenants(): Promise<TenantDetailed[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toTenantDetailed);
}

export async function getTenantById(id: string): Promise<TenantDetailed | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return toTenantDetailed(data);
}

export async function suspendTenant(tenantId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('tenants')
    .update({ status: 'suspended' })
    .eq('id', tenantId);
  if (error) throw error;
}

export async function activateTenant(tenantId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('tenants')
    .update({ status: 'active' })
    .eq('id', tenantId);
  if (error) throw error;
}

export async function updateTenantPlan(tenantId: string, plan: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  // Try both column names depending on which schema version is live
  const { error } = await supabase
    .from('tenants')
    .update({ plan })
    .eq('id', tenantId);
  if (error) {
    // Fallback to plan_tier if plan column doesn't exist
    const { error: e2 } = await supabase
      .from('tenants')
      .update({ plan_tier: plan })
      .eq('id', tenantId);
    if (e2) throw e2;
  }
}

export async function setTenantLifecycle(
  tenantId: string,
  status: 'active' | 'suspended' | 'deleted' | 'trial'
): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('tenants')
    .update({ status })
    .eq('id', tenantId);
  if (error) throw error;
}

/**
 * Creates a new clinic by calling the create-clinic-user Edge Function.
 * Requires the caller to be super_admin.
 */
export async function createClinicWithAdmin(params: {
  clinic_name: string;
  plan: 'starter' | 'pro' | 'premium';
  admin_email: string;
  admin_password: string;
  admin_name: string;
  admin_role?: 'clinic_admin' | 'doctor' | 'staff';
  phone?: string;
  location?: string;
  region?: string;
}): Promise<{ tenant_id: string; tenant_name: string; user_id: string; email: string }> {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-clinic-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ ...params, admin_role: params.admin_role ?? 'clinic_admin' }),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to create clinic');
  return json;
}
