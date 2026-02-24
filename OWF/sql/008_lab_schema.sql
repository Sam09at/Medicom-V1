-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 008_lab_schema.sql
-- Lab Orders and Contacts
-- Depends on: 001_core_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Lab Contacts (Laboratories)
CREATE TABLE IF NOT EXISTS public.lab_contacts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       text NOT NULL REFERENCES public.tenants(id),
  name            text NOT NULL,
  contact_person  text,
  phone           text,
  email           text,
  address         text,
  notes           text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS for Lab Contacts
ALTER TABLE public.lab_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lab_contacts_tenant_isolation"
  ON public.lab_contacts FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id'));


-- 2. Lab Orders
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       text NOT NULL REFERENCES public.tenants(id),
  patient_id      text NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  lab_contact_id  uuid REFERENCES public.lab_contacts(id),
  doctor_id       text REFERENCES public.users(id),
  
  order_date      date DEFAULT CURRENT_DATE,
  due_date        date,
  
  status          text CHECK (status IN ('Sent', 'In Progress', 'Received', 'Fitted', 'Cancelled')) DEFAULT 'Sent',
  type            text, -- e.g., 'Couronne', 'Bridge'
  tooth_numbers   text[], -- Array of tooth numbers as strings "16", "26"
  shade           text, -- 'A2', 'A3', etc.
  description     text, -- Instructions/Notes
  
  cost            numeric(10, 2) DEFAULT 0,
  
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS for Lab Orders
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lab_orders_tenant_isolation"
  ON public.lab_orders FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id'))
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id'));

-- Triggers for updated_at
CREATE TRIGGER lab_contacts_updated_at BEFORE UPDATE ON public.lab_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER lab_orders_updated_at BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
