import { supabase, isSupabaseConfigured } from '../supabase';
import { MedicomError, ERROR_CODES } from '../errors';
import type {
  User,
  TenantDetailed,
  UserRow,
  TenantRow,
  LoginCredentials,
  PasswordResetRequest,
  ModuleConfiguration,
} from '../../types';

// ─── Mappers ──────────────────────────────────────────────────────────────────
// Follow the same pattern as lib/api/patients.ts: one mapper per DB table.

function planTierToDisplay(tier: string): 'Starter' | 'Pro' | 'Premium' {
  const map: Record<string, 'Starter' | 'Pro' | 'Premium'> = {
    starter: 'Starter',
    pro: 'Pro',
    premium: 'Premium',
  };
  return map[tier] ?? 'Starter';
}

function deserializeModuleConfig(
  raw: Record<string, boolean> | null
): ModuleConfiguration | undefined {
  if (!raw) return undefined;
  const defaults: ModuleConfiguration = {
    dashboard: false,
    calendar: false,
    patients: false,
    treatments: false,
    inventory: false,
    labOrders: false,
    documents: false,
    records: false,
    billing: false,
    reports: false,
    support: false,
    landingPageBuilder: false,
  };
  return { ...defaults, ...raw };
}

export function toUser(row: UserRow, tenantName?: string): User {
  const displayName =
    [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email;

  return {
    id: row.id,
    name: displayName,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    role: row.role,
    // ui-avatars fallback: generates an initials avatar matching the app's blue
    avatar:
      row.avatar_url ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&size=128&bold=true`,
    avatarUrl: row.avatar_url ?? undefined,
    tenantId: row.tenant_id ?? undefined,
    email: row.email,
    phone: row.phone ?? undefined,
    isActive: row.is_active,
    enabledModules: deserializeModuleConfig(row.module_config),
    clinicName: tenantName,
  };
}

export function toTenantDetailed(row: TenantRow): TenantDetailed {
  return {
    id: row.id,
    name: row.name,
    contactName: row.name, // no dedicated contact_name column; fallback to clinic name
    email: row.email ?? '',
    plan: planTierToDisplay(row.plan_tier),
    planTier: row.plan_tier,
    status:
      row.status === 'active'
        ? 'Active'
        : row.status === 'suspended'
          ? 'Suspended'
          : 'Pending',
    usersCount: 0, // populated separately when needed (avoids extra join on every auth)
    storageUsed: '0 MB',
    joinedAt: row.created_at,
    mrr: 0,
    region: row.region ?? '',
    enabledModules: {
      dashboard: true,
      calendar: true,
      patients: true,
      treatments: true,
      inventory: true,
      labOrders: true,
      documents: true,
      records: true,
      billing: true,
      reports: true,
      support: true,
      landingPageBuilder: false,
    },
    domain: row.domain,
    logoUrl: row.logo_url,
    address: row.address,
    city: row.city,
    phone: row.phone,
    website: row.website,
    ice: row.ice,
  };
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function fetchProfileForUserId(
  authUserId: string
): Promise<{ user: User; tenant: TenantDetailed | null }> {
  const { data: userRow, error: userError } = await supabase!
    .from('users')
    .select('*')
    .eq('id', authUserId)
    .single();

  if (userError || !userRow) {
    throw new MedicomError(
      ERROR_CODES.AUTH_PROFILE_NOT_FOUND,
      `public.users row not found for auth.users id=${authUserId}`,
      401,
      { hint: 'Run migration 013_auth_profile_sync.sql and re-create the user.' }
    );
  }

  const typedRow = userRow as UserRow;
  let tenant: TenantDetailed | null = null;

  if (typedRow.tenant_id) {
    const { data: tenantRow } = await supabase!
      .from('tenants')
      .select('*')
      .eq('id', typedRow.tenant_id)
      .single();

    if (tenantRow) {
      tenant = toTenantDetailed(tenantRow as TenantRow);
    }
  }

  return { user: toUser(typedRow, tenant?.name), tenant };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Signs in with email and password.
 * In mock mode (no Supabase credentials) returns the doctor demo profile.
 */
export async function signIn(
  credentials: LoginCredentials
): Promise<{ user: User; tenant: TenantDetailed | null }> {
  if (!supabase) {
    const { CURRENT_USER_DOCTOR, MOCK_TENANTS_DETAILED } = await import('../../constants');
    return { user: CURRENT_USER_DOCTOR, tenant: MOCK_TENANTS_DETAILED[0] };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login')) {
      throw new MedicomError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, error.message, 401);
    }
    throw new MedicomError(ERROR_CODES.NETWORK_ERROR, error.message, 500);
  }

  if (!data.user) {
    throw new MedicomError(ERROR_CODES.AUTH_UNAUTHORIZED, 'No user returned from signIn', 401);
  }

  return fetchProfileForUserId(data.user.id);
}

/**
 * Signs out the current session.
 * Always resolves — clears the local Supabase session even if the network call fails.
 */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Sends a password reset email.
 * Safe to call with any email — does not reveal whether the account exists.
 */
export async function requestPasswordReset(req: PasswordResetRequest): Promise<void> {
  if (!supabase) return;

  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(req.email, { redirectTo });

  if (error) {
    throw new MedicomError(ERROR_CODES.NETWORK_ERROR, error.message, 500);
  }
}

/**
 * Updates the current user's password.
 * Only valid when called in the context of a password-reset session
 * (i.e. user arrived via the reset link from their email).
 */
export async function updatePassword(newPassword: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new MedicomError(ERROR_CODES.NETWORK_ERROR, error.message, 500);
  }
}

/**
 * Rehydrates the user profile from an existing Supabase session.
 * Called once on app mount in AppProviders.
 * Returns null if no active session exists (user needs to log in).
 */
export async function fetchCurrentUserProfile(): Promise<{
  user: User;
  tenant: TenantDetailed | null;
} | null> {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  return fetchProfileForUserId(session.user.id);
}
