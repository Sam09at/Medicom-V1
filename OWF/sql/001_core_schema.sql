-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 001_core_schema.sql
-- Core tables: tenants, users, patients, appointments, audit_logs
-- Depends on: 000_enums.sql
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";   -- needed for EXCLUDE constraint

-- ═══════════════════════════════════════════════════
-- TABLE: tenants
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tenants (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  domain      text UNIQUE,
  plan_tier   public.plan_tier DEFAULT 'starter',
  status      public.tenant_status DEFAULT 'trial',
  settings_json jsonb DEFAULT '{}',
  logo_url    text,
  address     text,
  city        text,
  phone       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage tenants
CREATE POLICY "service_role_manage_tenants"
  ON public.tenants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own tenant
CREATE POLICY "users_read_own_tenant"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );


-- ═══════════════════════════════════════════════════
-- TABLE: users
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  role        public.user_role NOT NULL,
  first_name  text,
  last_name   text,
  email       text UNIQUE NOT NULL,
  phone       text,
  avatar_url  text,
  is_active   boolean DEFAULT true,
  module_config jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "service_role_manage_users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own row
CREATE POLICY "users_read_own_row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can read other users in the same tenant
CREATE POLICY "users_read_same_tenant"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );


-- ═══════════════════════════════════════════════════
-- TABLE: patients
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.patients (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  date_of_birth   date,
  gender          text CHECK (gender IN ('M', 'F', 'Other')),
  phone           text,
  email           text,
  address         text,
  city            text,
  insurance_type  public.insurance_type DEFAULT 'none',
  insurance_number text,
  allergies       text[] DEFAULT '{}',
  pathologies     text[] DEFAULT '{}',
  notes           text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  created_by      uuid REFERENCES public.users(id),
  -- Prevent duplicate phone within a tenant
  CONSTRAINT unique_phone_per_tenant UNIQUE (tenant_id, phone)
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Authenticated users: CRUD within own tenant
CREATE POLICY "patients_tenant_isolation"
  ON public.patients
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

-- Service role full access
CREATE POLICY "service_role_manage_patients"
  ON public.patients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ═══════════════════════════════════════════════════
-- TABLE: appointments
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.appointments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id   uuid NOT NULL REFERENCES public.users(id),
  created_by  uuid REFERENCES public.users(id),
  service_id  uuid,  -- future FK to services table
  title       text,
  type        public.appointment_type DEFAULT 'consultation',
  status      public.appointment_status DEFAULT 'pending',
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  notes       text,
  color       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  -- Prevent overlapping appointments for the same doctor in the same tenant
  CONSTRAINT no_overlap EXCLUDE USING gist (
    tenant_id WITH =,
    doctor_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status NOT IN ('cancelled', 'absent', 'rescheduled'))
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Authenticated users: CRUD within own tenant
CREATE POLICY "appointments_tenant_isolation"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

-- Service role full access
CREATE POLICY "service_role_manage_appointments"
  ON public.appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ═══════════════════════════════════════════════════
-- TABLE: audit_logs
-- IMMUTABLE: No UPDATE or DELETE allowed.
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid REFERENCES public.tenants(id),
  user_id     uuid REFERENCES public.users(id),
  action      text NOT NULL,        -- e.g. 'patient.create', 'invoice.paid'
  entity_type text NOT NULL,        -- e.g. 'Patient', 'Invoice'
  entity_id   uuid,
  changes     jsonb,                -- { before: {}, after: {} }
  ip_address  inet,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can INSERT audit logs
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

-- Authenticated users can read their tenant's audit logs
CREATE POLICY "audit_logs_read_tenant"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

-- Service role full access
CREATE POLICY "service_role_manage_audit_logs"
  ON public.audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Prevent UPDATE and DELETE on audit_logs
CREATE RULE audit_logs_no_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;


-- ═══════════════════════════════════════════════════
-- TRIGGERS: auto-update updated_at
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
