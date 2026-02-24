import { supabase } from '@/lib/supabase';
import { TenantDetailed, ModuleConfiguration } from '@/types';

export const getAllTenants = async (): Promise<TenantDetailed[]> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('tenants')
    .select(
      `
      *,
      subscriptions (
        plan_tier,
        status,
        mrr,
        current_period_end
      ),
      tenant_usage (
        bookings_count,
        storage_mb,
        sms_sent
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Map to TenantDetailed interface
  return data.map((t: any) => ({
    id: t.id,
    name: t.name,
    contactName: 'Unknown', // Placeholder as not in tenants table
    email: t.email || '',
    plan: t.subscriptions?.[0]?.plan_tier || t.plan_tier || 'starter',
    status: (t.status === 'suspended' ? 'Suspended' : 'Active') as
      | 'Active'
      | 'Suspended'
      | 'Pending',
    usersCount: 0,
    storageUsed: `${t.tenant_usage?.[0]?.storage_mb || 0} MB`,
    joinedAt: t.created_at,
    mrr: t.subscriptions?.[0]?.mrr || 0,
    region: 'Casablanca', // Placeholder
    enabledModules: (t.settings_json?.modules || {
      dashboard: true,
      calendar: true,
      patients: true,
      treatments: true,
      billing: true,
      settings: true,
      labOrders: true,
      documents: true,
      records: true,
      reports: true,
      support: true,
    }) as ModuleConfiguration,
  }));
};

export const suspendTenant = async (tenantId: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase
    .from('tenants')
    .update({ status: 'suspended' })
    .eq('id', tenantId);

  if (error) throw error;
};

export const activateTenant = async (tenantId: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase.from('tenants').update({ status: 'active' }).eq('id', tenantId);

  if (error) throw error;
};

export const updateTenantPlan = async (tenantId: string, plan: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  // Update subscription table primarily
  const { error } = await supabase.from('subscriptions').upsert({
    tenant_id: tenantId,
    plan_tier: plan,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
};

export const setTenantLifecycle = async (
  tenantId: string,
  status: 'active' | 'suspended' | 'deleted' | 'trial'
): Promise<void> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  // For soft delete (deleted), we might just mark status = 'deleted'
  const { error } = await supabase.from('tenants').update({ status: status }).eq('id', tenantId);

  if (error) throw error;
};
