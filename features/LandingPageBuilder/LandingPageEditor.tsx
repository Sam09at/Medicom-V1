import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTenantLandingPage,
  upsertLandingPage,
  publishLandingPage,
  unpublishLandingPage,
} from '../../lib/api/landingPages';
import type { LandingPage, PageSection } from '../../types';
import { PublishControls } from './PublishControls';
import { SectionCanvas } from './SectionCanvas';
import { SectionEditorPanel } from './SectionEditorPanel';
import { SECTION_META, createSection, getSectionMeta } from './sectionConfig';
import type { PageSectionType } from '../../types';
import { AIGenerator } from './AIGenerator';

// ─── Left panel: page meta form ───────────────────────────────────────────────

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

const fieldCls = 'w-full px-2.5 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

function PageMetaPanel({ page, onChange }: { page: LandingPage; onChange: (u: Partial<LandingPage>) => void }) {
  return (
    <div className="space-y-3 px-3 pb-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-3 pb-1">Paramètres de la page</p>
      <MetaField label="Slug URL">
        <input className={fieldCls} defaultValue={page.slug} onBlur={e => onChange({ slug: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })} placeholder="cabinet-benali" />
        <p className="text-[10px] text-slate-400 mt-1">medicom.ma/<span className="font-mono">{page.slug || '…'}</span></p>
      </MetaField>
      <MetaField label="Couleur d'accent">
        <div className="flex items-center gap-2">
          <input type="color" className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0" defaultValue={page.accentColor || '#136cfb'} onBlur={e => onChange({ accentColor: e.target.value })} />
          <span className="text-[11px] text-slate-500 font-mono">{page.accentColor || '#136cfb'}</span>
        </div>
      </MetaField>
      <MetaField label="Téléphone"><input type="tel" className={fieldCls} defaultValue={page.contactPhone ?? ''} onBlur={e => onChange({ contactPhone: e.target.value || null })} placeholder="+212 6XX XXX XXX" /></MetaField>
      <MetaField label="Email"><input type="email" className={fieldCls} defaultValue={page.contactEmail ?? ''} onBlur={e => onChange({ contactEmail: e.target.value || null })} placeholder="contact@cabinet.ma" /></MetaField>
    </div>
  );
}

// ─── Left panel: section library ─────────────────────────────────────────────

function SectionLibraryPanel({ onAdd }: { onAdd: (type: PageSectionType) => void }) {
  return (
    <div className="px-3 pb-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-3 pb-2">Ajouter une section</p>
      <div className="space-y-1">
        {SECTION_META.map(meta => (
          <button
            key={meta.type}
            onClick={() => onAdd(meta.type)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all group text-left"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.accent}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={meta.iconPath} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">{meta.label}</p>
            </div>
            <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export const LandingPageEditor: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [leftTab, setLeftTab] = useState<'settings' | 'sections'>('sections');
  const [showAI, setShowAI] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load page on mount
  useEffect(() => {
    if (!tenantId) return;
    getTenantLandingPage(tenantId).then(async (existing) => {
      if (existing) {
        setPage(existing);
        setSections(existing.sectionsJson ?? []);
      } else {
        const created = await upsertLandingPage(tenantId, {
          slug: tenantId,
          accentColor: '#136cfb',
          headline: null,
          description: null,
          heroImageUrl: null,
          contactEmail: null,
          contactPhone: null,
          addressDisplay: null,
          city: null,
          googleMapsUrl: null,
          isPublished: false,
          scheduleJson: {},
          sectionsJson: [],
        });
        if (created) {
          setPage(created);
          setSections(created.sectionsJson ?? []);
        }
      }
      setLoading(false);
    });
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, [tenantId]);

  // Debounced auto-save
  const triggerSave = useCallback((updatedPage: LandingPage, updatedSections: PageSection[]) => {
    if (!tenantId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaved(false);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await upsertLandingPage(tenantId, {
        slug: updatedPage.slug,
        accentColor: updatedPage.accentColor,
        contactPhone: updatedPage.contactPhone,
        contactEmail: updatedPage.contactEmail,
        sectionsJson: updatedSections,
      });
      setSaving(false);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    }, 800);
  }, [tenantId]);

  // Page meta change (slug, color, contacts)
  const handleMetaChange = useCallback((updates: Partial<LandingPage>) => {
    if (!page) return;
    const next = { ...page, ...updates };
    setPage(next);
    triggerSave(next, sections);
  }, [page, sections, triggerSave]);

  // Section content change
  const handleSectionContentChange = useCallback((id: string, content: Record<string, unknown>) => {
    setSections(prev => {
      const next = prev.map(s => s.id === id ? { ...s, content } : s);
      if (page) triggerSave(page, next);
      return next;
    });
  }, [page, triggerSave]);

  // Add section
  const handleAddSection = useCallback((type: PageSectionType) => {
    const newSection = createSection(type);
    setSections(prev => {
      const next = [...prev, newSection];
      if (page) triggerSave(page, next);
      return next;
    });
    setSelectedId(newSection.id);
    setLeftTab('sections');
  }, [page, triggerSave]);

  // Reorder sections
  const handleReorder = useCallback((next: PageSection[]) => {
    setSections(next);
    if (page) triggerSave(page, next);
  }, [page, triggerSave]);

  // Toggle visibility
  const handleToggleVisible = useCallback((id: string) => {
    setSections(prev => {
      const next = prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s);
      if (page) triggerSave(page, next);
      return next;
    });
  }, [page, triggerSave]);

  // Delete section
  const handleDelete = useCallback((id: string) => {
    setSections(prev => {
      const next = prev.filter(s => s.id !== id);
      if (page) triggerSave(page, next);
      return next;
    });
    setSelectedId(prev => prev === id ? null : prev);
  }, [page, triggerSave]);

  // Publish / unpublish
  const handlePublish = async () => {
    if (!tenantId || !page) return;
    const ok = await publishLandingPage(tenantId);
    if (ok) setPage({ ...page, isPublished: true });
  };
  const handleUnpublish = async () => {
    if (!tenantId || !page) return;
    const ok = await unpublishLandingPage(tenantId);
    if (ok) setPage({ ...page, isPublished: false });
  };

  const selectedSection = sections.find(s => s.id === selectedId) ?? null;

  const handleAIGenerate = (generated: PageSection[]) => {
    setSections(generated);
    if (page) triggerSave(page, generated);
    setSelectedId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!page) {
    return <div className="flex items-center justify-center h-64 text-sm text-slate-500">Impossible de charger la page.</div>;
  }

  return (
    <>
    {showAI && (
      <AIGenerator
        onClose={() => setShowAI(false)}
        onGenerate={(generated) => { handleAIGenerate(generated); setShowAI(false); }}
      />
    )}
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/landing-pages')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Pages Web
          </button>
          <span className="text-slate-200">/</span>
          <span className="text-sm font-semibold text-slate-900 font-mono">{page.slug}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-500">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-semibold rounded-[10px] hover:bg-blue-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Générer avec l'IA
          </button>
          <PublishControls page={page} onPublish={handlePublish} onUnpublish={handleUnpublish} saving={saving} saved={saved} />
        </div>
      </div>

      {/* ── 3-panel body ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left panel */}
        <aside className="w-60 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-100 shrink-0">
            <button
              onClick={() => setLeftTab('sections')}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${leftTab === 'sections' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Sections
            </button>
            <button
              onClick={() => setLeftTab('settings')}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${leftTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Paramètres
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leftTab === 'sections'
              ? <SectionLibraryPanel onAdd={handleAddSection} />
              : <PageMetaPanel page={page} onChange={handleMetaChange} />
            }
          </div>
        </aside>

        {/* Center canvas */}
        <main className="flex-1 overflow-auto">
          <SectionCanvas
            sections={sections}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={handleReorder}
            onToggleVisible={handleToggleVisible}
            onDelete={handleDelete}
          />
        </main>

        {/* Right editor panel */}
        <aside className="w-80 border-l border-slate-200 bg-white shrink-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {selectedSection ? `Éditer · ${getSectionMeta(selectedSection.type).label}` : 'Éditeur de section'}
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <SectionEditorPanel section={selectedSection} onChange={handleSectionContentChange} />
          </div>
        </aside>
      </div>
    </div>
    </>
  );
};
