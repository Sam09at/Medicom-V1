import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Whether environment variables are configured for Supabase.
 * When false, the app runs in mock-data mode.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[Medicom] Supabase credentials missing. Running in mock-data mode.\n' +
      'Copy .env.example → .env.local and fill in your project keys.'
  );
}

/**
 * Public Supabase client for browser use.
 * Uses the anon key — all queries are subject to RLS.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Helper to get the authenticated user's tenant_id from their JWT metadata.
 * Returns null if no session exists.
 */
export async function getCurrentTenantId(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (user?.user_metadata?.tenant_id as string) ?? null;
}

/**
 * Helper to get the authenticated user's id.
 * Returns null if no session exists.
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
