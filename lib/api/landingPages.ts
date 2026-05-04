import { supabase } from '../supabase';
import type { LandingPage, PageSection } from '../../types';

// ─── DB row type ──────────────────────────────────────────────────────────────

interface LandingPageRow {
  id: string;
  tenant_id: string;
  slug: string;
  is_published: boolean;
  headline: string | null;
  description: string | null;
  hero_image_url: string | null;
  accent_color: string;
  services_visible: string[];
  schedule_json: Record<string, unknown>;
  contact_email: string | null;
  contact_phone: string | null;
  address_display: string | null;
  city: string | null;
  google_maps_url: string | null;
  sections_json: unknown[];
  created_at: string;
  updated_at: string;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toLandingPage(row: LandingPageRow): LandingPage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    slug: row.slug,
    isPublished: row.is_published,
    headline: row.headline,
    description: row.description,
    heroImageUrl: row.hero_image_url,
    accentColor: row.accent_color,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    addressDisplay: row.address_display,
    city: row.city,
    googleMapsUrl: row.google_maps_url,
    sectionsJson: (row.sections_json ?? []) as PageSection[],
    scheduleJson: row.schedule_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbRow(
  page: Partial<Omit<LandingPage, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Partial<Omit<LandingPageRow, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>> {
  return {
    ...(page.slug !== undefined && { slug: page.slug }),
    ...(page.isPublished !== undefined && { is_published: page.isPublished }),
    ...(page.headline !== undefined && { headline: page.headline }),
    ...(page.description !== undefined && { description: page.description }),
    ...(page.heroImageUrl !== undefined && { hero_image_url: page.heroImageUrl }),
    ...(page.accentColor !== undefined && { accent_color: page.accentColor }),
    ...(page.contactEmail !== undefined && { contact_email: page.contactEmail }),
    ...(page.contactPhone !== undefined && { contact_phone: page.contactPhone }),
    ...(page.addressDisplay !== undefined && { address_display: page.addressDisplay }),
    ...(page.city !== undefined && { city: page.city }),
    ...(page.googleMapsUrl !== undefined && { google_maps_url: page.googleMapsUrl }),
    ...(page.scheduleJson !== undefined && { schedule_json: page.scheduleJson }),
    ...(page.sectionsJson !== undefined && { sections_json: page.sectionsJson }),
  };
}

// ─── Mock mode helpers (localStorage-backed) ──────────────────────────────────

const MOCK_SEED: Array<{ id: string; tenantId: string; tenantName: string; slug: string; region: string; accent: string }> = [
  { id: 'lp-001', tenantId: 'TEN-001', tenantName: 'Cabinet Dentaire Amina', slug: 'cabinet-amina',   region: 'Casablanca', accent: '#136cfb' },
  { id: 'lp-002', tenantId: 'TEN-002', tenantName: 'Clinique du Sourire',    slug: 'clinique-sourire', region: 'Rabat',       accent: '#0ea5e9' },
  { id: 'lp-003', tenantId: 'TEN-003', tenantName: 'Ortho Plus Tanger',      slug: 'ortho-tanger',    region: 'Tanger',      accent: '#8b5cf6' },
];

function mockStorageKey(tenantId: string) {
  return `medicom_lp_${tenantId}`;
}

function buildDefaultMock(seed: (typeof MOCK_SEED)[0], isPublished = false): LandingPage {
  const now = new Date().toISOString();
  return {
    id: seed.id,
    tenantId: seed.tenantId,
    tenantName: seed.tenantName,
    slug: seed.slug,
    isPublished,
    headline: seed.tenantName,
    description: `Cabinet médical situé à ${seed.region}. Prenez rendez-vous facilement en ligne.`,
    heroImageUrl: null,
    accentColor: seed.accent,
    contactEmail: null,
    contactPhone: null,
    addressDisplay: null,
    city: seed.region,
    googleMapsUrl: null,
    sectionsJson: [],
    scheduleJson: {},
    createdAt: now,
    updatedAt: now,
  };
}

function getMockPage(tenantId: string): LandingPage {
  const seed = MOCK_SEED.find(s => s.tenantId === tenantId);
  if (!seed) {
    const now = new Date().toISOString();
    return {
      id: `lp-${tenantId}`,
      tenantId,
      slug: tenantId,
      isPublished: false,
      headline: null,
      description: null,
      heroImageUrl: null,
      accentColor: '#136cfb',
      contactEmail: null,
      contactPhone: null,
      addressDisplay: null,
      city: null,
      googleMapsUrl: null,
      sectionsJson: [],
      scheduleJson: {},
      createdAt: now,
      updatedAt: now,
    };
  }
  try {
    const stored = localStorage.getItem(mockStorageKey(tenantId));
    if (stored) return JSON.parse(stored) as LandingPage;
  } catch { /* ignore */ }
  return buildDefaultMock(seed);
}

function saveMockPage(page: LandingPage): LandingPage {
  const updated = { ...page, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(mockStorageKey(page.tenantId), JSON.stringify(updated));
  } catch { /* ignore */ }
  return updated;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch the landing page for the current tenant. Returns null if none exists. */
export async function getTenantLandingPage(tenantId: string): Promise<LandingPage | null> {
  if (!supabase) return getMockPage(tenantId);

  const { data } = await supabase
    .from('tenant_landing_pages')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (!data) return null;
  return toLandingPage(data as LandingPageRow);
}

/** Fetch a published landing page by its public slug. Used by the public site. */
export async function getLandingPageBySlug(slug: string): Promise<LandingPage | null> {
  if (!supabase) {
    const seed = MOCK_SEED.find(s => s.slug === slug);
    if (!seed) return null;
    const page = getMockPage(seed.tenantId);
    return page.isPublished ? page : null;
  }

  const { data } = await supabase
    .from('tenant_landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!data) return null;
  return toLandingPage(data as LandingPageRow);
}

/** Create or update the landing page for a tenant (upsert on tenant_id). */
export async function upsertLandingPage(
  tenantId: string,
  updates: Partial<Omit<LandingPage, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<LandingPage | null> {
  if (!supabase) {
    const existing = getMockPage(tenantId);
    const merged: LandingPage = { ...existing, ...updates };
    return saveMockPage(merged);
  }

  const { data, error } = await supabase
    .from('tenant_landing_pages')
    .upsert(
      { tenant_id: tenantId, ...toDbRow(updates) },
      { onConflict: 'tenant_id' }
    )
    .select()
    .single();

  if (error || !data) return null;
  return toLandingPage(data as LandingPageRow);
}

/** Publish a landing page (set is_published = true). */
export async function publishLandingPage(tenantId: string): Promise<boolean> {
  if (!supabase) {
    const page = getMockPage(tenantId);
    saveMockPage({ ...page, isPublished: true });
    return true;
  }

  const { error } = await supabase
    .from('tenant_landing_pages')
    .update({ is_published: true })
    .eq('tenant_id', tenantId);

  return !error;
}

/** Unpublish a landing page (set is_published = false). */
export async function unpublishLandingPage(tenantId: string): Promise<boolean> {
  if (!supabase) {
    const page = getMockPage(tenantId);
    saveMockPage({ ...page, isPublished: false });
    return true;
  }

  const { error } = await supabase
    .from('tenant_landing_pages')
    .update({ is_published: false })
    .eq('tenant_id', tenantId);

  return !error;
}

/** Fetch all landing pages across all tenants — super admin only. */
export async function getAllLandingPages(): Promise<LandingPage[]> {
  if (!supabase) {
    return MOCK_SEED.map(seed => getMockPage(seed.tenantId));
  }

  const { data } = await supabase
    .from('tenant_landing_pages')
    .select('*, tenants(name)')
    .order('created_at', { ascending: false });

  if (!data) return [];
  return (data as any[]).map((row) => ({
    ...toLandingPage(row as LandingPageRow),
    tenantName: (row.tenants as { name: string } | null)?.name,
  }));
}
