-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 013_auth_profile_sync.sql
-- Trigger: auto-create public.users row when a new Supabase Auth
-- user is inserted into auth.users.
--
-- HOW IT WORKS:
-- When Sami creates a clinic user in the Supabase Auth dashboard,
-- he sets user_metadata:
--   { "tenant_id": "uuid", "role": "doctor",
--     "first_name": "Amina", "last_name": "El Amrani" }
-- This trigger reads those values and inserts the public.users row,
-- so the app can find the profile immediately after login.
--
-- SECURITY DEFINER: runs as db owner to bypass RLS for the INSERT.
-- ON CONFLICT DO NOTHING: safe to re-run if trigger fires twice.
-- Depends on: 001_core_schema.sql (users table, user_role enum)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    tenant_id,
    role,
    first_name,
    last_name,
    email,
    is_active,
    module_config,
    created_at
  )
  VALUES (
    NEW.id,
    -- Cast to uuid; will be NULL if not provided (e.g. super_admin has no tenant)
    NULLIF(NEW.raw_user_meta_data ->> 'tenant_id', '')::uuid,
    -- Default to 'staff' if role not specified in metadata
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'role', '')::public.user_role,
      'staff'::public.user_role
    ),
    NULLIF(NEW.raw_user_meta_data ->> 'first_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    true,
    '{}'::jsonb,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  -- ON CONFLICT: safe if trigger fires more than once (e.g. email confirmation)

  RETURN NEW;
END;
$$;

-- Drop and recreate to ensure the latest version is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;
