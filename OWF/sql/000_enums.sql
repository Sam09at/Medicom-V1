-- ═══════════════════════════════════════════════════════════════
-- Medicom SaaS — 000_enums.sql
-- All Postgres enum types for the platform.
-- Run BEFORE any table-creation migration.
-- ═══════════════════════════════════════════════════════════════

-- ── User & Tenant ──

CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'clinic_admin',
  'doctor',
  'staff',
  'patient'
);

CREATE TYPE public.tenant_status AS ENUM (
  'active',
  'suspended',
  'trial',
  'cancelled'
);

CREATE TYPE public.plan_tier AS ENUM (
  'starter',
  'pro',
  'premium'
);

-- ── Appointments ──

CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'confirmed',
  'waiting_room',
  'in_progress',
  'completed',
  'cancelled',
  'rescheduled',
  'absent'
);

CREATE TYPE public.appointment_type AS ENUM (
  'consultation',
  'treatment',
  'checkup',
  'urgency',
  'break'
);

-- ── Insurance ──

CREATE TYPE public.insurance_type AS ENUM (
  'cnops',
  'cnss',
  'private',
  'none'
);

-- ── Billing ──

CREATE TYPE public.invoice_status AS ENUM (
  'draft',
  'sent',
  'paid',
  'partial',
  'overdue',
  'cancelled'
);
