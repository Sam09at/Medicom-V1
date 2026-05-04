# Medicom V2 — Full Action Plan
**Version:** 1.0 — Generated May 2026  
**Codebase base:** v0.15.0  
**Author:** Claude Code (repo-grounded, PRD-adjusted)

---

## How to Read This Document

Each task has:
- **What:** The exact files to create or edit, with line-level precision
- **Why:** The business or technical reason
- **Done when:** A verifiable acceptance criterion
- **Depends on:** Hard prerequisites (do not start before these)

Tasks are ordered so you can execute them top-to-bottom within each phase without hitting a dependency wall.

---

## Architecture Decision — Locked

**Option B is the build target.** Two frontends, one Supabase.

| Frontend | Repo | Domain | Stack | Purpose |
|---|---|---|---|---|
| Clinic dashboard | `Medicom-V1` (this repo) | `app.medicom.ma` | Vite + React 19 | Daily clinical workflow |
| Public site | `medicom-public` (new repo) | `medicom.ma` | Next.js 14 App Router | SEO landing pages + booking |
| Edge functions | Supabase project | `api.medicom.ma` | Deno (Supabase) | Slot logic, WhatsApp, webhooks |

Shared between both frontends:
- Single Supabase project (same DB, same RLS)
- Zod schemas (copy or workspace package)
- Supabase generated TypeScript types (`supabase gen types typescript`)

---

## Phase 0 — Foundations (Weeks 1–4)

### 0.1 — Real Supabase Auth

**Priority: CRITICAL BLOCKER.** MockLoginPicker means any URL visitor sees the admin panel.

#### Files to create

```
features/Auth/
  LoginPage.tsx           ← email/password sign-in form
  ForgotPasswordPage.tsx  ← sends Supabase password-reset email
  ResetPasswordPage.tsx   ← handles magic-link callback, sets new password
  SignupPage.tsx          ← new clinic self-registration (Phase 2 — stub it now)
  index.ts                ← re-exports
```

**`LoginPage.tsx` implementation pattern:**
```tsx
import { supabase } from '../../lib/supabase';
import { useMedicomStore } from '../../store';

export function LoginPage() {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  const setCurrentUser = useMedicomStore(s => s.setCurrentUser);

  const onSubmit = async ({ email, password }) => {
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) { showToast({ type: 'error', message: error.message }); return; }
    // onAuthStateChange in AppProviders will load the profile
  };
  // ...form JSX using existing Tailwind + Input components
}
```

#### Files to edit

| File | Change |
|---|---|
| `router/index.tsx` | Replace `/login` route: `MockLoginPicker` → `LoginPage`. Add `/forgot-password`, `/reset-password` routes. Remove mock import. |
| `store/index.ts` | Replace `initializeFromMock()` with `initializeFromSession(session)` — fetches real user row + tenant from Supabase. Remove all MOCK_* imports from store. |
| `providers/AppProviders.tsx` | Add `supabase.auth.onAuthStateChange()` listener. On `SIGNED_IN`: call `store.initializeFromSession()`. On `SIGNED_OUT`: call `store.setCurrentUser(null)`. |
| `router/RoleGuard.tsx` | Replace mock user check with: if `isAuthLoading` show spinner; if no `currentUser` redirect to `/login`. |
| `lib/supabase.ts` | Add helper: `getUserProfile(userId)` — queries `users` table joined with `tenants`, returns `User` + `TenantDetailed`. |

#### Supabase dashboard config

1. Enable Email provider in Auth → Providers
2. Set `app.medicom.ma` as Site URL
3. Add redirect URL: `app.medicom.ma/reset-password`
4. Create DB function `get_user_with_tenant(user_id uuid)` returning user + tenant joined
5. Create trigger: `on_auth_user_created` → insert row into `public.users` with `role = 'clinic_admin'` and `tenant_id` from metadata

#### Seed 4 test accounts in Supabase
```sql
-- Run in Supabase SQL editor after applying migrations
INSERT INTO public.users (id, tenant_id, role, first_name, last_name, email)
VALUES
  ('...', 'tenant-id-1', 'doctor',       'Amina',   'Benali', 'amina@demo.medicom.ma'),
  ('...', 'tenant-id-1', 'staff',        'Sarah',   'Benani', 'sarah@demo.medicom.ma'),
  ('...', 'tenant-id-2', 'clinic_admin', 'Hassan',  'Tazi',   'hassan@demo.medicom.ma'),
  ('...', NULL,          'super_admin',  'Sami',    'Admin',  'sami@medicom.ma');
```

**Done when:** `/login` loads a real email/password form. Entering correct credentials redirects to the right dashboard. MockLoginPicker is unreachable.

---

### 0.2 — Database Migrations (010–013)

Apply in order. Each builds on the previous.

#### `OWF/sql/010_landing_pages_schema.sql`

```sql
-- ═══════════════════════════════════════════════
-- 010_landing_pages_schema.sql
-- Depends on: 001_core_schema.sql (tenants)
-- ═══════════════════════════════════════════════

CREATE TYPE public.page_section_type AS ENUM (
  'hero', 'about', 'services', 'doctors',
  'booking', 'testimonials', 'faq', 'contact'
);

CREATE TABLE IF NOT EXISTS public.landing_pages (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug                    text UNIQUE NOT NULL,
  status                  text NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
  seo_title               text,
  seo_description         text,
  og_image                text,
  ga4_id                  text,
  search_console_verified boolean DEFAULT false,
  published_at            timestamptz,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  CONSTRAINT one_page_per_tenant UNIQUE (tenant_id)  -- MVP: 1 page per clinic
);

CREATE TABLE IF NOT EXISTS public.page_sections (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  type            public.page_section_type NOT NULL,
  content         jsonb NOT NULL DEFAULT '{}',
  position        integer NOT NULL DEFAULT 0,
  visible         boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

-- Clinic admin: manage their own page
CREATE POLICY "landing_pages_tenant_rw"
  ON public.landing_pages FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Public (anon): read published pages only
CREATE POLICY "landing_pages_public_read"
  ON public.landing_pages FOR SELECT TO anon
  USING (status = 'published');

CREATE POLICY "page_sections_tenant_rw"
  ON public.page_sections FOR ALL TO authenticated
  USING (
    landing_page_id IN (
      SELECT id FROM public.landing_pages
      WHERE tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    )
  );

CREATE POLICY "page_sections_public_read"
  ON public.page_sections FOR SELECT TO anon
  USING (
    visible = true AND
    landing_page_id IN (
      SELECT id FROM public.landing_pages WHERE status = 'published'
    )
  );

-- Service role full access
CREATE POLICY "service_role_landing_pages" ON public.landing_pages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_page_sections" ON public.page_sections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-update timestamps
CREATE TRIGGER landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER page_sections_updated_at
  BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX idx_landing_pages_tenant ON public.landing_pages (tenant_id);
CREATE INDEX idx_landing_pages_slug ON public.landing_pages (slug) WHERE status = 'published';
CREATE INDEX idx_page_sections_page ON public.page_sections (landing_page_id, position);
```

#### `OWF/sql/011_public_booking_schema.sql`

```sql
-- ═══════════════════════════════════════════════
-- 011_public_booking_schema.sql
-- Depends on: 001_core_schema.sql
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.public_booking_holds (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slot_start       timestamptz NOT NULL,
  slot_end         timestamptz NOT NULL,
  whatsapp_number  text NOT NULL,
  otp_hash         text NOT NULL,       -- bcrypt of 6-digit OTP
  otp_attempts     integer DEFAULT 0,
  expires_at       timestamptz NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.public_booking_holds ENABLE ROW LEVEL SECURITY;
-- Only service_role can read/write holds (accessed via Edge Functions only)
CREATE POLICY "holds_service_role_only" ON public.public_booking_holds
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Cleanup function (called by pg_cron every 10 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds()
RETURNS void LANGUAGE SQL AS $$
  DELETE FROM public.public_booking_holds WHERE expires_at < now();
$$;

-- Slot availability function
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_tenant_id  uuid,
  p_date       date,
  p_doctor_id  uuid DEFAULT NULL
)
RETURNS TABLE (
  slot_start  timestamptz,
  slot_end    timestamptz,
  doctor_id   uuid,
  doctor_name text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slot_duration interval := '30 minutes';
  v_day_start     timestamptz := p_date::timestamptz + '08:00:00'::interval;
  v_day_end       timestamptz := p_date::timestamptz + '18:00:00'::interval;
  v_slot          timestamptz;
BEGIN
  -- Generate all 30-min slots, excluding booked and held
  v_slot := v_day_start;
  WHILE v_slot < v_day_end LOOP
    -- Check not already booked
    IF NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.tenant_id = p_tenant_id
        AND (p_doctor_id IS NULL OR a.doctor_id = p_doctor_id)
        AND a.start_time < (v_slot + v_slot_duration)
        AND a.end_time   > v_slot
        AND a.status NOT IN ('cancelled', 'rescheduled', 'absent')
    )
    -- Check not held by another booking in progress
    AND NOT EXISTS (
      SELECT 1 FROM public.public_booking_holds h
      WHERE h.tenant_id = p_tenant_id
        AND h.slot_start = v_slot
        AND h.expires_at > now()
    )
    THEN
      RETURN QUERY
        SELECT v_slot, v_slot + v_slot_duration,
               COALESCE(p_doctor_id, (
                 SELECT u.id FROM public.users u
                 WHERE u.tenant_id = p_tenant_id AND u.role = 'doctor'
                 LIMIT 1
               )),
               (SELECT u.first_name || ' ' || u.last_name
                FROM public.users u WHERE u.id = COALESCE(p_doctor_id,
                  (SELECT u2.id FROM public.users u2
                   WHERE u2.tenant_id = p_tenant_id AND u2.role = 'doctor'
                   LIMIT 1)));
    END IF;
    v_slot := v_slot + v_slot_duration;
  END LOOP;
END;
$$;
```

#### `OWF/sql/012_whatsapp_messages_schema.sql`

```sql
-- ═══════════════════════════════════════════════
-- 012_whatsapp_messages_schema.sql
-- Depends on: 001_core_schema.sql
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id   uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  direction        text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  template_id      text,
  recipient_number text,
  payload          jsonb NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  twilio_sid       text,
  error_message    text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_tenant_read"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

CREATE POLICY "whatsapp_service_role"
  ON public.whatsapp_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_whatsapp_tenant ON public.whatsapp_messages (tenant_id, created_at DESC);
CREATE INDEX idx_whatsapp_appointment ON public.whatsapp_messages (appointment_id);
```

#### `OWF/sql/013_extend_existing_tables.sql`

```sql
-- ═══════════════════════════════════════════════
-- 013_extend_existing_tables.sql
-- Adds public-booking + landing-page columns to
-- existing core tables. Safe to run on existing data.
-- ═══════════════════════════════════════════════

-- Extend tenants (already has logo_url, address, city, phone)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS public_whatsapp   text,
  ADD COLUMN IF NOT EXISTS google_place_id   text,
  ADD COLUMN IF NOT EXISTS default_language  text DEFAULT 'fr' CHECK (default_language IN ('fr','ar','en')),
  ADD COLUMN IF NOT EXISTS primary_color     text DEFAULT '#2563eb';

-- Extend medical_services (if table exists from settings CRUD)
-- If it doesn't exist yet, create it minimal here
CREATE TABLE IF NOT EXISTS public.medical_services (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,
  duration_min integer DEFAULT 30,
  price_mad    integer,
  price_from_mad integer,
  public_visible boolean DEFAULT false,
  color        text,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.medical_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_tenant_rw" ON public.medical_services
  FOR ALL TO authenticated
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);
CREATE POLICY "services_public_read" ON public.medical_services
  FOR SELECT TO anon USING (public_visible = true);

-- Extend appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source               text DEFAULT 'manual'
    CHECK (source IN ('manual', 'public_booking', 'phone')),
  ADD COLUMN IF NOT EXISTS whatsapp_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_show              boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reschedule_token     text UNIQUE,
  ADD COLUMN IF NOT EXISTS cancel_token         text UNIQUE;

-- Extend patients (email already nullable in schema — verify before running)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS primary_whatsapp_number text,
  ADD COLUMN IF NOT EXISTS source                  text DEFAULT 'manual'
    CHECK (source IN ('manual', 'public_booking', 'phone'));
```

**Done when:** All 4 migrations apply cleanly on a fresh Supabase project without errors.

---

### 0.3 — New Repo: `medicom-public` (Next.js 14)

This is a separate repository. Create it alongside Medicom-V1.

```
medicom-public/
├── app/
│   ├── layout.tsx                     ← Root layout (Inter font, global meta)
│   ├── globals.css
│   ├── [clinic]/
│   │   ├── layout.tsx                 ← Per-clinic layout (theme color injection)
│   │   ├── page.tsx                   ← ISR landing page render (revalidate: 60s)
│   │   ├── not-found.tsx
│   │   └── booking/
│   │       └── page.tsx               ← 3-step booking widget
│   └── api/
│       └── booking/
│           ├── slots/route.ts         ← GET available slots (calls Supabase fn)
│           ├── hold/route.ts          ← POST create hold + send OTP
│           └── confirm/route.ts       ← POST verify OTP → create appointment
├── components/
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── DoctorsSection.tsx
│   │   ├── BookingSection.tsx         ← CTA block linking to /[clinic]/booking
│   │   ├── TestimonialsSection.tsx
│   │   ├── FAQSection.tsx
│   │   └── ContactSection.tsx         ← Google Maps embed + WhatsApp CTA
│   ├── booking/
│   │   ├── BookingShell.tsx           ← Step state machine (1→2→3)
│   │   ├── StepSelectDate.tsx         ← Calendar + time slots grid
│   │   ├── StepOTPVerify.tsx          ← 6-digit OTP + 5-min countdown
│   │   └── StepSuccess.tsx            ← Confirmation card
│   └── LandingPageRenderer.tsx        ← Maps page_sections to section components
├── lib/
│   ├── supabase.ts                    ← SSR client (createServerClient from @supabase/ssr)
│   └── getLandingPage.ts              ← Fetch + shape landing_pages + page_sections
├── types/
│   └── landing.ts                    ← LandingPage, PageSection, PageSectionContent types
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── .env.local.example
```

**`app/[clinic]/page.tsx` core pattern:**
```tsx
import { getLandingPage } from '../../lib/getLandingPage';
import { LandingPageRenderer } from '../../components/LandingPageRenderer';
import { notFound } from 'next/navigation';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function generateMetadata({ params }: { params: { clinic: string } }) {
  const page = await getLandingPage(params.clinic);
  if (!page) return {};
  return {
    title: page.seo_title,
    description: page.seo_description,
    openGraph: { images: [page.og_image] },
  };
}

export default async function ClinicPage({ params }: { params: { clinic: string } }) {
  const page = await getLandingPage(params.clinic);
  if (!page) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'MedicalClinic',
          name: page.clinicName,
          url: `https://medicom.ma/${params.clinic}`,
          // ... address, phone, openingHours from page sections
        })
      }} />
      <LandingPageRenderer page={page} />
    </>
  );
}
```

**Done when:** `medicom.ma/clinic/demo-dentiste` renders a complete page with LCP < 2s on a cold Vercel preview. Google Lighthouse SEO score ≥ 90.

---

### 0.4 — Twilio WhatsApp Setup (Founder action, not code)

1. Create Twilio account → Messaging → WhatsApp Sandbox first (dev), then apply for WhatsApp Business API
2. Connect Meta Business Manager account
3. Submit 4 message templates (French) for Meta approval (5-day SLA — do this Day 1):

| Template name | Body |
|---|---|
| `appointment_confirmation` | `Votre RDV chez {{1}} est confirmé pour le {{2}} à {{3}}. Référence: {{4}}` |
| `appointment_reminder_24h` | `Rappel: vous avez un RDV demain {{1}} à {{2}} chez {{3}}. Répondez ANNULER pour annuler.` |
| `appointment_cancellation` | `Votre RDV chez {{1}} a été annulé. Contactez-nous pour replanifier.` |
| `otp_verification` | `Votre code de confirmation Medicom: {{1}}. Valable 5 minutes. Ne le partagez pas.` |

Store in Supabase secrets:
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+212XXXXXXXXX
```

---

### 0.5 — TypeScript Type Extensions (`types.ts` in Medicom-V1)

Add after existing types (do not remove any existing type — additive only):

```typescript
// ── Landing Page Types ──────────────────────────────────────────

export type PageSectionType =
  | 'hero' | 'about' | 'services' | 'doctors'
  | 'booking' | 'testimonials' | 'faq' | 'contact';

export interface PageSection {
  id: string;
  landing_page_id: string;
  type: PageSectionType;
  content: Record<string, unknown>;
  position: number;
  visible: boolean;
}

export interface LandingPage {
  id: string;
  tenant_id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
  og_image?: string;
  ga4_id?: string;
  search_console_verified: boolean;
  published_at?: string;
  sections: PageSection[];
  created_at: string;
  updated_at: string;
}

// ── Public Booking Types ─────────────────────────────────────────

export interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  doctor_id: string;
  doctor_name: string;
}

export interface BookingHold {
  id: string;
  tenant_id: string;
  slot_start: string;
  slot_end: string;
  whatsapp_number: string;
  expires_at: string;
}

// ── WhatsApp Notification Types ──────────────────────────────────

export interface WhatsAppMessage {
  id: string;
  tenant_id: string;
  appointment_id?: string;
  direction: 'outbound' | 'inbound';
  template_id?: string;
  recipient_number: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  twilio_sid?: string;
  error_message?: string;
  created_at: string;
}

// ── Appointment source extension ─────────────────────────────────
// Extend existing Appointment type — add optional source field
// (Cannot re-declare interface; add to Appointment definition above)
```

Also add `landingPageBuilder: boolean` to `ModuleConfiguration`:
```typescript
export interface ModuleConfiguration {
  // ... existing fields ...
  landingPageBuilder: boolean;  // super_admin only
}
```

---

## Phase 1 — Wedge MVP (Weeks 5–12)

### Sprint 1 (W5–6) — Supabase Edge Functions

#### Create in `supabase/functions/` (Supabase project, not this repo)

**`get-available-slots/index.ts`**
- Accepts: `{ tenant_slug: string, date: string, doctor_id?: string }`
- Resolves tenant_id from slug (public read)
- Calls `get_available_slots()` DB function
- Returns: `AvailableSlot[]`
- Auth: none (public endpoint)

**`create-booking-hold/index.ts`**
- Accepts: `{ tenant_slug, slot_start, slot_end, whatsapp_number, patient_name }`
- Generates 6-digit OTP, bcrypt-hashes it
- Inserts `public_booking_holds` row
- Calls `send-whatsapp` function with `otp_verification` template
- Returns: `{ hold_id: string, expires_at: string }`
- Auth: none (public endpoint, rate-limited by Supabase)

**`verify-booking-otp/index.ts`**
- Accepts: `{ hold_id, otp, patient_name, service_id? }`
- Verifies OTP hash, checks expiry, checks attempts ≤ 3
- On success: creates `appointments` row (source='public_booking'), deletes hold
- Calls `send-whatsapp` with `appointment_confirmation` template
- Returns: `{ appointment_id, slot_start, clinic_name }`
- Auth: none

**`send-whatsapp/index.ts`**
- Accepts: `{ to, template_id, params: string[], appointment_id? }`
- Calls Twilio REST API
- Inserts `whatsapp_messages` row with twilio_sid + status
- Returns: `{ message_sid }`
- Auth: service_role only (called by other edge functions)

**`booking-reminders-cron/index.ts`**
- Triggered by pg_cron: `0 9 * * *` (9am daily)
- Queries appointments WHERE `start_time BETWEEN now()+23h AND now()+25h`
  AND `whatsapp_confirmed_at IS NOT NULL`
  AND `status NOT IN ('cancelled', 'absent')`
- For each: calls `send-whatsapp` with `appointment_reminder_24h` template

#### Create in `lib/api/` (Medicom-V1 repo)

**`lib/api/landingPages.ts`** (new file):
```typescript
import { supabase } from '../supabase';
import type { LandingPage, PageSection } from '../../types';

export async function getLandingPageForTenant(tenantId: string): Promise<LandingPage | null>
export async function updatePageSection(sectionId: string, content: Record<string, unknown>): Promise<void>
export async function reorderSections(landingPageId: string, orderedIds: string[]): Promise<void>
export async function publishPage(landingPageId: string): Promise<void>
export async function unpublishPage(landingPageId: string): Promise<void>
export async function createDefaultPage(tenantId: string, slug: string): Promise<LandingPage>
export async function getAllLandingPages(): Promise<LandingPage[]>  // super_admin only
```

**`lib/notifications/whatsapp.ts`** (new file):
```typescript
// Client-side visibility only — actual sends go through Edge Functions
export async function sendOTP(tenantSlug: string, holdId: string): Promise<void>
export async function getMessageLog(tenantId: string, limit?: number): Promise<WhatsAppMessage[]>
```

**Done when:** Slot availability endpoint returns correct slots for a test date. OTP flow creates a real appointment in Supabase.

---

### Sprint 2 (W7–8) — Next.js Landing Page Render Layer (`medicom-public`)

#### 8 Section Components

Each section gets a typed `content` prop. The JSONB schema for each:

| Section | Content shape |
|---|---|
| `hero` | `{ headline, subheadline, cta_label, background_image_url }` |
| `about` | `{ title, body_html, image_url, founded_year, doctor_count }` |
| `services` | `{ title, items: Array<{ name, description, price_from, icon }>}` |
| `doctors` | `{ title, items: Array<{ name, title, speciality, photo_url, bio }>}` |
| `booking` | `{ title, subtitle, cta_label }` (links to /[clinic]/booking) |
| `testimonials` | `{ title, items: Array<{ author, text, rating, date }>}` |
| `faq` | `{ title, items: Array<{ question, answer }>}` |
| `contact` | `{ title, address, phone, whatsapp, email, google_place_id, hours }` |

#### SEO implementation
- `generateMetadata()` in `app/[clinic]/page.tsx` — title, description, og:image
- `schema.org/MedicalClinic` JSON-LD — name, address, telephone, openingHours
- `app/[clinic]/booking/page.tsx` — `noindex` meta (no value in indexing booking flow)
- `sitemap.ts` in Next.js — auto-generates sitemap.xml from all published landing_pages

#### ISR strategy
```typescript
export const revalidate = 60; // Revalidate every 60 seconds
// On page publish from admin: call Next.js revalidate API endpoint
// POST /api/revalidate?slug=clinic-slug&secret=REVALIDATE_SECRET
```

**Done when:** 2 hand-coded design-partner pages render at `medicom.ma/demo1` and `medicom.ma/demo2`. Lighthouse SEO: 95+. Lighthouse Performance: 90+.

---

### Sprint 3 (W9–10) — Public Booking Widget (`medicom-public`)

#### State machine in `BookingShell.tsx`
```
IDLE → SELECTING_DATE → SELECTING_TIME → ENTERING_PHONE → OTP_PENDING → CONFIRMED
                                           ↑ create-booking-hold edge fn called here
                                                               ↑ verify-booking-otp called here
```

#### `StepSelectDate.tsx`
- Calendar component (react-day-picker or custom Tailwind grid)
- On date select: fetch `/api/booking/slots?tenant=slug&date=YYYY-MM-DD`
- Render available time slots as a grid of buttons
- On slot click: advance to ENTERING_PHONE
- Show no-slots message for fully-booked days

#### `StepOTPVerify.tsx`
- 6-input OTP component (auto-advance on digit)
- Countdown timer from `expires_at` (5 min)
- "Renvoyer le code" button (creates new hold, invalidates old)
- Max 3 attempts, then show "contacter la clinique" fallback

#### `StepSuccess.tsx`
- Confirmation card: clinic name, date, time, doctor
- "Ajouter à Google Agenda" link (generates `calendar.google.com/...` URL)
- "Nous contacter sur WhatsApp" link (`wa.me/...`)

#### Update in Medicom-V1

Edit `features/Dashboard.tsx`:
- Add KPI card: "Réservations en ligne aujourd'hui" (count `source='public_booking'` for today)

Edit `components/CalendarView.tsx`:
- Add visual badge/dot on appointments where `source = 'public_booking'`

Edit `features/WaitingRoom.tsx`:
- Add "Public" tag on patient cards where `source = 'public_booking'`

**Done when:** A full booking can be completed from a mobile browser in under 60 seconds. A real WhatsApp OTP arrives within 10 seconds. The appointment appears in the clinic's CalendarView.

---

### Sprint 4 (W11) — WhatsApp Notifications in Dashboard

#### New file: `features/WhatsAppLog.tsx`

A read-only table showing:
- Sent time, recipient number (masked), template name, status (sent/delivered/failed), appointment link

Mounted as a tab inside `features/Settings.tsx` → new "Notifications" tab.

#### `store/index.ts` — Add notification badge state
```typescript
unreadPublicBookings: number;
incrementPublicBookings: () => void;
clearPublicBookings: () => void;
```

Wire with Supabase realtime subscription in `providers/AppProviders.tsx`:
```typescript
supabase
  .channel('public-bookings')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'appointments',
    filter: `source=eq.public_booking`,
  }, () => store.incrementPublicBookings())
  .subscribe();
```

**Done when:** When a public booking is created, the clinic dashboard shows a notification badge without page refresh within 3 seconds.

---

### Sprint 5 (W12) — Landing Page Section Editor (Medicom-V1 Admin)

#### New feature folder: `features/LandingPageBuilder/`

```
features/LandingPageBuilder/
  index.ts
  LandingPageEditor.tsx      ← Main shell: section list (left) + form (right)
  SectionList.tsx            ← Drag-to-reorder list of 8 section cards
  SectionForm.tsx            ← Dynamic form for any section type
  PublishControls.tsx        ← Draft/Publish/Preview buttons
  SectionTypeIcon.tsx        ← Icon per section type
```

#### `LandingPageEditor.tsx` layout pattern
```tsx
<div className="flex h-full">
  <aside className="w-64 border-r">
    <SectionList sections={page.sections} onReorder={handleReorder} />
  </aside>
  <main className="flex-1 p-6 overflow-auto">
    {activeSection ? (
      <SectionForm section={activeSection} onSave={handleSave} />
    ) : (
      <PageMetaForm page={page} onSave={handleMetaSave} />
    )}
  </main>
  <div className="w-48 border-l p-4">
    <PublishControls page={page} />
  </div>
</div>
```

#### `SectionForm.tsx` — Dynamic fields per section type
```typescript
const SECTION_FIELDS: Record<PageSectionType, FieldConfig[]> = {
  hero: [
    { key: 'headline', label: 'Titre principal', type: 'text', required: true },
    { key: 'subheadline', label: 'Sous-titre', type: 'textarea' },
    { key: 'cta_label', label: 'Bouton CTA', type: 'text' },
    { key: 'background_image_url', label: 'Image de fond', type: 'image' },
  ],
  services: [
    { key: 'items', label: 'Services', type: 'repeater',
      fields: ['name', 'description', 'price_from', 'icon'] },
  ],
  // ... etc for all 8 types
};
```

#### Router changes (`router/index.tsx`)

```typescript
// Add to admin routes (inside RoleGuard for super_admin)
const LandingPageBuilder = React.lazy(() =>
  import('../features/LandingPageBuilder').then(m => ({ default: m.LandingPageEditor }))
);

// Routes:
{ path: 'landing-pages', element: <Lazy><LandingPageBuilder /></Lazy> },
{ path: 'landing-pages/:tenantId', element: <Lazy><LandingPageBuilder /></Lazy> },
```

#### Admin sidebar (`router/AdminLayout.tsx`)
Add nav item between "Cabinets" and "CRM":
```tsx
{ path: '/admin/landing-pages', label: 'Landing Pages', icon: Globe }
```

#### On publish: trigger Next.js ISR revalidation
```typescript
// In publishPage() in lib/api/landingPages.ts:
await fetch(`${process.env.PUBLIC_SITE_URL}/api/revalidate`, {
  method: 'POST',
  headers: { 'x-revalidate-secret': process.env.REVALIDATE_SECRET },
  body: JSON.stringify({ slug: page.slug }),
});
```

**Done when:** Super admin can edit any section of a clinic's page, press Publish, and the public Next.js page updates within 5 seconds.

---

## Phase 2 — Stabilize & Monetize (Weeks 13–20)

### 2.1 — Wire Mock Modules to Supabase

Priority order (wire the ones clinics will notice first):

#### A. Dashboard (`features/Dashboard.tsx`)

Replace all `MOCK_*` imports with custom hooks:

```typescript
// Create: hooks/useDashboardKPIs.ts
export function useDashboardKPIs() {
  // Today's appointments count + status breakdown
  // Patient count (total + new this month)
  // Revenue today (sum invoices.total_amount WHERE DATE(created_at) = today)
  // Active treatments count
  // Waiting room count (appointments WHERE status = 'arrived')
  // Public bookings today (source = 'public_booking')
}
```

Files to edit:
- `features/Dashboard.tsx` — Replace `MOCK_APPOINTMENTS`, `MOCK_PATIENTS`, `MOCK_STATS` with hook
- Remove `import { MOCK_* } from '../constants'` from Dashboard

#### B. Billing (`features/Billing.tsx`)

`lib/api/billing.ts` already exists. Wire the component:
- Replace `MOCK_INVOICES` → `useBillingData()` hook calling `lib/api/billing.ts`
- Replace `MOCK_QUOTES` → quotes from billing API
- Replace `MOCK_EXPENSES` → expenses from billing API
- Add Supabase realtime sub on `invoices` for live paid/pending counts

#### C. Documents (`features/Documents.tsx`)

`lib/api/documents.ts` already exists. Wire:
- Replace `MOCK_DOCUMENTS` → `useDocuments(patientId)` hook
- Implement file upload: `supabase.storage.from('patient-documents').upload(...)`
- Create storage bucket `patient-documents` in Supabase dashboard with RLS

#### D. Lab Orders (`features/LabOrders.tsx`)

`lib/api/labOrders.ts` already exists. Wire:
- Replace `MOCK_LAB_ORDERS`, `MOCK_LAB_CONTACTS` → real API calls
- Lab contacts: read from `lab_contacts` table (tenant-scoped)

#### E. Inventory (`features/Inventory.tsx`)

Create `lib/api/inventory.ts`:
```typescript
export async function getInventoryItems(tenantId: string): Promise<InventoryItem[]>
export async function updateStock(itemId: string, quantity: number): Promise<void>
export async function getLowStockAlerts(tenantId: string): Promise<InventoryItem[]>
```

Requires verifying `inventory_items` table schema — add migration if missing.

#### F. Support (`features/Support.tsx`)

Per PRD recommendation: replace in-app ticket system with WhatsApp redirect.
- Replace `features/Support.tsx` content with a simple card:
  - "Besoin d'aide ? Contactez notre équipe support sur WhatsApp"
  - Button: `wa.me/+212XXXXXXXXX?text=Support Medicom`
  - Link to documentation URL
- This removes the maintenance burden of a full ticketing system

---

### 2.2 — Stripe / CMI Billing Integration

#### New files

**`lib/payments/stripe.ts`**
```typescript
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function createCheckoutSession(tenantId: string, planTier: string): Promise<string>
export async function createBillingPortalSession(customerId: string): Promise<string>
export async function getSubscriptionStatus(customerId: string): Promise<SubscriptionStatus>
```

**`supabase/functions/stripe-webhook/index.ts`**
Handles: `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
On event: updates `tenants.plan_tier`, `tenants.status` in Supabase

**`supabase/functions/create-checkout/index.ts`**
- Accepts: `{ tenant_id, plan_tier }` (authenticated)
- Creates/retrieves Stripe customer
- Creates Stripe Checkout session
- Returns `{ checkout_url }`

#### Plan configuration

```typescript
// constants.ts — add plan pricing
export const PLAN_PRICING = {
  essentiel: { mad: 499, stripe_price_id: 'price_...', features: [...] },
  pro:        { mad: 999, stripe_price_id: 'price_...', features: [...] },
  premium:    { mad: 1499, stripe_price_id: 'price_...', features: [...] },
};
```

#### UI additions

Add `features/Billing/SubscriptionBadge.tsx` — shows current plan + "Upgrade" button.
Wire into `router/AppLayout.tsx` sidebar footer (next to user avatar).

New route: `/app/settings/subscription` → subscription management page.

**DB migration `014_stripe_integration.sql`:**
```sql
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text UNIQUE,
  ADD COLUMN IF NOT EXISTS current_period_end       timestamptz,
  ADD COLUMN IF NOT EXISTS billing_email            text;
```

---

### 2.3 — Email Notifications (SendGrid)

#### New files

**`lib/notifications/email.ts`**
```typescript
// All sends go through Supabase Edge Function
export async function triggerEmail(
  type: 'appointment_confirmation' | 'reminder' | 'welcome' | 'password_reset',
  to: string,
  params: Record<string, string>
): Promise<void>
```

**`supabase/functions/send-email/index.ts`**
- Uses SendGrid API
- Template IDs configured per email type
- Logs to `audit_logs` on send
- Env vars: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`

#### Trigger points
- `create-booking-hold` edge fn: also send confirmation email if patient.email exists
- `booking-reminders-cron`: send email reminder alongside WhatsApp
- Auth: Supabase handles password reset email natively — no custom code needed

---

### 2.4 — Patient Reschedule / Cancel Flow

#### New pages in `medicom-public`

**`app/reschedule/[token]/page.tsx`**
- Fetches appointment by `reschedule_token` (public, no auth)
- Shows current appointment details
- Renders date/time picker (reuses booking slot fetcher)
- On submit: calls `process-reschedule` edge function
- Success: shows new appointment card + sends WhatsApp confirmation

**`app/cancel/[token]/page.tsx`**
- Fetches appointment by `cancel_token`
- Shows appointment details + "Confirmer l'annulation" button
- On confirm: calls `cancel-appointment` edge function
- Updates appointment status → 'cancelled'
- Sends `appointment_cancellation` WhatsApp template

#### New Edge Functions

**`supabase/functions/generate-patient-tokens/index.ts`**
- Called after every appointment creation (public_booking source)
- Generates `uuid` for both reschedule_token and cancel_token
- Updates `appointments` row
- Embeds cancel link in confirmation WhatsApp message

**`supabase/functions/process-reschedule/index.ts`**
- Validates token, checks appointment is future + not already cancelled
- Runs slot availability check for new time
- Updates appointment times
- Sends confirmation WhatsApp

---

### 2.5 — Calendar BUG-001 Fix (Midnight Drag)

**File:** `components/CalendarView.tsx`

**Root cause:** When dragging across midnight, date arithmetic using `Date` object arithmetic or `addMinutes()`/`addHours()` can produce incorrect results when the drag delta causes a timezone boundary crossing.

**Fix approach:** Reconstruct the new start time from the *drop cell's explicit date + time*, never from arithmetic on the original start time:

```typescript
// Find in CalendarView.tsx — the drag-end / drop handler
// Current (broken) pattern likely looks like:
const newStart = new Date(appointment.start.getTime() + deltaMs);

// Replace with explicit reconstruction from the drop target cell:
function buildNewStartFromDropTarget(
  dropTargetDate: Date,    // The calendar cell's date
  dropTargetHour: number,  // The cell's hour
  dropTargetMinute: number // The cell's minute
): Date {
  // Construct purely from components, no arithmetic
  return new Date(
    dropTargetDate.getFullYear(),
    dropTargetDate.getMonth(),
    dropTargetDate.getDate(),
    dropTargetHour,
    dropTargetMinute,
    0,
    0
  );
}
```

Also add test: `lib/__tests__/calendar-midnight-drag.test.ts`
```typescript
it('preserves correct date when dragging appointment across midnight', () => {
  const dec31 = new Date(2026, 11, 31, 23, 30); // Dec 31 23:30
  const jan1Cell = new Date(2027, 0, 1);          // Jan 1 (drop target)
  const result = buildNewStartFromDropTarget(jan1Cell, 0, 0);
  expect(result.getDate()).toBe(1);
  expect(result.getMonth()).toBe(0);
  expect(result.getFullYear()).toBe(2027);
});
```

---

### 2.6 — Module Feature Flag Enforcement

**File:** `constants.ts` — Update `MODULE_CONFIGURATIONS` per plan tier:

```typescript
export const MODULE_CONFIGURATIONS: Record<string, ModuleConfiguration> = {
  essentiel: {
    dashboard: true,
    calendar: true,
    patients: true,
    treatments: false,      // Pro+
    inventory: false,       // Pro+
    labOrders: false,       // Premium only
    documents: false,       // Pro+
    records: true,
    billing: true,
    reports: false,         // Pro+
    support: true,
    landingPageBuilder: false,
  },
  pro: {
    dashboard: true,
    calendar: true,
    patients: true,
    treatments: true,
    inventory: true,
    labOrders: false,       // Premium only
    documents: true,
    records: true,
    billing: true,
    reports: true,
    support: true,
    landingPageBuilder: false,
  },
  premium: {
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
    landingPageBuilder: false,  // Super admin only
  },
};
```

**File:** `router/AppLayout.tsx` — Sidebar already has module config. Verify it reads `currentUser.enabledModules` and hides locked items. Add a "lock" icon with upgrade CTA for disabled modules instead of removing them (better UX for conversion).

---

## Phase 3 — AI & Growth (Weeks 21–36)

### 3.1 — AI Landing Page Generator

**New file:** `features/LandingPageBuilder/AIGenerator.tsx`

Intake form (5 questions):
1. Nom de la clinique + spécialité
2. Ville + quartier
3. Services principaux (multi-select from medical_services)
4. Médecin principal (nom + titre + années d'expérience)
5. Argument différenciateur (texte libre, ex: "Seule clinique avec CBCT à Agdal")

On submit: calls new edge function `generate-landing-page`.

**`supabase/functions/generate-landing-page/index.ts`**
```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

const response = await client.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 4000,
  system: `Tu es un expert en marketing médical au Maroc.
    Génère le contenu JSON pour une page de destination de clinique dentaire.
    Réponds uniquement avec un objet JSON valide contenant les 8 sections.
    Le contenu doit être en français, professionnel et optimisé pour le SEO local.`,
  messages: [{
    role: 'user',
    content: `Génère une landing page pour: ${JSON.stringify(intake)}`
  }]
});

// Parse JSON response → create page_sections rows in Supabase
```

Response shape: `{ hero: {...}, about: {...}, services: {...}, ... }` — each key maps to a `page_sections.content` JSONB.

**UI flow in `LandingPageEditor.tsx`:**
- "Générer avec l'IA" button in toolbar
- Opens `AIGenerator.tsx` modal
- On generation complete: sections auto-fill in the editor
- Super admin reviews → edits → publishes

### 3.2 — AI Booking Chatbot

**New file in `medicom-public`:** `components/BookingChatbot.tsx`

- Floating chat widget on landing pages
- Handles: "quels sont vos tarifs?", "avez-vous de la disponibilité mardi?", "acceptez-vous la CNSS?"
- Backed by `claude-haiku-4-5-20251001` (cost-efficient, fast)
- Escalation: "Je préfère vous mettre en contact avec la clinique" → opens WhatsApp link
- Context: receives clinic's published `landing_pages` + `page_sections` content as system prompt

**New edge function:** `supabase/functions/chat/index.ts`
```typescript
// Streaming response for real-time feel
const stream = await client.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 500,
  stream: true,
  system: `Tu es l'assistant virtuel de ${clinicName}, une clinique ${specialty} à ${city}.
    Réponds aux questions des patients sur les soins, tarifs et rendez-vous.
    Informations de la clinique: ${JSON.stringify(clinicData)}
    Si tu ne sais pas, dirige vers WhatsApp: ${whatsappNumber}`,
  messages: conversationHistory,
});
```

### 3.3 — Predictive No-Show Scoring

**New file:** `lib/api/noShow.ts`

```typescript
interface NoShowRisk {
  score: number;     // 0-100
  level: 'low' | 'medium' | 'high';
  factors: string[]; // Human-readable reasons
}

export async function getNoShowRisk(appointmentId: string): Promise<NoShowRisk>
```

**Score formula (weighted):**
| Factor | Weight | Signal |
|---|---|---|
| Patient's past no-show rate | 40% | `COUNT(no_show=true) / COUNT(*)` for this patient |
| Booking source | 15% | public_booking = +15 risk (anonymous bookers no-show more) |
| Days since booking | 15% | Same-day = low risk; >7 days = high risk |
| Appointment type | 15% | Urgency = low risk; Contrôle = higher risk |
| WhatsApp confirmed | 15% | No confirmation = +15 risk |

**Display in `components/CalendarView.tsx`:**
- Red dot on high-risk appointments (score > 70)
- Tooltip: "Risque d'absence élevé — reminder envoyé"

**New edge function:** `supabase/functions/calculate-noshows/index.ts`
- Runs daily via pg_cron: `0 7 * * *`
- Updates a `no_show_score` column on `appointments`
- Triggers extra WhatsApp reminder for high-risk appointments the day-of

**DB migration `015_noshows.sql`:**
```sql
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS no_show_score integer DEFAULT 0;
CREATE INDEX idx_appointments_noshows ON public.appointments (no_show_score, start_time)
  WHERE status NOT IN ('cancelled', 'completed', 'absent');
```

### 3.4 — AI SEO Optimizer

**New tab in `features/Settings.tsx`:** "SEO & Référencement"

Features:
- Keyword analysis: "Mots-clés pour 'dentiste [ville]'" — shows search volume estimates
- Current page SEO audit: scores title, meta description, heading structure, content length
- AI suggestions: calls `generate-seo-suggestions` edge function

**New edge function:** `supabase/functions/generate-seo-suggestions/index.ts`
```typescript
// Analyzes current page content, returns actionable improvements
const suggestions = await client.messages.create({
  model: 'claude-sonnet-4-6',
  system: 'Tu es un expert SEO local pour cliniques médicales au Maroc.',
  messages: [{
    role: 'user',
    content: `Analyse cette page et donne 5 améliorations SEO concrètes:
      Titre: ${page.seo_title}
      Description: ${page.seo_description}
      Contenu sections: ${JSON.stringify(page.sections)}
      Mots-clés cibles: dentiste ${city}, clinique dentaire ${city}`
  }]
});
```

One-click apply: each suggestion has an "Appliquer" button that patches the relevant `page_sections.content` field.

---

## Complete File Change Index

### Medicom-V1 repo — Files to CREATE

| File | Phase | Purpose |
|---|---|---|
| `features/Auth/LoginPage.tsx` | 0.1 | Real auth sign-in |
| `features/Auth/ForgotPasswordPage.tsx` | 0.1 | Password reset trigger |
| `features/Auth/ResetPasswordPage.tsx` | 0.1 | New password (magic link) |
| `features/Auth/SignupPage.tsx` | 0.1 | Clinic self-registration stub |
| `features/Auth/index.ts` | 0.1 | Re-exports |
| `features/LandingPageBuilder/LandingPageEditor.tsx` | 1.5 | Admin page editor shell |
| `features/LandingPageBuilder/SectionList.tsx` | 1.5 | Section reorder list |
| `features/LandingPageBuilder/SectionForm.tsx` | 1.5 | Dynamic section editor |
| `features/LandingPageBuilder/PublishControls.tsx` | 1.5 | Draft/Publish/Preview |
| `features/LandingPageBuilder/AIGenerator.tsx` | 3.1 | AI page generator modal |
| `features/LandingPageBuilder/index.ts` | 1.5 | Re-exports |
| `features/WhatsAppLog.tsx` | 1.4 | Message log table |
| `lib/api/landingPages.ts` | 1.1 | Landing page CRUD |
| `lib/api/inventory.ts` | 2.1E | Inventory CRUD |
| `lib/notifications/whatsapp.ts` | 1.1 | WhatsApp helpers |
| `lib/notifications/email.ts` | 2.3 | Email trigger wrapper |
| `lib/payments/stripe.ts` | 2.2 | Stripe client |
| `lib/payments/cmi.ts` | 2.2 | CMI gateway client |
| `lib/api/noShow.ts` | 3.3 | No-show scoring |
| `hooks/useDashboardKPIs.ts` | 2.1A | Real dashboard data |
| `hooks/useBillingData.ts` | 2.1B | Real billing data |
| `OWF/sql/010_landing_pages_schema.sql` | 0.2 | Landing pages tables |
| `OWF/sql/011_public_booking_schema.sql` | 0.2 | Booking holds + slots fn |
| `OWF/sql/012_whatsapp_messages_schema.sql` | 0.2 | WhatsApp log table |
| `OWF/sql/013_extend_existing_tables.sql` | 0.2 | Extend core tables |
| `OWF/sql/014_stripe_integration.sql` | 2.2 | Stripe columns on tenants |
| `OWF/sql/015_noshows.sql` | 3.3 | No-show score column |
| `lib/__tests__/calendar-midnight-drag.test.ts` | 2.5 | BUG-001 regression test |

### Medicom-V1 repo — Files to EDIT

| File | Phase | Change |
|---|---|---|
| `types.ts` | 0.5 | Add LandingPage, PageSection, BookingHold, WhatsAppMessage, AvailableSlot types; add `landingPageBuilder` to ModuleConfiguration |
| `router/index.tsx` | 0.1, 1.5 | Replace MockLoginPicker route; add Auth routes; add admin landing-page routes |
| `router/RoleGuard.tsx` | 0.1 | Replace mock user check with Supabase session |
| `router/AppLayout.tsx` | 2.6 | Lock sidebar items per plan; add upgrade CTA |
| `router/AdminLayout.tsx` | 1.5 | Add "Landing Pages" nav item |
| `store/index.ts` | 0.1 | Replace `initializeFromMock` with `initializeFromSession`; add unread booking badge state |
| `providers/AppProviders.tsx` | 0.1, 1.4 | Add `onAuthStateChange` listener; add realtime subscription for public bookings |
| `lib/supabase.ts` | 0.1 | Add `getUserProfile()` helper |
| `constants.ts` | 2.6 | Update MODULE_CONFIGURATIONS for Essentiel/Pro/Premium; add PLAN_PRICING |
| `features/Dashboard.tsx` | 2.1A | Replace all MOCK_* with real Supabase hooks; add public bookings KPI |
| `features/Billing.tsx` | 2.1B | Wire to `lib/api/billing.ts`; replace all MOCK_* |
| `features/Documents.tsx` | 2.1C | Wire to `lib/api/documents.ts`; implement storage upload |
| `features/LabOrders.tsx` | 2.1D | Wire to `lib/api/labOrders.ts`; replace MOCK_* |
| `features/Inventory.tsx` | 2.1E | Wire to new `lib/api/inventory.ts`; replace MOCK_* |
| `features/Support.tsx` | 2.1F | Replace with WhatsApp redirect card |
| `features/Settings.tsx` | 1.4, 3.4 | Add "Notifications" tab (WhatsApp log); add "SEO" tab (Phase 3) |
| `components/CalendarView.tsx` | 1.3, 2.5 | Add public-booking badge; fix midnight drag BUG-001 |
| `features/WaitingRoom.tsx` | 1.3 | Add "Public" tag on public-booking patients |

### `medicom-public` repo — Files to CREATE (all new)

```
app/layout.tsx
app/globals.css
app/[clinic]/layout.tsx
app/[clinic]/page.tsx
app/[clinic]/not-found.tsx
app/[clinic]/booking/page.tsx
app/cancel/[token]/page.tsx
app/reschedule/[token]/page.tsx
app/sitemap.ts
app/api/booking/slots/route.ts
app/api/booking/hold/route.ts
app/api/booking/confirm/route.ts
app/api/revalidate/route.ts
components/LandingPageRenderer.tsx
components/sections/HeroSection.tsx
components/sections/AboutSection.tsx
components/sections/ServicesSection.tsx
components/sections/DoctorsSection.tsx
components/sections/BookingSection.tsx
components/sections/TestimonialsSection.tsx
components/sections/FAQSection.tsx
components/sections/ContactSection.tsx
components/booking/BookingShell.tsx
components/booking/StepSelectDate.tsx
components/booking/StepOTPVerify.tsx
components/booking/StepSuccess.tsx
components/BookingChatbot.tsx             ← Phase 3.2
lib/supabase.ts
lib/getLandingPage.ts
types/landing.ts
next.config.ts
tailwind.config.ts
package.json
.env.local.example
```

### Supabase Edge Functions to CREATE

```
supabase/functions/get-available-slots/index.ts     ← Sprint 1
supabase/functions/create-booking-hold/index.ts     ← Sprint 1
supabase/functions/verify-booking-otp/index.ts      ← Sprint 1
supabase/functions/send-whatsapp/index.ts           ← Sprint 1
supabase/functions/booking-reminders-cron/index.ts  ← Sprint 4
supabase/functions/generate-patient-tokens/index.ts ← Phase 2.4
supabase/functions/process-reschedule/index.ts      ← Phase 2.4
supabase/functions/cancel-appointment/index.ts      ← Phase 2.4
supabase/functions/stripe-webhook/index.ts          ← Phase 2.2
supabase/functions/create-checkout/index.ts         ← Phase 2.2
supabase/functions/send-email/index.ts              ← Phase 2.3
supabase/functions/generate-landing-page/index.ts   ← Phase 3.1
supabase/functions/chat/index.ts                    ← Phase 3.2
supabase/functions/calculate-noshows/index.ts       ← Phase 3.3
supabase/functions/generate-seo-suggestions/index.ts ← Phase 3.4
```

---

## Dependency Map (Critical Path)

```
0.4 Twilio templates         ← START DAY 1 (5-day SLA)
  ↓
0.2 DB migrations (010–013)  ← Start Day 2
  ↓
0.1 Real Supabase Auth       ← Depends on 0.2 (users table confirmed)
  ↓
Sprint 1 Edge Functions      ← Depends on 0.2 (tables exist) + 0.4 (Twilio active)
  ↓
Sprint 2 Next.js public site ← Depends on 0.2 (landing_pages readable)
Sprint 3 Booking widget      ← Depends on Sprint 1 (edge functions live)
  ↓
Sprint 4 Dashboard badges    ← Depends on Sprint 3 (public bookings exist in DB)
Sprint 5 Admin editor        ← Depends on Sprint 2 (know what to edit)
  ↓
Phase 2 mock→Supabase wire   ← Depends on 0.1 (real auth → real tenant_id in JWT)
Phase 2 Stripe               ← Depends on 0.1 (real auth)
  ↓
Phase 3 AI features          ← Depends on Phase 1 (landing pages exist to optimize)
```

---

## North Star Metric Tracking

| Phase | Target PAPCPM | Revenue proxy |
|---|---|---|
| Phase 0 complete | Baseline established | 0 paying |
| Phase 1 complete | ≥ 5 | 5 design partners live |
| Phase 2 complete | ≥ 15 | 75 paying clinics |
| Phase 3 complete | ≥ 25 | 200 paying clinics, MRR ≥ 250k MAD |

PAPCPM = Paid Appointments Per Clinic Per Month (from public booking widget)

Track in SuperAdminDashboard: add chart showing PAPCPM per clinic over time from `appointments WHERE source = 'public_booking'`.

---

## Environment Variables Checklist

### Medicom-V1 (`.env.local`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_SERVICE_ROLE_KEY=   # Never commit, Edge Functions only
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
VITE_PUBLIC_SITE_URL=https://medicom.ma
VITE_REVALIDATE_SECRET=           # Shared with medicom-public
```

### medicom-public (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # For API routes only
REVALIDATE_SECRET=
NEXT_PUBLIC_APP_URL=https://app.medicom.ma
```

### Supabase Edge Function secrets
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
ANTHROPIC_API_KEY=
REVALIDATE_SECRET=
PUBLIC_SITE_URL=https://medicom.ma
```

---

*End of MEDICOM_V2_PLAN.md — v1.0*
