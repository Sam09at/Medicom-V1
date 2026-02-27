-- 006_billing_schema.sql
-- ═══════════════════════════════════════════════════
-- TABLE: invoices
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       text NOT NULL REFERENCES public.tenants(id),
  patient_id      text NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_plan_id uuid REFERENCES public.treatment_plans(id), -- Optional link
  consultation_id uuid, -- Optional link to consultation (if UUID) or TEXT if you have text IDs elsewhere. Assuming UUID for new tables, but let's check. Consultations table not yet created in sql? Let's check. 
  
  invoice_number  text NOT NULL, -- Format: INV-YYYY-SEQ
  status          text NOT NULL CHECK (status IN ('Draft', 'Pending', 'Paid', 'Partial', 'Overdue', 'Cancelled')) DEFAULT 'Draft',
  type            text DEFAULT 'Standard', -- e.g. Consultation, Traitement, etc.
  
  subtotal        decimal(10, 2) DEFAULT 0,
  tax_amount      decimal(10, 2) DEFAULT 0,
  discount_amount decimal(10, 2) DEFAULT 0,
  total_amount    decimal(10, 2) DEFAULT 0,
  paid_amount     decimal(10, 2) DEFAULT 0,
  
  due_date        date,
  issued_at       date DEFAULT CURRENT_DATE,
  notes           text,
  
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  created_by      text REFERENCES public.users(id), -- User ID is text
  
  -- Ensure unique invoice number per tenant
  CONSTRAINT unique_invoice_number_per_tenant UNIQUE (tenant_id, invoice_number)
);

-- ═══════════════════════════════════════════════════
-- TABLE: invoice_items
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tenant_id       text NOT NULL REFERENCES public.tenants(id),
  
  description     text NOT NULL,
  quantity        integer DEFAULT 1,
  unit_price      decimal(10, 2) DEFAULT 0,
  total_price     decimal(10, 2) DEFAULT 0,
  
  service_id      uuid, -- Optional link to a service catalog
  tooth_number    integer, -- For dental specifics
  
  created_at      timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- TABLE: payments
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payments (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tenant_id       text NOT NULL REFERENCES public.tenants(id),
  patient_id      text NOT NULL REFERENCES public.patients(id),
  
  amount          decimal(10, 2) NOT NULL,
  method          text NOT NULL CHECK (method IN ('Cash', 'Card', 'Check', 'Transfer', 'Insurance', 'Other')),
  reference       text, -- Check number, transaction ID
  notes           text,
  payment_date    timestamptz DEFAULT now(),
  
  recorded_by     text REFERENCES public.users(id),
  created_at      timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════
-- TABLE: quotes (Devis)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quotes (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       text NOT NULL REFERENCES public.tenants(id),
  patient_id      text NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  
  quote_number    text NOT NULL,
  status          text NOT NULL CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired')) DEFAULT 'Draft',
  
  total_amount    decimal(10, 2) DEFAULT 0,
  valid_until     date,
  issued_at       date DEFAULT CURRENT_DATE,
  notes           text,
  items_json      jsonb DEFAULT '[]', -- Storing items as JSON for simplicity in quotes, or can normalize if preferred. Given invoice_items exists, let's normalize quotes too? For simplicity/speed maybe JSON is fine for quotes, but normalized is better. Let's use JSON for now to match 'items: string' in current mock but better structured.
  
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  created_by      text REFERENCES public.users(id),
  
  CONSTRAINT unique_quote_number_per_tenant UNIQUE (tenant_id, quote_number)
);

-- ═══════════════════════════════════════════════════
-- TABLE: expenses
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.expenses (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       text NOT NULL REFERENCES public.tenants(id),
  
  description     text NOT NULL,
  category        text NOT NULL CHECK (category IN ('Rent', 'Utilities', 'Salaries', 'Supplies', 'Lab', 'Equipment', 'Other')),
  amount          decimal(10, 2) NOT NULL,
  date            date DEFAULT CURRENT_DATE,
  status          text DEFAULT 'Paid',
  receipt_url     text,
  
  created_at      timestamptz DEFAULT now(),
  created_by      text REFERENCES public.users(id)
);

-- ═══════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Invoices
CREATE POLICY "Tenant Isolation Invoices" ON public.invoices
  USING (tenant_id = (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text));

-- Invoice Items
CREATE POLICY "Tenant Isolation Invoice Items" ON public.invoice_items
  USING (tenant_id = (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text));

-- Payments
CREATE POLICY "Tenant Isolation Payments" ON public.payments
  USING (tenant_id = (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text));

-- Quotes
CREATE POLICY "Tenant Isolation Quotes" ON public.quotes
  USING (tenant_id = (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text));

-- Expenses
CREATE POLICY "Tenant Isolation Expenses" ON public.expenses
  USING (tenant_id = (SELECT tenant_id::text FROM public.users WHERE id::text = auth.uid()::text));

-- ═══════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════
-- Auto-update paid_amount in invoices when a payment is inserted
CREATE OR REPLACE FUNCTION public.update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.invoices
  SET 
    paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id),
    status = CASE 
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id) >= total_amount THEN 'Paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id) > 0 THEN 'Partial'
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.invoice_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_after_payment
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_invoice_paid_amount();
