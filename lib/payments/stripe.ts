import { supabase } from '../supabase';

export const PLAN_STRIPE_PRICE_IDS: Record<string, string> = {
  essentiel: process.env.VITE_STRIPE_PRICE_ESSENTIEL ?? 'price_essentiel',
  pro:        process.env.VITE_STRIPE_PRICE_PRO ?? 'price_pro',
  premium:    process.env.VITE_STRIPE_PRICE_PREMIUM ?? 'price_premium',
};

export interface CheckoutResult {
  checkoutUrl: string;
}

export interface PortalResult {
  portalUrl: string;
}

export interface SubscriptionStatus {
  planTier: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'unpaid';
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

/**
 * Creates a Stripe Checkout session via Edge Function.
 * Returns the hosted checkout URL to redirect the user to.
 */
export async function createCheckoutSession(
  tenantId: string,
  planTier: 'essentiel' | 'pro' | 'premium'
): Promise<CheckoutResult> {
  if (!supabase) throw new Error('Supabase not available');

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { tenant_id: tenantId, plan_tier: planTier },
  });

  if (error) throw error;
  return { checkoutUrl: data.checkout_url };
}

/**
 * Creates a Stripe Billing Portal session via Edge Function.
 * Allows existing subscribers to manage their plan/payment method.
 */
export async function createBillingPortalSession(tenantId: string): Promise<PortalResult> {
  if (!supabase) throw new Error('Supabase not available');

  const { data, error } = await supabase.functions.invoke('billing-portal', {
    body: { tenant_id: tenantId },
  });

  if (error) throw error;
  return { portalUrl: data.portal_url };
}

/**
 * Fetches the current subscription status for a tenant from the DB.
 */
export async function getSubscriptionStatus(tenantId: string): Promise<SubscriptionStatus | null> {
  if (!supabase) return null;

  const { data } = await supabase
    .from('tenants')
    .select('plan_tier, status, current_period_end, stripe_customer_id')
    .eq('id', tenantId)
    .maybeSingle();

  if (!data) return null;

  return {
    planTier: data.plan_tier ?? 'essentiel',
    status: (data.status as SubscriptionStatus['status']) ?? 'active',
    currentPeriodEnd: data.current_period_end ?? null,
    stripeCustomerId: data.stripe_customer_id ?? null,
  };
}
