import { supabase } from '@/lib/supabase';

/**
 * CRM Lead — mirrors the `leads` table in 009_saas_schema.sql.
 * Intentionally separate from the UI-only `OnboardingLead` type.
 */
export interface Lead {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  source: string;
  status: string;
  assignedTo?: string;
  estValue: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  userId?: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  description: string;
  createdAt: string;
}

/* ── Queries ───────────────────────────────────────────── */

export const getLeads = async (): Promise<Lead[]> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((l: any) => ({
    id: l.id,
    name: l.name,
    contactPerson: l.contact_person,
    email: l.email,
    phone: l.phone,
    city: l.city,
    source: l.source,
    status: l.status,
    assignedTo: l.assigned_to,
    estValue: l.est_value ?? 0,
    notes: l.notes ?? '',
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  }));
};

export const createLead = async (
  lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Lead> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        name: lead.name,
        contact_person: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        source: lead.source,
        status: lead.status || 'new',
        est_value: lead.estValue,
        notes: lead.notes,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: data.phone,
    city: data.city,
    source: data.source,
    status: data.status,
    assignedTo: data.assigned_to,
    estValue: data.est_value ?? 0,
    notes: data.notes ?? '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const updateLeadStatus = async (leadId: string, status: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);

  if (error) throw error;
};

export const getLeadActivities = async (leadId: string): Promise<LeadActivity[]> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((a: any) => ({
    id: a.id,
    leadId: a.lead_id,
    userId: a.user_id,
    type: a.type,
    description: a.description,
    createdAt: a.created_at,
  }));
};

export const addActivity = async (
  activity: Omit<LeadActivity, 'id' | 'createdAt'>
): Promise<void> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase.from('lead_activities').insert([
    {
      lead_id: activity.leadId,
      user_id: activity.userId,
      type: activity.type,
      description: activity.description,
    },
  ]);

  if (error) throw error;
};

export const getDailyActivityMetrics = async (userId?: string): Promise<{ calls: number; emails: number; meetings: number }> => {
  if (!supabase) throw new Error('Supabase client not initialized');

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let query = supabase
    .from('lead_activities')
    .select('type')
    .gte('created_at', startOfDay.toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const metrics = { calls: 0, emails: 0, meetings: 0 };

  if (data) {
    data.forEach((activity: { type: string }) => {
      if (activity.type === 'call') metrics.calls++;
      if (activity.type === 'email') metrics.emails++;
      if (activity.type === 'meeting') metrics.meetings++;
    });
  }

  return metrics;
};
