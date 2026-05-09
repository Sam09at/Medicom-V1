# MEDICOM_AUDIT.md — Phase 0 Audit Report

> Generated: 2026-05-09  
> Auditor: Claude Sonnet 4.6  
> Scope: Full codebase — routes, schema, stores, auth, gaps

---

## 1. Static vs. Connected Map

### /app Routes (Doctor / Staff / Clinic Admin)

| Route | Status | Notes |
|---|---|---|
| `/app/dashboard` | ⚠️ Partial | KPI cards real (Supabase). Revenue chart = **hardcoded fake data**. Pie chart = hardcoded. Tasks widget = in-memory RAM only (resets on reload). |
| `/app/calendar` | ⚠️ Partial | `useAppointments` reads from Supabase + Realtime subscription. `createAppointment` writes. BUT status mapping (EN→FR) is not applied on the insert (raw enum strings sent to DB). |
| `/app/patients` | ⚠️ Partial | `usePatients` → `getPatients` reads from Supabase (with mock fallback). CRUD writes work. BUT **no Realtime subscription** — add patient on device A, device B needs manual refresh. `tenantId` sourced from `currentTenant.id` which requires tenant to be loaded. |
| `/app/patients/:id` | ⚠️ Partial | `PatientDetail` fetches patient + treatment plans + consultations from Supabase. Writes work. |
| `/app/treatments` | ⚠️ Partial | `useTreatments` → reads/writes `treatment_plans` + `treatment_sessions`. **Critical bug**: 005 schema uses TEXT FKs referencing UUID PKs — every insert will throw a FK type error in production. |
| `/app/consultation/:appointmentId` | ⚠️ Partial | `ConsultationPage` reads appointment + patient from Supabase. The consultation creation itself (via `useConsultationLogic`) also writes. |
| `/app/consultations` | ❌ Static | Static placeholder page only — "Start from calendar or waiting room." No data. |
| `/app/records` | ❌ Static | MedicalRecord component is a UI shell with no Supabase queries. |
| `/app/inventory` | ⚠️ Partial | `useInventory` → reads/writes `inventory_items` from Supabase. Falls back to mock. No Realtime. |
| `/app/lab-orders` | ❌ Static | `lib/api/labOrders.ts` exists but the component renders mock data. |
| `/app/documents` | ❌ Static | `lib/api/documents.ts` exists but the component uses mock data; Supabase Storage not wired. |
| `/app/billing` | ⚠️ Partial | `useBilling` reads invoices/payments/expenses from Supabase. Writes work. **Critical bug**: billing tables (006) use TEXT FKs referencing UUID PKs — FK constraints will error. |
| `/app/reports` | ❌ Static | Renders hardcoded chart data only. |
| `/app/waiting-room` | ⚠️ Partial | `useWaitingRoom` reads today's `waiting_room`/`in_progress` appointments from Supabase. Status updates write. |
| `/app/support` | ⚠️ Partial | `lib/api/support.ts` exists with full CRUD. `useSupport` hook wired. Read/write functional. |
| `/app/settings/*` | ⚠️ Partial | Profile reads from Supabase user. Clinic settings write partially. WhatsApp/notification settings are static. |

### /admin Routes (Super Admin)

| Route | Status | Notes |
|---|---|---|
| `/admin/dashboard` | ❌ Static | `SuperAdminDashboard` renders KPI cards from hardcoded arrays. No Supabase queries. |
| `/admin/cabinets` | ⚠️ Partial | `lib/api/saas/tenants.ts` has queries. `Cabinets` component wired to read tenants. Edit/invite flows incomplete. |
| `/admin/landing-pages` | ⚠️ Partial | LandingPageList reads from Supabase. Editor writes `tenant_landing_pages`. AI generation uses Edge Function. |
| `/admin/crm` | ⚠️ Partial | `lib/api/saas/crm.ts` exists with leads CRUD. CRM component queries Supabase leads. |
| `/admin/administration` | ❌ Static | `SaaSAdministration` is entirely static — audit logs, API metrics, etc. all hardcoded. |
| `/admin/reports` | ❌ Static | Same hardcoded data as `/app/reports`. |
| `/admin/support` | ⚠️ Partial | Shared with clinic support — Supabase backed. Super admin sees all tickets. |
| `/admin/messaging` | ⚠️ Partial | Messaging component has Slack-style UI. `lib/api/whatsapp.ts` exists. |
| `/admin/settings` | ⚠️ Partial | Partially wired. |

### Public / Auth Routes

| Route | Status | Notes |
|---|---|---|
| `/login` | ✅ Connected | `signIn` → `supabase.auth.signInWithPassword` → `fetchProfileForUserId` → populates Zustand. Mock-login picker for dev mode. |
| `/forgot-password` | ✅ Connected | Calls `supabase.auth.resetPasswordForEmail`. |
| `/reset-password` | ✅ Connected | Calls `supabase.auth.updateUser`. |
| `/c/:slug` | ⚠️ Partial | Reads published landing page from Supabase. Booking widget reads slots via Edge Function. |
| `/builder/:tenantId` | ⚠️ Partial | Full page builder reads/writes `tenant_landing_pages` + sections. |
| `/portal/*` | ❌ Placeholder | Renders "À venir — Phase 10". No patient portal exists. |

---

## 2. Existing Supabase Schema

> **Warning**: The migration files are split across two locations:
> - `/supabase/migrations/` — **1 file only** (`20260218_security_cleanup.sql`)
> - `/OWF/sql/` — **22 files** that appear to be design-time SQL, not formally migrated
>
> It is unknown which OWF files have been applied to the remote DB. Treat everything below as "intended schema"; actual DB state may differ.

### Core Tables

| Table | PK Type | tenant_id Type | RLS | Notes |
|---|---|---|---|---|
| `public.tenants` | uuid | — | ✅ JWT-based | `stripe_customer_id`, `slug`, `billing_email` added in later migrations |
| `public.users` | uuid (ref auth.users) | uuid | ✅ JWT-based | `updated_at` trigger added in 020. Trigger auto-creates row on signup (013). |
| `public.patients` | uuid | uuid | ✅ JWT-based | Unique phone per tenant. `created_by` FK → users. |
| `public.appointments` | uuid | uuid | ✅ JWT-based | EXCLUDE constraint (btree_gist). `reschedule_token`, `cancel_token`, `no_show_score` added in 022. |
| `public.audit_logs` | uuid | uuid | ✅ JWT-based | Immutable via trigger (020). |

### Clinical Tables

| Table | PK | tenant_id FK type | RLS | Notes |
|---|---|---|---|---|
| `public.consultations` | uuid | uuid | ⚠️ Subquery | 4 separate policies (SELECT/INSERT/UPDATE/DELETE). Slow. |
| `public.prescriptions` | uuid | uuid | ⚠️ Subquery | Same pattern as consultations. |

### Treatment Tables ⚠️ Type Mismatch Bug

| Table | PK | tenant_id declared as | patient_id declared as | RLS |
|---|---|---|---|---|
| `public.treatment_plans` | uuid | **TEXT** (should be uuid) | **TEXT** (should be uuid) | ⚠️ Subquery |
| `public.treatment_sessions` | uuid | **TEXT** (should be uuid) | — | ⚠️ Subquery |

**Impact**: `INSERT` into `treatment_plans` or `treatment_sessions` will fail with FK type violation unless the DB accepted TEXT referencing UUID (Postgres typically does not; depends on implicit casts).

### Billing Tables ⚠️ Type Mismatch Bug

| Table | tenant_id | patient_id | created_by | RLS |
|---|---|---|---|---|
| `public.invoices` | **TEXT** | **TEXT** | **TEXT** | ⚠️ Subquery |
| `public.invoice_items` | **TEXT** | — | — | ⚠️ Subquery |
| `public.payments` | **TEXT** | **TEXT** | — | ⚠️ Subquery |
| `public.quotes` | **TEXT** | **TEXT** | **TEXT** | ⚠️ Subquery |
| `public.expenses` | **TEXT** | — | **TEXT** | ⚠️ Subquery |

**Impact**: All billing writes will fail if `tenants.id`, `patients.id`, `users.id` are UUID columns — Postgres cannot implicitly cast UUID to TEXT in FK checks.

### SaaS / Ops Tables

| Table | RLS | Notes |
|---|---|---|
| `public.subscriptions` | ✅ JWT-based | Super admin ALL, tenant SELECT own |
| `public.tenant_usage` | ✅ JWT-based | Append-only usage metrics |
| `public.leads` | ✅ JWT (super_admin) | SaaS CRM prospects |
| `public.lead_activities` | ✅ JWT (super_admin) | Lead interaction timeline |

### Booking / Landing Tables

| Table | RLS | Notes |
|---|---|---|
| `public.tenant_landing_pages` | ✅ JWT-based + anon read | 1 row per clinic |
| `public.booking_requests` | ✅ anon INSERT, authenticated CRUD | No auth required to insert |
| `public.booking_holds` | ✅ (016 migration) | Temp holds for slot reservation |

### Communication / Ops Tables

| Table | RLS | Notes |
|---|---|---|
| `public.whatsapp_messages` | ✅ JWT tenant-read | service_role writes only |
| `public.support_tickets` | ✅ JWT | Tenants see own; super_admin sees all |
| `public.support_ticket_messages` | ✅ JWT | Threaded messages |
| `public.inventory_items` | ✅ JWT-based | Simple tenant-scoped CRUD |

### Missing Tables (Required by Phase 1)

| Needed | Why |
|---|---|
| `public.clinic_members` | Role-per-user-per-clinic (owner/admin/doctor/receptionist). Current model: one flat `role` column on `users`. |
| `public.services` | `appointments.service_id` references it but the table is never defined in any SQL file. |
| `public.documents` / `patient_documents` | Documents feature references `documents` table but schema never created. |
| `public.lab_orders` / `lab_contacts` | Lab orders module references these; schema not found. |

### Duplicate Supabase Client (Bug)

Two files both export `supabase`:
- `lib/supabase.ts` — exports `supabase: SupabaseClient | null` + `isSupabaseConfigured` + helpers
- `lib/supabaseClient.ts` — exports `supabase` (non-nullable type, same init logic)

Different parts of the codebase import from different files. **Always use `lib/supabase.ts`** — it is the authoritative one with the `isSupabaseConfigured` guard. `lib/supabaseClient.ts` is dead code.

---

## 3. Zustand Stores

**There is one global store: `useMedicomStore`** (`store/index.ts`).

### What it holds

| Slice | Type | Persistent? | Syncs to DB? |
|---|---|---|---|
| `currentUser` | `User \| null` | ❌ RAM | On login via `fetchCurrentUserProfile` |
| `currentTenant` | `TenantDetailed \| null` | ❌ RAM | On login via `fetchProfileForUserId` |
| `isAuthLoading` | `boolean` | ❌ RAM | N/A |
| `toasts` | `ToastMessage[]` | ❌ RAM | N/A |
| `isSidebarCollapsed` | `boolean` | ❌ RAM | ❌ Not saved to localStorage |
| `waitingRoomFilter` | `WaitingRoomFilter` | ❌ RAM | N/A |
| `unreadPublicBookings` | `number` | ❌ RAM | N/A |

### What is NOT in the store (by design)

- Patients → live in `usePatients` hook-local state
- Appointments → live in `useAppointments` hook-local state
- Invoices → live in `useBilling` hook-local state
- Inventory → live in `useInventory` hook-local state
- Treatment plans → live in `useTreatments` hook-local state

**This is correct for the DB-as-source-of-truth model**, but it means:
- Multiple components that need the same data each make independent fetches
- There is no cache-invalidation mechanism — a write in one component doesn't update another component's list without Realtime or a shared subscription

### Dev-only mock initialization

`initializeFromMock(role)` populates `currentUser` + `currentTenant` from hardcoded constants. This was meant to be removed in "Phase 14" per the comment in the store. It remains active and is the only way to use the app without Supabase configured.

---

## 4. Auth Flow

### Happy path (Supabase configured)

```
User visits / → RootRedirect
  → isAuthLoading = true → spinner shown
  → AppProviders.useEffect() fires
    → fetchCurrentUserProfile()
      → supabase.auth.getSession() (localStorage read, no network)
      → if session: supabase.from('users').select().eq('id', userId)
      → if tenant_id on user row: supabase.from('tenants').select().eq('id', tenantId)
      → setCurrentUser() + setCurrentTenant()
    → setAuthLoading(false)
  → RootRedirect re-renders
    → user.role === 'super_admin' → /admin/dashboard
    → else → /app/dashboard
```

### RLS policy mechanism

Most core tables use JWT-based isolation:
```sql
USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
```

**Critical gap**: This `tenant_id` in the JWT comes from `raw_user_meta_data` set at **signup time**. It is **not refreshed** when `public.users.tenant_id` changes. A user's token retains the original tenant_id until they log out and back in. If no metadata was set at signup (e.g., a user created via Supabase dashboard without metadata), `auth.jwt() -> 'user_metadata' ->> 'tenant_id'` returns `NULL`, and the RLS condition evaluates to `NULL = NULL` → `false` → **user sees zero rows silently**.

### Token sync trigger (013_auth_profile_sync.sql)

A `BEFORE INSERT` trigger on `auth.users` auto-creates a `public.users` row from `raw_user_meta_data`. This handles the profile-creation step but does NOT update the JWT claims — those require Supabase's `supabase_auth_admin` API or a custom auth hook.

### Role guard

`RoleGuard` checks `currentUser.role` (sourced from `public.users.role`), not the JWT role. This is correct — but it means the RLS (which uses JWT metadata role) and the frontend guard (which uses DB role) can be out of sync if the user's role is updated in the DB without re-login.

### Migration conflict (active risk)

- `20260218_security_cleanup.sql` (the **only formally applied migration**) adds:
  - A `valid_tenant_roles` CHECK constraint blocking `super_admin` and `patient` roles in `public.users`
  - System-B subquery RLS policies referencing a `medicom_staff` table that doesn't exist
- `020_security_fixes.sql` (in OWF, not formally migrated) drops both
- **If 020 has not been applied in production**, the DB currently blocks `super_admin` user creation and has broken RLS referencing a nonexistent table

---

## 5. Top 10 Bugs / Gaps (Ranked by Daily Usability Impact)

### #1 — JWT missing `tenant_id` → doctor sees empty app (**CRITICAL**)

**Impact**: If any user was created without `tenant_id` in `raw_user_meta_data`, ALL RLS policies on `patients`, `appointments`, etc. silently return zero rows. The doctor sees an empty patient list and empty calendar — identical to a new clinic with no data.

**Root cause**: `auth.jwt() -> 'user_metadata' ->> 'tenant_id'` returns NULL → RLS condition is false.

**Fix**: Either use a Supabase Auth Hook to inject `tenant_id` into the JWT on each session, or change RLS policies to use the DB lookup pattern (with caching to avoid N+1).

---

### #2 — Billing + Treatment tables have TEXT foreign keys (FK type mismatch) (**CRITICAL**)

**Impact**: Any attempt to create an invoice, treatment plan, or treatment session in production will fail with a PostgreSQL FK violation if those FKs are type TEXT referencing UUID columns.

**Root cause**: `005_treatments_schema.sql` and `006_billing_schema.sql` declare `tenant_id TEXT`, `patient_id TEXT`, `doctor_id TEXT` while the referenced tables use `uuid` PKs.

**Fix**: Migrations to `ALTER TABLE ... ALTER COLUMN ... TYPE uuid USING ...::uuid` on all affected columns.

---

### #3 — Dashboard revenue chart is hardcoded static data

**Impact**: The main revenue visualization every doctor and admin sees every day shows completely fabricated numbers. A doctor cannot trust any financial insight from the dashboard.

**Root cause**: `const dataRevenue = [...]` constant in `Dashboard.tsx` with 12 months of invented numbers. `useDashboardKPIs` only provides the 4 KPI cards, not the chart data.

**Fix**: Replace `dataRevenue` with a real query grouping `payments.amount` by month for the last 12 months.

---

### #4 — No Realtime on patient list → add patient, colleague doesn't see it

**Impact**: Core daily workflow failure. Receptionist adds a patient → doctor in same clinic must manually refresh to see them. Kills the "live shared workspace" promise.

**Root cause**: `usePatients` has no `supabase.channel()` subscription. It fetches on mount and after mutations (refetch), but external changes are invisible.

**Fix**: Add Realtime subscription in `usePatients` filtering `tenant_id=eq.${tenantId}`.

---

### #5 — Tasks widget resets on every page refresh (in-memory only)

**Impact**: Doctor sets "Call lab" task, refreshes the dashboard → task gone. High frustration for daily users. A doctor in Morocco will quickly notice this in the first day of use.

**Root cause**: Tasks are initialized from `MOCK_TASKS` constant and live only in `useState`. There is no table, no persistence, no API.

**Fix**: Either persist to localStorage (acceptable for personal tasks) or create a `tasks` table.

---

### #6 — `clinic_members` table doesn't exist → role enforcement is incomplete

**Impact**: The prompt's Phase 1.4 requirements (invite codes, owner/admin/doctor/receptionist roles, delete-only-for-admin) cannot be built without this. Currently `public.users.role` is a flat enum — a doctor can't be in two clinics, there's no "invite" concept.

**Root cause**: Schema was never designed for multi-membership. `role` is a flat field on `users`.

**Fix**: New migration creating `clinic_members (clinic_id, user_id, role, created_at)` with associated RLS.

---

### #7 — `20260218_security_cleanup.sql` conflicts with all subsequent security work (**CRITICAL**)

**Impact**: If this is the only applied migration, production has: (a) a role CHECK constraint blocking super_admin users; (b) RLS policies referencing `medicom_staff` table (doesn't exist) → query errors for tenants trying to read their own data.

**Root cause**: The security cleanup migration was applied before a coherent schema strategy was established. 020 fixes it but may not be applied.

**Fix**: Apply `020_security_fixes.sql` immediately as a migration. Verify current DB policy state before Phase 1 begins.

---

### #8 — Duplicate Supabase client exports create import confusion

**Impact**: `lib/api/appointments.ts` and `lib/api/patients.ts` import from `lib/supabase`, but some components import from `lib/supabaseClient`. If the wrong client is instantiated with missing env vars, it throws instead of gracefully degrading.

**Root cause**: Two files created at different times, never consolidated.

**Fix**: Delete `lib/supabaseClient.ts`. Update all imports to `lib/supabase`.

---

### #9 — `consultations` and `prescriptions` RLS uses slow correlated subqueries

**Impact**: On a clinic with 1000+ consultations, every SELECT on `consultations` runs a subquery per row: `SELECT tenant_id FROM public.users WHERE id = auth.uid()`. This is O(n) and will degrade as data grows. The 020 migration fixed this for core tables but not for 004_clinical_schema tables.

**Root cause**: 004_clinical_schema.sql written before the JWT-based policy pattern was established.

**Fix**: Drop subquery policies, add JWT-based policies matching the core table pattern.

---

### #10 — `services` / `documents` / `lab_orders` tables referenced but never defined

**Impact**: Three entire modules (Lab Orders, Documents, and service catalog linked to appointments) have UI that references tables that don't exist in any migration file. Any attempt to enable Supabase mode for these features will produce "relation does not exist" errors.

**Root cause**: Modules were designed and given API files, but the schema migrations were never written.

**Fix**: Write migrations for `services`, `patient_documents` (Supabase Storage), and `lab_orders` + `lab_contacts` before enabling real-mode for those features.

---

## Summary for Phase 1 Prioritization

| Item | What to build | Status |
|---|---|---|
| **1.1 Patients CRUD** | Schema ✅, API ✅, Hook ✅, UI partially. Need: Realtime, i18n strings, phone validation UX | Ready to wire |
| **1.2 Appointments CRUD** | Schema ✅, API ✅, Hook ✅ with Realtime. Need: CalendarView integration verification, status mapping fix | Ready to wire |
| **1.3 Dashboard real metrics** | KPI cards ✅, Revenue chart ❌ (hardcoded). Need: real 12-month query + appointment status aggregation | Needs new query |
| **1.4 Auth + Clinic membership** | `clinic_members` table ❌ (missing). JWT `tenant_id` gap ❌. Auth flow ✅ otherwise | Needs new migration |
| **1.5 Zustand stores → Supabase-backed** | No domain data in Zustand (correct pattern). Hooks are the cache layer. Need: Realtime on patients, i18n, sidebar persistence | Minor fixes |

**Blocking prerequisite before writing any Phase 1 code:**
1. Confirm which OWF SQL files have been applied to the remote DB
2. Apply `020_security_fixes.sql` if not already done
3. Fix the TEXT FK bug in billing and treatment tables
4. Resolve the JWT `tenant_id` gap (either via Auth Hook or RLS policy change)

---

*End of Phase 0 Audit. Awaiting your approval to proceed to Phase 1.*
