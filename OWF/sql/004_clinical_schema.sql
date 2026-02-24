-- Enable RLS for all new tables
-- consultations
CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  doctor_id uuid NOT NULL REFERENCES public.users(id),
  created_by uuid REFERENCES public.users(id),
  
  -- Clinical Data
  chief_complaint text,
  examination text,
  diagnosis text,
  treatment_plan text,
  notes text,
  vitals jsonb DEFAULT '{}'::jsonb, -- {bp_systolic, bp_diastolic, heart_rate, temp, weight, height}
  
  status text CHECK (status IN ('draft', 'completed', 'cancelled')) DEFAULT 'draft',
  invoice_id uuid, -- Can reference invoices table later
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consultations for their tenant" ON public.consultations
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert consultations for their tenant" ON public.consultations
  FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update consultations for their tenant" ON public.consultations
  FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete consultations for their tenant" ON public.consultations
  FOR DELETE USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  doctor_id uuid NOT NULL REFERENCES public.users(id),
  
  drugs jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{name, dosage, frequency, duration, notes}]
  notes text,
  issued_at timestamptz DEFAULT now(),
  pdf_url text
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prescriptions for their tenant" ON public.prescriptions
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert prescriptions for their tenant" ON public.prescriptions
  FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update prescriptions for their tenant" ON public.prescriptions
  FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- medical_services
CREATE TABLE IF NOT EXISTS public.medical_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  duration_minutes int DEFAULT 30,
  price decimal(10,2) DEFAULT 0,
  tva_rate decimal(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.medical_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view medical_services for their tenant" ON public.medical_services
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert medical_services for their tenant" ON public.medical_services
  FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update medical_services for their tenant" ON public.medical_services
  FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- Trigger for updated_at on consultations
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
