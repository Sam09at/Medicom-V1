import posthog from 'posthog-js';

// ── PostHog Initialization ──
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;

let posthogInitialized = false;

export function initPostHog() {
  if (POSTHOG_KEY && !posthogInitialized) {
    posthog.init(POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: false,
      capture_pageview: true,
      persistence: 'localStorage',
    });
    posthogInitialized = true;
  }
}

// ── Event Tracking ──

type TrackableEvent =
  | 'appointment_created'
  | 'patient_created'
  | 'invoice_paid'
  | 'consultation_completed'
  | 'prescription_generated'
  | 'lead_status_changed'
  | 'tenant_created'
  | 'tenant_suspended'
  | 'settings_saved'
  | 'document_generated'
  | 'lab_order_created';

/**
 * Track an analytics event via PostHog.
 * No-op if PostHog is not initialized (env var missing).
 */
export function trackEvent(event: TrackableEvent, properties?: Record<string, unknown>) {
  if (!posthogInitialized) return;
  posthog.capture(event, properties);
}

/**
 * Identify a user in PostHog for session tracking.
 * Uses tenant_id grouping for multi-tenant analytics.
 */
export function identifyUser(
  userId: string,
  traits?: { role?: string; tenantId?: string; plan?: string }
) {
  if (!posthogInitialized) return;
  posthog.identify(userId, {
    role: traits?.role,
    plan: traits?.plan,
  });
  if (traits?.tenantId) {
    posthog.group('tenant', traits.tenantId);
  }
}

/**
 * Reset PostHog identity on logout.
 */
export function resetAnalytics() {
  if (!posthogInitialized) return;
  posthog.reset();
}
