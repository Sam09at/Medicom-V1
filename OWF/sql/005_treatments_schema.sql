-- 005_treatments_schema.sql

-- Treatment Plans Table
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id),
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id TEXT NOT NULL REFERENCES public.users(id),
    
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Completed', 'Cancelled')),
    total_amount DECIMAL(10, 2) DEFAULT 0,
    
    odontogram_snapshot JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment Sessions Table
CREATE TABLE IF NOT EXISTS public.treatment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id),
    treatment_plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    
    session_order INTEGER DEFAULT 0,
    service_name TEXT,
    tooth_numbers INTEGER[] DEFAULT '{}',
    procedure_notes TEXT,
    
    status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Completed', 'Skipped')),
    price DECIMAL(10, 2) DEFAULT 0,
    session_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- (Simplified for brevity, ensuring tenant isolation)
CREATE POLICY "Tenant Isolation Plans" ON public.treatment_plans
    USING (tenant_id = (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text));

CREATE POLICY "Tenant Isolation Sessions" ON public.treatment_sessions
    USING (tenant_id = (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text));
