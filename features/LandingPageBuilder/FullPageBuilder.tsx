import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTenantLandingPage,
  upsertLandingPage,
  publishLandingPage,
  unpublishLandingPage,
} from '../../lib/api/landingPages';
import type { LandingPage, PageSection } from '../../types';
import type { PageSectionType } from '../../types';
import { SECTION_META, createSection, getSectionMeta } from './sectionConfig';
import { SectionEditorPanel } from './SectionEditorPanel';
import { AIGenerator } from './AIGenerator';
import { WEBSITE_TEMPLATES, TEMPLATE_CATEGORIES, type WebsiteTemplate, type TemplateCategory } from './websiteTemplates';
import type {
  HeroContent, AboutContent, ServicesContent, DoctorsContent,
  BookingContent, TestimonialsContent, FAQContent, ContactContent, HoursContent,
} from './sectionConfig';

// ─── Device presets ───────────────────────────────────────────────────────────

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 375 };

// ─── Section live preview renderers ──────────────────────────────────────────

function PreviewHero({ content, accent }: { content: HeroContent; accent: string }) {
  return (
    <div className="py-16 px-8 text-center" style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)` }}>
      <div className="w-12 h-12 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: `${accent}20` }}>
        <svg className="w-6 h-6" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 leading-tight">{content.headline || 'Titre principal'}</h1>
      {content.subheadline && <p className="mt-3 text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">{content.subheadline}</p>}
      {content.ctaText && (
        <div className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold" style={{ background: accent }}>
          {content.ctaText}
        </div>
      )}
    </div>
  );
}

function PreviewAbout({ content, accent }: { content: AboutContent; accent: string }) {
  return (
    <div className="py-12 px-8 bg-white">
      <div className="flex gap-8 items-center max-w-full">
        {content.imageUrl && content.imagePosition === 'left' && (
          <div className="w-32 h-24 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
            <img src={content.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="w-6 h-0.5 mb-3 rounded" style={{ background: accent }} />
          <h2 className="text-xl font-bold text-slate-900 mb-2">{content.heading || 'À propos'}</h2>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{content.body}</p>
        </div>
        {content.imageUrl && content.imagePosition !== 'left' && (
          <div className="w-32 h-24 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
            <img src={content.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {!content.imageUrl && (
          <div className="w-28 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewServices({ content, accent }: { content: ServicesContent; accent: string }) {
  const items = content.items?.slice(0, 3) ?? [];
  return (
    <div className="py-12 px-8 bg-slate-50">
      <div className="w-6 h-0.5 mb-3 rounded" style={{ background: accent }} />
      <h2 className="text-xl font-bold text-slate-900 mb-6">{content.heading || 'Nos services'}</h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="text-lg mb-1">{item.icon || '🩺'}</div>
            <p className="text-[12px] font-semibold text-slate-900 leading-tight">{item.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{item.description}</p>
          </div>
        ))}
      </div>
      {(content.items?.length ?? 0) > 3 && (
        <p className="text-[11px] text-slate-400 mt-3 text-center">+ {(content.items?.length ?? 0) - 3} services supplémentaires</p>
      )}
    </div>
  );
}

function PreviewDoctors({ content, accent }: { content: DoctorsContent; accent: string }) {
  const items = content.items?.slice(0, 2) ?? [];
  return (
    <div className="py-12 px-8 bg-white">
      <div className="w-6 h-0.5 mb-3 rounded" style={{ background: accent }} />
      <h2 className="text-xl font-bold text-slate-900 mb-6">{content.heading || 'Notre équipe'}</h2>
      <div className="flex gap-4">
        {items.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 flex-1 min-w-0">
            {doc.photoUrl ? (
              <img src={doc.photoUrl} alt={doc.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-500 font-bold text-sm">
                {doc.name?.charAt(0) || 'D'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-slate-900 leading-tight truncate">{doc.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{doc.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewTestimonials({ content, accent }: { content: TestimonialsContent; accent: string }) {
  const item = content.items?.[0];
  return (
    <div className="py-12 px-8 bg-slate-50">
      <div className="w-6 h-0.5 mb-3 rounded" style={{ background: accent }} />
      <h2 className="text-xl font-bold text-slate-900 mb-6">{content.heading || 'Avis patients'}</h2>
      {item && (
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex gap-0.5 mb-2">
            {[...Array(item.rating ?? 5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
          </div>
          <p className="text-sm text-slate-600 italic leading-relaxed">"{item.text}"</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-2">{item.author} · {item.role}</p>
        </div>
      )}
      {(content.items?.length ?? 0) > 1 && (
        <p className="text-[11px] text-slate-400 mt-3 text-center">+ {(content.items?.length ?? 0) - 1} autres avis</p>
      )}
    </div>
  );
}

function PreviewBooking({ content, accent }: { content: BookingContent; accent: string }) {
  return (
    <div className="py-12 px-8 text-center" style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)` }}>
      <h2 className="text-xl font-bold text-white mb-2">{content.heading || 'Prendre rendez-vous'}</h2>
      <p className="text-sm text-white/80 mb-6 leading-relaxed">{content.body}</p>
      <div className="inline-flex items-center gap-2 bg-white px-6 py-2.5 rounded-full text-sm font-semibold" style={{ color: accent }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
        {content.buttonText || 'Appeler maintenant'}
      </div>
    </div>
  );
}

function PreviewFAQ({ content, accent }: { content: FAQContent; accent: string }) {
  const items = content.items?.slice(0, 2) ?? [];
  return (
    <div className="py-12 px-8 bg-white">
      <div className="w-6 h-0.5 mb-3 rounded" style={{ background: accent }} />
      <h2 className="text-xl font-bold text-slate-900 mb-6">{content.heading || 'FAQ'}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[12px] font-semibold text-slate-900">{item.question}</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewContact({ content, accent }: { content: ContactContent; accent: string }) {
  return (
    <div className="py-12 px-8 bg-slate-50">
      <div className="w-6 h-0.5 mb-3 rounded" style={{ background: accent }} />
      <h2 className="text-xl font-bold text-slate-900 mb-6">{content.heading || 'Contact'}</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '📞', label: content.phone || 'Téléphone non renseigné' },
          { icon: '✉️', label: content.email || 'Email non renseigné' },
          { icon: '📍', label: content.address || 'Adresse non renseignée' },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-slate-100">
            <span className="text-base">{c.icon}</span>
            <span className="text-[11px] text-slate-500 truncate">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewHours({ content, accent }: { content: HoursContent; accent: string }) {
  const openDays = content.schedule?.filter(d => !d.closed).slice(0, 3) ?? [];
  return (
    <div className="py-12 px-8 bg-white">
      <div className="w-6 h-0.5 mb-3 rounded" style={{ background: accent }} />
      <h2 className="text-xl font-bold text-slate-900 mb-4">{content.heading || 'Horaires'}</h2>
      <div className="space-y-1.5">
        {openDays.map((row) => (
          <div key={row.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
            <span className="text-[12px] font-medium text-slate-700">{row.day}</span>
            <span className="text-[12px] text-slate-500">{row.hours}</span>
          </div>
        ))}
        {(content.schedule?.length ?? 0) > 3 && (
          <p className="text-[11px] text-slate-400 text-right pt-1">...</p>
        )}
      </div>
    </div>
  );
}

function SectionLivePreview({ section, accent }: { section: PageSection; accent: string }) {
  const c = section.content as Record<string, unknown>;
  switch (section.type) {
    case 'hero': return <PreviewHero content={c as unknown as HeroContent} accent={accent} />;
    case 'about': return <PreviewAbout content={c as unknown as AboutContent} accent={accent} />;
    case 'services': return <PreviewServices content={c as unknown as ServicesContent} accent={accent} />;
    case 'doctors': return <PreviewDoctors content={c as unknown as DoctorsContent} accent={accent} />;
    case 'testimonials': return <PreviewTestimonials content={c as unknown as TestimonialsContent} accent={accent} />;
    case 'booking': return <PreviewBooking content={c as unknown as BookingContent} accent={accent} />;
    case 'faq': return <PreviewFAQ content={c as unknown as FAQContent} accent={accent} />;
    case 'contact': return <PreviewContact content={c as unknown as ContactContent} accent={accent} />;
    case 'hours': return <PreviewHours content={c as unknown as HoursContent} accent={accent} />;
    default: {
      const meta = getSectionMeta(section.type);
      return (
        <div className="py-10 px-8 bg-white text-center">
          <p className="text-sm font-semibold text-slate-500">{meta.label}</p>
        </div>
      );
    }
  }
}

// ─── Left Panel: Templates Tab ────────────────────────────────────────────────

function TemplatesPanel({ onApply }: { onApply: (t: WebsiteTemplate) => void }) {
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = category === 'all'
    ? WEBSITE_TEMPLATES
    : WEBSITE_TEMPLATES.filter(t => t.category === category);

  const handleApply = (t: WebsiteTemplate) => {
    if (confirmId === t.id) {
      onApply(t);
      setConfirmId(null);
    } else {
      setConfirmId(t.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Category pills */}
      <div className="px-3 py-3 flex flex-wrap gap-1.5 border-b border-[#2a2a2a]">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as TemplateCategory | 'all')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
              category === cat.id
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-3">
        {filtered.map(t => (
          <div key={t.id} className="rounded-[10px] overflow-hidden border border-[#2a2a2a] group hover:border-[#444] transition-colors">
            {/* Visual thumbnail */}
            <div
              className="h-20 relative flex items-center justify-center"
              style={{ background: t.thumbnailColor }}
            >
              <div className="text-center">
                <div className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{t.specialty}</div>
                <div className="text-white font-bold text-sm mt-0.5">{t.name}</div>
              </div>
              <div className="absolute bottom-2 right-2 flex gap-0.5">
                {t.sections.slice(0, 5).map((_, i) => (
                  <div key={i} className="w-4 h-1 bg-white/30 rounded-full" />
                ))}
              </div>
            </div>
            {/* Info + action */}
            <div className="bg-[#1a1a1a] px-3 py-2.5">
              <p className="text-[11px] text-slate-400 leading-snug mb-2">{t.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{t.sections.length} sections</span>
                <button
                  onClick={() => handleApply(t)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    confirmId === t.id
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {confirmId === t.id ? '⚠ Confirmer?' : 'Appliquer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Left Panel: Blocks Tab ───────────────────────────────────────────────────

function BlocksPanel({ onAdd }: { onAdd: (type: PageSectionType) => void }) {
  return (
    <div className="py-3 px-3 space-y-1">
      {SECTION_META.map(meta => (
        <button
          key={meta.type}
          onClick={() => onAdd(meta.type)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] hover:bg-white/8 border border-transparent hover:border-white/10 transition-all group text-left"
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.accent}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={meta.iconPath} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-300 group-hover:text-white leading-tight">{meta.label}</p>
            <p className="text-[10px] text-slate-500 leading-snug truncate">{meta.description}</p>
          </div>
          <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Left Panel: Layers Tab ───────────────────────────────────────────────────

function LayersPanel({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onToggleVisible,
  onDelete,
}: {
  sections: PageSection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (sections: PageSection[]) => void;
  onToggleVisible: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const dragSrc = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, i: number) {
    dragSrc.current = i;
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOverIdx(i);
  }
  function handleDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragSrc.current === null || dragSrc.current === i) { setDragOverIdx(null); return; }
    const next = [...sections];
    const [moved] = next.splice(dragSrc.current, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    dragSrc.current = null;
    setDragOverIdx(null);
  }

  if (sections.length === 0) {
    return (
      <div className="py-10 px-4 text-center">
        <p className="text-[12px] text-slate-500">Aucune section — ajoutez des blocs ou appliquez un template.</p>
      </div>
    );
  }

  return (
    <div className="py-3 px-3 space-y-1">
      {sections.map((section, i) => {
        const meta = getSectionMeta(section.type);
        const isSelected = section.id === selectedId;
        const isDragOver = dragOverIdx === i;
        return (
          <div
            key={section.id}
            draggable
            onDragStart={e => handleDragStart(e, i)}
            onDragOver={e => handleDragOver(e, i)}
            onDrop={e => handleDrop(e, i)}
            onDragEnd={() => { dragSrc.current = null; setDragOverIdx(null); }}
            onClick={() => onSelect(section.id)}
            className={[
              'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] cursor-pointer transition-all select-none group border',
              isSelected ? 'bg-blue-600/20 border-blue-500/40 text-white' : 'border-transparent hover:bg-white/6 text-slate-400 hover:text-slate-200',
              isDragOver ? 'border-blue-400/50 bg-blue-500/10' : '',
              !section.visible ? 'opacity-40' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className="cursor-grab text-slate-600 shrink-0">
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 2a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0zM7 7a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0zM7 12a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${meta.bg} ${meta.accent}`}>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={meta.iconPath} />
              </svg>
            </div>
            <span className="flex-1 text-[11px] font-semibold truncate">{meta.label}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); onToggleVisible(section.id); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                title={section.visible ? 'Masquer' : 'Afficher'}
              >
                {section.visible ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(section.id); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Supprimer"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Settings panel (page-level) ──────────────────────────────────────────────

function SettingsPanel({ page, onChange, accent, setAccent }: {
  page: LandingPage;
  onChange: (u: Partial<LandingPage>) => void;
  accent: string;
  setAccent: (c: string) => void;
}) {
  const fieldCls = 'w-full px-2.5 py-1.5 text-[12px] border border-[#3a3a3a] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#2a2a2a] text-slate-200 placeholder:text-slate-500 transition-shadow';
  return (
    <div className="py-4 px-3 space-y-4">
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Slug URL</label>
        <input className={fieldCls} defaultValue={page.slug} onBlur={e => onChange({ slug: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })} placeholder="cabinet-benali" />
        <p className="text-[10px] text-slate-600 font-mono">medicom.ma/{page.slug || '…'}</p>
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Couleur d'accent</label>
        <div className="flex items-center gap-2">
          <input type="color" className="w-8 h-8 rounded border border-[#3a3a3a] cursor-pointer p-0 bg-transparent" value={accent} onChange={e => setAccent(e.target.value)} onBlur={e => onChange({ accentColor: e.target.value })} />
          <span className="text-[11px] text-slate-400 font-mono">{accent}</span>
          <div className="flex gap-1 ml-2">
            {['#136cfb','#16a34a','#f59e0b','#db2777','#0891b2','#7c3aed'].map(c => (
              <button key={c} onClick={() => { setAccent(c); onChange({ accentColor: c }); }} className="w-5 h-5 rounded-full border-2 transition-all" style={{ background: c, borderColor: accent === c ? '#fff' : 'transparent' }} />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Téléphone</label>
        <input type="tel" className={fieldCls} defaultValue={page.contactPhone ?? ''} onBlur={e => onChange({ contactPhone: e.target.value || null })} placeholder="+212 6XX XXX XXX" />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</label>
        <input type="email" className={fieldCls} defaultValue={page.contactEmail ?? ''} onBlur={e => onChange({ contactEmail: e.target.value || null })} placeholder="contact@cabinet.ma" />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">SEO — Titre (headline)</label>
        <input className={fieldCls} defaultValue={page.headline ?? ''} onBlur={e => onChange({ headline: e.target.value || null })} placeholder="Cabinet Dentaire Excellence — Casablanca" />
      </div>
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">SEO — Description</label>
        <textarea className={`${fieldCls} resize-none`} rows={3} defaultValue={page.description ?? ''} onBlur={e => onChange({ description: e.target.value || null })} placeholder="Brève description pour Google…" />
      </div>
    </div>
  );
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

type LeftTab = 'templates' | 'blocks' | 'layers' | 'settings';

export const FullPageBuilder: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [leftTab, setLeftTab] = useState<LeftTab>('templates');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [accent, setAccent] = useState('#136cfb');
  const [history, setHistory] = useState<PageSection[][]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ──
  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    getTenantLandingPage(tenantId).then(data => {
      if (data) {
        setPage(data);
        setSections(data.sectionsJson ?? []);
        setAccent(data.accentColor ?? '#136cfb');
        pushHistory(data.sectionsJson ?? []);
      } else {
        const stub: LandingPage = {
          id: '', tenantId, slug: tenantId, sectionsJson: [], isPublished: false,
          accentColor: '#136cfb', contactPhone: null, contactEmail: null,
          headline: null, description: null, heroImageUrl: null, addressDisplay: null,
          city: null, googleMapsUrl: null, scheduleJson: {}, createdAt: '', updatedAt: '',
        };
        setPage(stub);
        pushHistory([]);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // ── History ──
  function pushHistory(secs: PageSection[]) {
    setHistory(prev => {
      const next = [...prev.slice(0, historyIdx + 1), secs];
      setHistoryIdx(next.length - 1);
      return next;
    });
  }

  function undo() {
    if (historyIdx <= 0) return;
    const idx = historyIdx - 1;
    setHistoryIdx(idx);
    setSections(history[idx]);
  }

  function redo() {
    if (historyIdx >= history.length - 1) return;
    const idx = historyIdx + 1;
    setHistoryIdx(idx);
    setSections(history[idx]);
  }

  // ── Auto-save ──
  const triggerSave = useCallback((pg: LandingPage, secs: PageSection[]) => {
    if (!pg.tenantId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaving(true);
    setSaved(false);
    saveTimer.current = setTimeout(async () => {
      await upsertLandingPage(pg.tenantId, { ...pg, sectionsJson: secs });
      setSaving(false);
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    }, 800);
  }, []);

  // ── Section mutations ──
  function updateSections(next: PageSection[]) {
    setSections(next);
    pushHistory(next);
    if (page) triggerSave(page, next);
  }

  function addSection(type: PageSectionType) {
    const s = createSection(type);
    const next = [...sections, s];
    updateSections(next);
    setSelectedId(s.id);
    setLeftTab('layers');
  }

  function reorderSections(next: PageSection[]) {
    updateSections(next);
  }

  function toggleVisible(id: string) {
    updateSections(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  }

  function deleteSection(id: string) {
    updateSections(sections.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function updateSectionContent(id: string, content: Record<string, unknown>) {
    const next = sections.map(s => s.id === id ? { ...s, content } : s);
    setSections(next);
    if (page) triggerSave(page, next);
  }

  function applyTemplate(t: WebsiteTemplate) {
    const newSections = t.sections.map(s => ({
      ...s,
      id: `${s.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    setAccent(t.accentColor);
    if (page) updatePageMeta({ accentColor: t.accentColor });
    updateSections(newSections);
    setSelectedId(null);
    setLeftTab('layers');
  }

  function updatePageMeta(update: Partial<LandingPage>) {
    if (!page) return;
    const next = { ...page, ...update };
    setPage(next);
    triggerSave(next, sections);
  }

  // ── Publish ──
  async function handlePublish() {
    if (!page || publishing) return;
    setPublishing(true);
    try {
      if (page.isPublished) {
        await unpublishLandingPage(page.tenantId);
        setPage(p => p ? { ...p, isPublished: false } : p);
      } else {
        await publishLandingPage(page.tenantId);
        setPage(p => p ? { ...p, isPublished: true } : p);
      }
    } finally {
      setPublishing(false);
    }
  }

  const selectedSection = sections.find(s => s.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Chargement du builder…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#111] overflow-hidden select-none">

      {/* ══ Top Bar ══════════════════════════════════════════════════════════════ */}
      <div className="h-12 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center px-3 gap-3 shrink-0 z-30">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/landing-pages')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[12px] font-semibold">Pages</span>
        </button>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        {/* Site name */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
          </div>
          <span className="text-white text-[13px] font-semibold">{page?.slug || tenantId}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${page?.isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
            {page?.isPublished ? 'Publié' : 'Brouillon'}
          </span>
        </div>

        {/* Device toggle */}
        <div className="flex items-center bg-[#111] border border-[#2a2a2a] rounded-lg p-0.5 gap-0.5">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map(d => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                device === d ? 'bg-[#2a2a2a] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {d === 'desktop' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" /></svg>}
              {d === 'tablet' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" /></svg>}
              {d === 'mobile' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>}
              <span className="hidden sm:inline">{DEVICE_WIDTHS[d]}px</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        {/* Undo / Redo */}
        <div className="flex gap-1">
          <button onClick={undo} disabled={historyIdx <= 0} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
          </button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
          </button>
        </div>

        {/* AI */}
        <button
          onClick={() => setShowAI(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors text-[11px] font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
          Générer avec l'IA
        </button>

        {/* Save status */}
        <div className="text-[11px] min-w-[60px] text-right">
          {saving && <span className="text-slate-500 animate-pulse">Sauvegarde…</span>}
          {saved && !saving && <span className="text-emerald-400">✓ Sauvegardé</span>}
        </div>

        {/* Publish */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            page?.isPublished
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {publishing ? '…' : page?.isPublished ? 'Dépublier' : 'Publier'}
        </button>
      </div>

      {/* ══ Main area ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left Panel ─────────────────────────────────────────────────────── */}
        <div className={`${leftCollapsed ? 'w-10' : 'w-[260px]'} bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col shrink-0 transition-all duration-200`}>
          {leftCollapsed ? (
            <div className="flex flex-col items-center py-3 gap-3">
              <button onClick={() => setLeftCollapsed(false)} className="w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-[#2a2a2a] shrink-0">
                {([
                  { id: 'templates', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z', label: 'Templates' },
                  { id: 'blocks', icon: 'M12 4v16m8-8H4', label: 'Blocs' },
                  { id: 'layers', icon: 'M6 6h12M6 10h12M6 14h12', label: 'Calques' },
                  { id: 'settings', icon: 'M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Réglages' },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setLeftTab(tab.id as LeftTab)}
                    className={`flex-1 py-2.5 text-center transition-colors relative ${leftTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title={tab.label}
                  >
                    <svg className="w-3.5 h-3.5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                    </svg>
                    <p className="text-[9px] font-semibold mt-0.5 tracking-wide">{tab.label}</p>
                    {leftTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                  </button>
                ))}
                <button onClick={() => setLeftCollapsed(true)} className="w-8 flex items-center justify-center text-slate-600 hover:text-slate-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {leftTab === 'templates' && <TemplatesPanel onApply={applyTemplate} />}
                {leftTab === 'blocks' && <BlocksPanel onAdd={addSection} />}
                {leftTab === 'layers' && (
                  <LayersPanel
                    sections={sections}
                    selectedId={selectedId}
                    onSelect={id => { setSelectedId(id); setRightCollapsed(false); }}
                    onReorder={reorderSections}
                    onToggleVisible={toggleVisible}
                    onDelete={deleteSection}
                  />
                )}
                {leftTab === 'settings' && page && (
                  <SettingsPanel page={page} onChange={updatePageMeta} accent={accent} setAccent={setAccent} />
                )}
              </div>

              {/* Section count footer */}
              <div className="border-t border-[#2a2a2a] px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
                {leftTab === 'layers' && (
                  <button onClick={() => setLeftTab('blocks')} className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold">+ Ajouter</button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Canvas ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 bg-[#0d0d0d] overflow-auto" onClick={() => setSelectedId(null)}>
          <div className="min-h-full flex justify-center py-8 px-4">
            <div
              className="bg-white shadow-2xl transition-all duration-300 rounded-sm overflow-hidden relative"
              style={{ width: device === 'desktop' ? '100%' : DEVICE_WIDTHS[device], maxWidth: DEVICE_WIDTHS[device] }}
              onClick={e => e.stopPropagation()}
            >
              {/* Browser chrome */}
              <div className="h-8 bg-[#e8e8e8] flex items-center px-3 gap-1.5 border-b border-[#d0d0d0] shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <div className="flex-1 mx-3 h-4 bg-white rounded text-[10px] flex items-center px-2 text-slate-400 font-mono">
                  medicom.ma/{page?.slug || '…'}
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-4 text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#111] flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Page vide</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-xs">Choisissez un template à gauche ou ajoutez des blocs manuellement pour commencer.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setLeftTab('templates')} className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors">Choisir un template</button>
                    <button onClick={() => setLeftTab('blocks')} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">Ajouter des blocs</button>
                  </div>
                </div>
              ) : (
                <div>
                  {sections.map((section) => {
                    const isSelected = section.id === selectedId;
                    return (
                      <div
                        key={section.id}
                        onClick={e => { e.stopPropagation(); setSelectedId(section.id); setRightCollapsed(false); }}
                        className={[
                          'relative cursor-pointer transition-all',
                          !section.visible ? 'opacity-40' : '',
                          isSelected ? 'ring-2 ring-blue-500 ring-inset' : 'hover:ring-1 hover:ring-blue-300 hover:ring-inset',
                        ].filter(Boolean).join(' ')}
                      >
                        {/* Section overlay controls */}
                        <div className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                          <div className="bg-slate-900/80 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1.5">
                            <span className="text-[10px] text-white font-semibold">{getSectionMeta(section.type).label}</span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); toggleVisible(section.id); }}
                            className="w-7 h-7 bg-slate-900/80 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-slate-700/80 transition-colors"
                          >
                            {section.visible
                              ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            }
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteSection(section.id); }}
                            className="w-7 h-7 bg-red-600/80 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>

                        {/* Section live preview */}
                        <SectionLivePreview section={section} accent={accent} />
                      </div>
                    );
                  })}

                  {/* Add section button */}
                  <div
                    onClick={e => { e.stopPropagation(); setLeftTab('blocks'); }}
                    className="py-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors border-2 border-dashed border-slate-200 m-4 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Ajouter une section</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────────────────────────── */}
        <div className={`${rightCollapsed || !selectedSection ? 'w-0 border-0' : 'w-[320px] border-l border-slate-200'} bg-white flex flex-col shrink-0 transition-all duration-200 overflow-hidden`}>
          {selectedSection && !rightCollapsed && (
            <>
              <div className="h-12 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-slate-900">{getSectionMeta(selectedSection.type).label}</span>
                </div>
                <button onClick={() => setSelectedId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <SectionEditorPanel
                  section={selectedSection}
                  onChange={updateSectionContent}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── AI Generator modal ─────────────────────────────────────────────────── */}
      {showAI && (
        <AIGenerator
          onClose={() => setShowAI(false)}
          onGenerate={(generated) => {
            updateSections(generated);
            setSelectedId(null);
            setShowAI(false);
          }}
        />
      )}
    </div>
  );
};
