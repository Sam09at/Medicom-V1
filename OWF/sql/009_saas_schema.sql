-- 009_saas_schema.sql
-- ═══════════════════════════════════════════════════
-- SaaS Administration & CRM Tables
-- ═══════════════════════════════════════════════════

-- 1. Alter tenants table to add profile fields
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS ice text;

-- ═══════════════════════════════════════════════════
-- TABLE: subscriptions
-- Tracks billing status and plan for each tenant
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_tier public.plan_tier DEFAULT 'starter',
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  started_at timestamptz DEFAULT now(),
  current_period_end timestamptz,
  mrr decimal(10, 2) DEFAULT 0,
  stripe_subscription_id text,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage subscriptions (or service_role)
-- Tenant admins can read their own subscription
CREATE POLICY "Super admin manages subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'super_admin'
  );

CREATE POLICY "Tenants read own subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

-- ═══════════════════════════════════════════════════
-- TABLE: tenant_usage
-- Daily usage metrics for billing and analytics
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  bookings_count integer DEFAULT 0,
  storage_mb decimal(10, 2) DEFAULT 0,
  sms_sent integer DEFAULT 0,
  api_calls integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_date_per_tenant UNIQUE (tenant_id, date)
);

ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- Super admin reads all usage
CREATE POLICY "Super admin reads tenant_usage" ON public.tenant_usage
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'super_admin'
  );

-- Tenants read own usage
CREATE POLICY "Tenants read own usage" ON public.tenant_usage
  FOR SELECT TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

-- ═══════════════════════════════════════════════════
-- TABLE: leads (CRM)
-- Potential customers/clinics for the SaaS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL, -- Clinic or Doctor Name
  contact_person text,
  email text,
  phone text,
  city text,
  source text DEFAULT 'Organic',
  status text NOT NULL CHECK (status IN ('new', 'contacted', 'demo', 'proposal', 'won', 'lost')) DEFAULT 'new',
  assigned_to uuid REFERENCES public.users(id), -- Sales Rep / Super Admin
  est_value decimal(10, 2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only super_admin (and sales roles if added) can access leads
CREATE POLICY "Super admin manages leads" ON public.leads
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'super_admin'
  );

-- ═══════════════════════════════════════════════════
-- TABLE: lead_activities
-- Timeline of interactions with leads
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id), -- Who performed the activity
  type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'status_change')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Only super_admin can access activities
CREATE POLICY "Super admin manages lead_activities" ON public.lead_activities
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'super_admin'
  );

-- Trigger for leads updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
