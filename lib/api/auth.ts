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
  const displayName = row.full_name || row.name || row.email || 'Utilisateur';
  const nameParts = displayName.split(' ');

  return {
    id: row.id,
    name: displayName,
    firstName: nameParts[0] ?? undefined,
    lastName: nameParts.slice(1).join(' ') || undefined,
    role: row.role,
    avatar:
      row.avatar ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&size=128&bold=true`,
    avatarUrl: row.avatar ?? undefined,
    tenantId: row.tenant_id ?? undefined,
    email: row.email ?? '',
    phone: undefined,
    isActive: row.status !== 'inactive' && row.status !== 'suspended',
    enabledModules: deserializeModuleConfig(row.enabled_modules ?? null),
    clinicName: row.clinic_name ?? tenantName,
  };
}

export function toTenantDetailed(row: TenantRow): TenantDetailed {
  const planRaw = (row.plan ?? '').toLowerCase();
  return {
    id: row.id,
    name: row.name ?? '',
    contactName: row.contact_name ?? row.name ?? '',
    email: row.email ?? row.contact_email ?? '',
    plan: planTierToDisplay(planRaw),
    planTier: (['starter', 'pro', 'premium'].includes(planRaw) ? planRaw : 'starter') as 'starter' | 'pro' | 'premium',
    status:
      row.status?.toLowerCase() === 'active'
        ? 'Active'
        : row.status?.toLowerCase() === 'suspended'
          ? 'Suspended'
          : 'Pending',
    usersCount: row.users_count ?? 0,
    storageUsed: row.storage_used ?? '0 MB',
    joinedAt: row.joined_at ?? new Date().toISOString(),
    mrr: row.mrr ?? 0,
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
    domain: row.subdomain ?? null,
    logoUrl: null,
    address: null,
    city: row.location ?? null,
    phone: row.phone ?? null,
    website: null,
    ice: null,
  };
}

// ─── Internal helper ──────────────────────────────────────────────────────────

export async function fetchProfileForUserId(
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
