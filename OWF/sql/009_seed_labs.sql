
-- 009_seed_labs.sql
-- Insert seed data for lab_contacts if none exist for the default tenant.
-- Note: Tenant ID handling is tricky in seed scripts without knowing the ID.
-- This script assumes it's run by a user who is logged in or we just insert if we can lookup the tenant.
-- For now, I'll provide the SQL statements the user can run, or I'll try to insert associated with the first tenant found.

DO $$
DECLARE
    v_tenant_id text;
BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

    IF v_tenant_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.lab_contacts WHERE tenant_id = v_tenant_id) THEN
            INSERT INTO public.lab_contacts (tenant_id, name, contact_person, phone, email, address, notes)
            VALUES 
            (v_tenant_id, 'Labo Prothèse Atlas', 'Karim Benali', '0522123456', 'contact@atlaslab.ma', '123 Bd Zerktouni, Casablanca', 'Spécialiste céramique'),
            (v_tenant_id, 'Smile Lab', 'Sarah Kabbaj', '0661987654', 'sarah@smilelab.ma', '45 Rue des FAR, Rabat', 'Délais rapides'),
            (v_tenant_id, 'Dental Tech', 'Omar Tazi', '0537112233', 'info@dentaltech.ma', 'Immeuble C, Technopolis, Salé', 'Numérique et 3D');
        END IF;
    END IF;
END $$;
