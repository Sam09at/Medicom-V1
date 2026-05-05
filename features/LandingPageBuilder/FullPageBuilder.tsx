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
  BookingContent, BookingWidgetContent, TestimonialsContent, FAQContent, ContactContent, HoursContent,
} from './sectionConfig';

// ─── Device presets ───────────────────────────────────────────────────────────
type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 375 };
type LeftTab = 'templates' | 'blocks' | 'layers' | 'settings';

// ─── Drag transfer key ────────────────────────────────────────────────────────
const DRAG_NEW = 'builder/new-section';
const DRAG_MOVE = 'builder/move-section';

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
        {(!content.imageUrl || content.imagePosition !== 'left') && (
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
        <p className="text-[11px] text-slate-400 mt-3 text-center">+ {(content.items?.length ?? 0) - 3} services</p>
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
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-500 font-bold text-sm">
              {doc.name?.charAt(0) || 'D'}
            </div>
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

function PreviewBookingWidget({ content, accent }: { content: BookingWidgetContent; accent: string }) {
  return (
    <div className="py-12 px-8 bg-slate-50">
      <div className="w-6 h-0.5 mb-3 rounded" style={{ background: accent }} />
      <h2 className="text-xl font-bold text-slate-900 mb-4">{content.heading || 'Prendre rendez-vous en ligne'}</h2>
      {content.body && <p className="text-sm text-slate-500 mb-5 leading-relaxed">{content.body}</p>}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-16 h-2 bg-slate-200 rounded-full" />
          <div className="flex gap-1">
            <div className="w-5 h-5 rounded bg-slate-100" />
            <div className="w-5 h-5 rounded bg-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['L','M','M','J','V','S','D'].map((d, i) => (
            <div key={i} className="text-[9px] text-slate-400 text-center font-semibold">{d}</div>
          ))}
          {Array.from({ length: 28 }).map((_, i) => {
            const day = i + 1;
            const isSelected = day === 12;
            const isAvail = [3, 5, 8, 10, 12, 15, 17, 19, 22].includes(day);
            return (
              <div key={i} className={`text-[9px] text-center py-0.5 rounded ${isSelected ? 'text-white font-bold' : isAvail ? 'text-slate-700' : 'text-slate-300'}`} style={isSelected ? { backgroundColor: accent } : isAvail ? { backgroundColor: `${accent}18` } : {}}>
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5 flex-wrap mt-3">
          {['09:00','09:30','10:00','10:30','11:00'].map((t, i) => (
            <div key={i} className={`text-[10px] px-2 py-1 rounded-lg font-medium ${i === 1 ? 'text-white' : 'text-slate-600 bg-slate-50'}`} style={i === 1 ? { backgroundColor: accent } : {}}>
              {t}
            </div>
          ))}
        </div>
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
    case 'booking_widget': return <PreviewBookingWidget content={c as unknown as BookingWidgetContent} accent={accent} />;
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

// ─── Visual block preview (Elementor-style) ──────────────────────────────────

function BlockVisualPreview({ type, accent }: { type: PageSectionType; accent: string }) {
  switch (type) {
    case 'hero': return (
      <div className="h-[56px] px-3 pt-2.5 pb-2 flex flex-col justify-between" style={{ background: `linear-gradient(135deg, ${accent}28 0%, ${accent}08 100%)` }}>
        <div className="h-1.5 w-14 rounded-full" style={{ background: accent + '99' }} />
        <div className="space-y-1">
          <div className="h-1 w-20 bg-white/25 rounded-full" />
          <div className="h-1 w-14 bg-white/15 rounded-full" />
        </div>
        <div className="h-3.5 w-12 rounded-full" style={{ background: accent + 'cc' }} />
      </div>
    );
    case 'about': return (
      <div className="h-[56px] px-3 py-2 bg-[#111] flex gap-2 items-center">
        <div className="flex-1 space-y-1.5">
          <div className="h-1.5 w-12 bg-slate-600 rounded-full" />
          <div className="h-1 w-16 bg-slate-700 rounded-full" />
          <div className="h-1 w-10 bg-slate-700 rounded-full" />
        </div>
        <div className="w-10 h-9 bg-slate-800 rounded shrink-0" />
      </div>
    );
    case 'services': return (
      <div className="h-[56px] px-3 py-2 bg-[#0f0f0f]">
        <div className="h-1 w-10 bg-slate-600 rounded-full mb-2" />
        <div className="grid grid-cols-3 gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="h-6 bg-[#1e1e1e] rounded flex flex-col items-center justify-center gap-0.5">
              <div className="w-2 h-2 bg-slate-600 rounded-sm" />
              <div className="h-0.5 w-5 bg-slate-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
    case 'doctors': return (
      <div className="h-[56px] px-3 py-2 bg-[#111] flex gap-2">
        {[0,1].map(i => (
          <div key={i} className="flex-1 bg-[#1e1e1e] rounded flex flex-col items-center justify-center gap-1">
            <div className="w-6 h-6 rounded-full bg-slate-600" />
            <div className="h-0.5 w-9 bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>
    );
    case 'booking': return (
      <div className="h-[56px] px-3 py-2 flex flex-col items-center justify-center gap-1.5" style={{ background: accent + '22' }}>
        <div className="h-1.5 w-16 rounded-full" style={{ background: accent + '80' }} />
        <div className="h-4 w-14 rounded-full" style={{ background: accent + '55' }} />
      </div>
    );
    case 'booking_widget': return (
      <div className="h-[56px] px-3 py-2 bg-[#111]">
        <div className="border border-[#333] rounded p-1 h-full flex gap-1.5">
          <div className="flex-1 bg-[#1a1a1a] rounded grid grid-cols-5 gap-px p-1">
            {Array.from({length:10}).map((_,i)=>(
              <div key={i} className="rounded-sm" style={i===4?{background:accent+'aa'}:{background:'#2a2a2a'}} />
            ))}
          </div>
          <div className="flex-1 space-y-1 flex flex-col justify-center">
            <div className="h-0.5 w-full bg-slate-700 rounded-full" />
            <div className="h-0.5 w-3/4 bg-slate-700 rounded-full" />
            <div className="h-3 w-full rounded" style={{ background: accent + '55' }} />
          </div>
        </div>
      </div>
    );
    case 'testimonials': return (
      <div className="h-[56px] px-3 py-2 bg-[#0f0f0f]">
        <div className="h-0.5 w-10 bg-slate-700 rounded-full mb-1.5" />
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="flex-1 bg-[#1a1a1a] rounded p-1">
              <div className="flex gap-0.5 mb-1">
                {[0,0,0].map((_,j)=><div key={j} className="w-1 h-1 rounded-sm bg-amber-500/40"/>)}
              </div>
              <div className="space-y-0.5">
                <div className="h-0.5 w-full bg-slate-700 rounded-full" />
                <div className="h-0.5 w-2/3 bg-slate-700 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    case 'faq': return (
      <div className="h-[56px] px-3 py-2 bg-[#111] space-y-1">
        {[0,1,2].map(i => (
          <div key={i} className="bg-[#1a1a1a] rounded px-2 py-1 flex items-center justify-between">
            <div className="h-0.5 w-14 bg-slate-700 rounded-full" />
            <div className="w-2 h-2 border border-slate-600 rounded-sm" />
          </div>
        ))}
      </div>
    );
    case 'contact': return (
      <div className="h-[56px] px-3 py-2 bg-[#0f0f0f] grid grid-cols-3 gap-1">
        {['📞','✉️','📍'].map((icon, i) => (
          <div key={i} className="bg-[#1a1a1a] rounded flex flex-col items-center justify-center gap-0.5">
            <div className="text-[8px]">{icon}</div>
            <div className="h-0.5 w-5 bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>
    );
    case 'hours': return (
      <div className="h-[56px] px-3 py-2 bg-[#111] space-y-1">
        {['Lun','Mar','Mer','Jeu'].map(d => (
          <div key={d} className="flex justify-between items-center">
            <div className="h-0.5 w-5 bg-slate-600 rounded-full" />
            <div className="h-0.5 w-10 bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>
    );
    default: return (
      <div className="h-[56px] bg-[#111] flex items-center justify-center">
        <div className="h-1 w-16 bg-slate-700 rounded-full" />
      </div>
    );
  }
}

// ─── Template mini-page preview ───────────────────────────────────────────────

const SECTION_TYPE_COLORS: Record<string, string> = {
  about: '#8b5cf6', services: '#22c55e', doctors: '#3b82f6', testimonials: '#f59e0b',
  booking: '#136cfb', booking_widget: '#6366f1', faq: '#ef4444', contact: '#64748b', hours: '#14b8a6',
};

function TemplateMiniPreview({ t }: { t: WebsiteTemplate }) {
  const nonHero = t.sections.filter(s => s.type !== 'hero');
  return (
    <div className="h-[108px] overflow-hidden rounded-t-[9px]" style={{ background: '#0d0d0d' }}>
      <div className="px-3 pt-2 pb-1.5" style={{ background: `linear-gradient(135deg, ${t.accentColor}28 0%, ${t.accentColor}08 100%)` }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-1 rounded-full" style={{ background: t.accentColor + 'aa' }} />
        </div>
        <div className="h-1 w-20 bg-white/30 rounded-full mb-0.5" />
        <div className="h-1 w-14 bg-white/15 rounded-full mb-2" />
        <div className="h-3.5 w-12 rounded-full inline-flex items-center justify-center" style={{ background: t.accentColor + 'cc' }}>
          <div className="h-0.5 w-7 bg-white/80 rounded-full" />
        </div>
      </div>
      <div className="px-2 py-1 space-y-0.5">
        {nonHero.slice(0, 4).map((s, i) => {
          const c = SECTION_TYPE_COLORS[s.type] ?? '#64748b';
          return (
            <div key={i} className="h-3 rounded flex items-center gap-1.5 px-1.5" style={{ background: c + '18' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c + '99' }} />
              <div className="flex-1 h-0.5 bg-white/8 rounded-full" />
              {i % 2 === 0 && <div className="w-5 h-0.5 bg-white/5 rounded-full" />}
            </div>
          );
        })}
        {nonHero.length > 4 && (
          <div className="flex gap-0.5 px-1">
            {Array.from({ length: Math.min(nonHero.length - 4, 5) }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-white/5" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Canvas: Drop zone between sections ──────────────────────────────────────

function DropZone({ index, active, onDragOver, onDrop, onDragLeave }: {
  index: number; active: boolean;
  onDragOver: () => void; onDrop: () => void; onDragLeave: () => void;
}) {
  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; onDragOver(); }}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      onDragLeave={onDragLeave}
      className={`transition-all duration-150 flex items-center justify-center ${active ? 'h-8' : 'h-1.5'}`}
    >
      {active && (
        <div className="w-full mx-4 h-0.5 rounded-full relative flex items-center justify-center" style={{ background: '#3b82f6' }}>
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
        </div>
      )}
    </div>
  );
}

// ─── Canvas: Floating section toolbar ────────────────────────────────────────

function SectionToolbar({ onMoveUp, onMoveDown, onDuplicate, onToggle, onDelete, visible, canUp, canDown }: {
  onMoveUp: () => void; onMoveDown: () => void; onDuplicate: () => void;
  onToggle: () => void; onDelete: () => void; visible: boolean; canUp: boolean; canDown: boolean;
}) {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-white/10 px-1 py-1 shadow-xl">
      <ToolbarBtn onClick={onMoveUp} disabled={!canUp} title="Monter" className="disabled:opacity-30">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={onMoveDown} disabled={!canDown} title="Descendre" className="disabled:opacity-30">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </ToolbarBtn>
      <div className="w-px h-4 bg-white/10 mx-0.5" />
      <ToolbarBtn onClick={onDuplicate} title="Dupliquer">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={onToggle} title={visible ? 'Masquer' : 'Afficher'}>
        {visible
          ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          : <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        }
      </ToolbarBtn>
      <div className="w-px h-4 bg-white/10 mx-0.5" />
      <ToolbarBtn onClick={onDelete} title="Supprimer" danger>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
      </ToolbarBtn>
    </div>
  );
}

function ToolbarBtn({ children, onClick, disabled = false, title, danger = false, className = '' }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string; danger?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
        danger
          ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/15'
          : 'text-slate-400 hover:text-white hover:bg-white/10'
      } disabled:opacity-30 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Left Panel: Templates Tab ────────────────────────────────────────────────

function TemplatesPanel({ onApply }: { onApply: (t: WebsiteTemplate) => void }) {
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = category === 'all'
    ? WEBSITE_TEMPLATES
    : WEBSITE_TEMPLATES.filter(t => t.category === category);

  const handleApply = (t: WebsiteTemplate) => {
    if (confirmId === t.id) { onApply(t); setConfirmId(null); }
    else setConfirmId(t.id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 flex flex-wrap gap-1 border-b border-[#2a2a2a]">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as TemplateCategory | 'all')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
              category === cat.id ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-2">
        {filtered.map(t => (
          <div key={t.id} className="rounded-[10px] overflow-hidden border border-[#2a2a2a] hover:border-[#404040] transition-all cursor-pointer group" onClick={() => handleApply(t)}>
            <TemplateMiniPreview t={t} />
            <div className="bg-[#161616] border-t border-[#222] px-3 py-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-slate-200 leading-tight truncate">{t.name}</p>
                <p className="text-[10px] text-slate-500 leading-snug">{t.sections.length} sections · {t.specialty}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleApply(t); }}
                className={`ml-2 shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  confirmId === t.id ? 'bg-amber-500 text-white scale-95' : 'bg-white/8 text-slate-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                {confirmId === t.id ? '⚠ Oui?' : 'Utiliser'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Left Panel: Blocks Tab (Elementor-style, draggable) ─────────────────────

const BLOCK_CATEGORIES = [
  { id: 'all', label: 'Tout' },
  { id: 'structure', label: 'Structure', types: ['hero', 'about'] },
  { id: 'medical', label: 'Médical', types: ['services', 'doctors'] },
  { id: 'booking', label: 'RDV', types: ['booking', 'booking_widget'] },
  { id: 'social', label: 'Social', types: ['testimonials', 'faq'] },
  { id: 'info', label: 'Infos', types: ['contact', 'hours'] },
] as const;

function BlocksPanel({ onAdd, accent }: { onAdd: (type: PageSectionType) => void; accent: string }) {
  const [catFilter, setCatFilter] = useState<string>('all');

  const visibleMeta = catFilter === 'all'
    ? SECTION_META
    : SECTION_META.filter(m => {
        const cat = BLOCK_CATEGORIES.find(c => c.id === catFilter);
        return cat && 'types' in cat && cat.types.includes(m.type as never);
      });

  return (
    <div className="flex flex-col h-full">
      {/* Category filter */}
      <div className="px-3 py-2.5 border-b border-[#2a2a2a]">
        <div className="flex flex-wrap gap-1">
          {BLOCK_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(cat.id)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                catFilter === cat.id ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Block grid */}
      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="grid grid-cols-2 gap-2">
          {visibleMeta.map(meta => (
            <div
              key={meta.type}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData(DRAG_NEW, meta.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onAdd(meta.type)}
              className="group rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-[#404040] cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:shadow-black/30 active:scale-95"
              title={`Glisser ou cliquer pour ajouter — ${meta.label}`}
            >
              {/* Visual preview */}
              <BlockVisualPreview type={meta.type} accent={accent} />
              {/* Label */}
              <div className="px-2 py-1.5 bg-[#161616] border-t border-[#222]">
                <p className="text-[11px] font-semibold text-slate-300 leading-tight truncate">{meta.label}</p>
                <p className="text-[9px] text-slate-600 truncate mt-0.5">{meta.description}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Drag hint */}
        <div className="mt-4 px-2 py-3 rounded-xl border border-dashed border-[#2a2a2a] flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
          </svg>
          <p className="text-[10px] text-slate-600 leading-snug">Glissez un bloc directement sur le canvas pour l'insérer à la position souhaitée</p>
        </div>
      </div>
    </div>
  );
}

// ─── Left Panel: Layers Tab ───────────────────────────────────────────────────

function LayersPanel({
  sections, selectedId, onSelect, onReorder, onToggleVisible, onDelete,
}: {
  sections: PageSection[]; selectedId: string | null;
  onSelect: (id: string) => void; onReorder: (sections: PageSection[]) => void;
  onToggleVisible: (id: string) => void; onDelete: (id: string) => void;
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
        <p className="text-[12px] text-slate-600">Aucune section — ajoutez des blocs ou choisissez un template.</p>
      </div>
    );
  }

  return (
    <div className="py-2 px-2.5 space-y-0.5">
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
              'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all select-none group border',
              isSelected ? 'bg-blue-600/15 border-blue-500/30 text-white' : 'border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200',
              isDragOver ? 'border-blue-400/40 bg-blue-500/8' : '',
              !section.visible ? 'opacity-40' : '',
            ].join(' ')}
          >
            {/* Drag handle */}
            <div className="cursor-grab shrink-0 text-slate-700 group-hover:text-slate-500">
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 2a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0zM7 7a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0zM7 12a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            {/* Icon */}
            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${meta.bg} ${meta.accent}`}>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={meta.iconPath} />
              </svg>
            </div>
            {/* Label */}
            <span className="flex-1 text-[11px] font-semibold truncate">{meta.label}</span>
            {/* Index */}
            <span className="text-[9px] text-slate-700 font-mono shrink-0">{i + 1}</span>
            {/* Actions */}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={e => { e.stopPropagation(); onToggleVisible(section.id); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
              >
                {section.visible
                  ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                }
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(section.id); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-400"
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

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel({ page, onChange, accent, setAccent }: {
  page: LandingPage; onChange: (u: Partial<LandingPage>) => void;
  accent: string; setAccent: (c: string) => void;
}) {
  const fieldCls = 'w-full px-2.5 py-1.5 text-[12px] border border-[#3a3a3a] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-[#252525] text-slate-200 placeholder:text-slate-600 transition-shadow';
  const presetColors = ['#136cfb','#16a34a','#f59e0b','#db2777','#0891b2','#7c3aed','#dc2626','#ea580c','#0f766e'];
  return (
    <div className="py-4 px-3 space-y-5">
      {/* Slug */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">URL du site</label>
        <input className={fieldCls} defaultValue={page.slug} onBlur={e => onChange({ slug: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })} placeholder="cabinet-benali" />
        <p className="text-[10px] text-slate-700 font-mono">medicom.ma/<span className="text-blue-400">{page.slug || '…'}</span></p>
      </div>
      {/* Accent color */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Couleur d'accent</label>
        <div className="flex items-center gap-2">
          <input type="color" className="w-8 h-8 rounded-lg border border-[#3a3a3a] cursor-pointer p-0.5 bg-transparent" value={accent} onChange={e => setAccent(e.target.value)} onBlur={e => onChange({ accentColor: e.target.value })} />
          <span className="text-[11px] text-slate-400 font-mono">{accent.toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-9 gap-1">
          {presetColors.map(c => (
            <button key={c} onClick={() => { setAccent(c); onChange({ accentColor: c }); }} className="h-5 rounded-md border-2 transition-all" style={{ background: c, borderColor: accent === c ? '#fff' : 'transparent' }} title={c} />
          ))}
        </div>
      </div>
      {/* Contact */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Téléphone</label>
        <input type="tel" className={fieldCls} defaultValue={page.contactPhone ?? ''} onBlur={e => onChange({ contactPhone: e.target.value || null })} placeholder="+212 6XX XXX XXX" />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</label>
        <input type="email" className={fieldCls} defaultValue={page.contactEmail ?? ''} onBlur={e => onChange({ contactEmail: e.target.value || null })} placeholder="contact@cabinet.ma" />
      </div>
      {/* SEO */}
      <div className="pt-3 border-t border-[#2a2a2a] space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SEO</p>
        <div className="space-y-1.5">
          <label className="block text-[10px] text-slate-600">Titre de la page</label>
          <input className={fieldCls} defaultValue={page.headline ?? ''} onBlur={e => onChange({ headline: e.target.value || null })} placeholder="Cabinet Excellence — Casablanca" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] text-slate-600">Description</label>
          <textarea className={`${fieldCls} resize-none`} rows={3} defaultValue={page.description ?? ''} onBlur={e => onChange({ description: e.target.value || null })} placeholder="Brève description pour Google…" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

export const FullPageBuilder: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [leftTab, setLeftTab] = useState<LeftTab>('templates');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [accent, setAccent] = useState('#136cfb');
  const [history, setHistory] = useState<PageSection[][]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);

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
    const idx = historyIdx - 1; setHistoryIdx(idx); setSections(history[idx]);
  }
  function redo() {
    if (historyIdx >= history.length - 1) return;
    const idx = historyIdx + 1; setHistoryIdx(idx); setSections(history[idx]);
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIdx, history]);

  // ── Auto-save ──
  const triggerSave = useCallback((pg: LandingPage, secs: PageSection[]) => {
    if (!pg.tenantId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaving(true); setSaved(false);
    saveTimer.current = setTimeout(async () => {
      await upsertLandingPage(pg.tenantId, { ...pg, sectionsJson: secs });
      setSaving(false); setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    }, 800);
  }, []);

  // ── Section mutations ──
  function updateSections(next: PageSection[]) {
    setSections(next);
    pushHistory(next);
    if (page) triggerSave(page, next);
  }

  function addSection(type: PageSectionType, atIndex?: number) {
    const s = createSection(type);
    const next = [...sections];
    if (atIndex !== undefined) next.splice(atIndex, 0, s);
    else next.push(s);
    updateSections(next);
    setSelectedId(s.id);
    setLeftTab('layers');
  }

  function duplicateSection(id: string) {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const original = sections[idx];
    const copy: PageSection = {
      ...original,
      id: `${original.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      content: { ...original.content },
    };
    const next = [...sections];
    next.splice(idx + 1, 0, copy);
    updateSections(next);
    setSelectedId(copy.id);
  }

  function moveSectionUp(id: string) {
    const idx = sections.findIndex(s => s.id === id);
    if (idx <= 0) return;
    const next = [...sections];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    updateSections(next);
  }

  function moveSectionDown(id: string) {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0 || idx >= sections.length - 1) return;
    const next = [...sections];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
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
      ...s, id: `${s.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
    } finally { setPublishing(false); }
  }

  // ── Drag: drop from block library to canvas ──
  function handleCanvasDrop(e: React.DragEvent, atIndex: number) {
    e.preventDefault();
    const newType = e.dataTransfer.getData(DRAG_NEW) as PageSectionType | '';
    if (newType) {
      addSection(newType, atIndex);
    } else {
      // Moving existing section
      const moveId = e.dataTransfer.getData(DRAG_MOVE);
      if (moveId) {
        const fromIdx = sections.findIndex(s => s.id === moveId);
        if (fromIdx < 0 || fromIdx === atIndex) { setDropTargetIdx(null); return; }
        const next = [...sections];
        const [moved] = next.splice(fromIdx, 1);
        const insertAt = fromIdx < atIndex ? atIndex - 1 : atIndex;
        next.splice(insertAt, 0, moved);
        updateSections(next);
      }
    }
    setDropTargetIdx(null);
  }

  const selectedSection = sections.find(s => s.id === selectedId) ?? null;
  const selectedIdx = sections.findIndex(s => s.id === selectedId);

  if (loading) {
    return (
      <div className="h-screen bg-[#111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Chargement du builder…</span>
        </div>
      </div>
    );
  }

  const LEFT_TABS = [
    { id: 'templates' as LeftTab, icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z', label: 'Templates' },
    { id: 'blocks' as LeftTab, icon: 'M12 4v16m8-8H4', label: 'Blocs' },
    { id: 'layers' as LeftTab, icon: 'M6 6h12M6 10h12M6 14h12', label: 'Calques' },
    { id: 'settings' as LeftTab, icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Réglages' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0d] overflow-hidden select-none">

      {/* ══ Top Bar ══════════════════════════════════════════════════════════════ */}
      <div className="h-11 bg-[#111] border-b border-[#1e1e1e] flex items-center px-3 gap-2.5 shrink-0 z-30">
        {/* Back */}
        <button onClick={() => navigate('/admin/landing-pages')} className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[11px] font-semibold">Pages</span>
        </button>
        <div className="w-px h-4 bg-[#2a2a2a]" />

        {/* Site name */}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" /></svg>
          </div>
          <span className="text-slate-200 text-[12px] font-bold">{page?.slug || tenantId}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${page?.isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#2a2a2a] text-slate-500'}`}>
            {page?.isPublished ? 'Publié' : 'Brouillon'}
          </span>
        </div>

        {/* Center: device switcher */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-0.5 gap-0.5">
            {(['desktop', 'tablet', 'mobile'] as Device[]).map(d => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${device === d ? 'bg-[#2a2a2a] text-white' : 'text-slate-600 hover:text-slate-400'}`}
              >
                {d === 'desktop' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" /></svg>}
                {d === 'tablet' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" /></svg>}
                {d === 'mobile' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>}
                <span className="text-[10px] font-semibold hidden sm:inline">{DEVICE_WIDTHS[d]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Undo/Redo */}
          <div className="flex gap-0.5">
            <button onClick={undo} disabled={historyIdx <= 0} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-colors" title="Annuler ⌘Z">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
            </button>
            <button onClick={redo} disabled={historyIdx >= history.length - 1} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-colors" title="Refaire ⌘Y">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
            </button>
          </div>
          <div className="w-px h-4 bg-[#2a2a2a]" />
          {/* AI */}
          <button onClick={() => setShowAI(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-600/15 border border-violet-500/20 text-violet-300 hover:bg-violet-600/25 transition-colors text-[11px] font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            IA
          </button>
          {/* Save status */}
          <div className="w-16 text-right text-[10px]">
            {saving && <span className="text-slate-600 animate-pulse">Sauvegarde…</span>}
            {saved && !saving && <span className="text-emerald-400 font-semibold">✓ Sauvegardé</span>}
          </div>
          {/* Preview */}
          {page?.slug && (
            <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#2a2a2a] text-slate-500 hover:text-white hover:border-[#444] transition-all text-[11px] font-semibold"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
              Aperçu
            </a>
          )}
          {/* Publish */}
          <button onClick={handlePublish} disabled={publishing}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              page?.isPublished
                ? 'bg-[#252525] text-slate-400 hover:bg-[#2e2e2e] border border-[#3a3a3a]'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25'
            }`}
          >
            {publishing ? '…' : page?.isPublished ? 'Dépublier' : 'Publier'}
          </button>
        </div>
      </div>

      {/* ══ Main area ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left icon rail ──────────────────────────────────────────────────── */}
        <div className="w-[46px] bg-[#0d0d0d] border-r border-[#1e1e1e] flex flex-col items-center py-2 gap-0.5 shrink-0 z-20">
          {LEFT_TABS.map(tab => {
            const isActive = leftTab === tab.id && !leftCollapsed;
            return (
              <button
                key={tab.id}
                title={tab.label}
                onClick={() => {
                  if (leftTab === tab.id) setLeftCollapsed(!leftCollapsed);
                  else { setLeftTab(tab.id); setLeftCollapsed(false); }
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.id === 'layers' && sections.length > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">{sections.length > 9 ? '9+' : sections.length}</span>
                  </div>
                )}
              </button>
            );
          })}
          <div className="mt-auto">
            <button
              onClick={() => setLeftCollapsed(!leftCollapsed)}
              title={leftCollapsed ? 'Ouvrir panneau' : 'Fermer panneau'}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-400 hover:bg-white/5 transition-all"
            >
              <svg className="w-3.5 h-3.5 transition-transform duration-200" style={{ transform: leftCollapsed ? 'rotate(180deg)' : 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Left expandable panel ───────────────────────────────────────────── */}
        {!leftCollapsed && (
          <div className="w-[260px] bg-[#141414] border-r border-[#1e1e1e] flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-[#1e1e1e] shrink-0 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {leftTab === 'templates' && 'Templates'}
                {leftTab === 'blocks' && `Blocs · ${SECTION_META.length} éléments`}
                {leftTab === 'layers' && `Calques · ${sections.length} section${sections.length !== 1 ? 's' : ''}`}
                {leftTab === 'settings' && 'Réglages du site'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {leftTab === 'templates' && <TemplatesPanel onApply={applyTemplate} />}
              {leftTab === 'blocks' && <BlocksPanel onAdd={addSection} accent={accent} />}
              {leftTab === 'layers' && (
                <LayersPanel
                  sections={sections}
                  selectedId={selectedId}
                  onSelect={id => setSelectedId(id)}
                  onReorder={secs => updateSections(secs)}
                  onToggleVisible={toggleVisible}
                  onDelete={deleteSection}
                />
              )}
              {leftTab === 'settings' && page && (
                <SettingsPanel page={page} onChange={updatePageMeta} accent={accent} setAccent={setAccent} />
              )}
            </div>
            {leftTab === 'layers' && sections.length > 0 && (
              <div className="border-t border-[#1e1e1e] px-3 py-2 shrink-0">
                <button
                  onClick={() => { setLeftTab('blocks'); }}
                  className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-blue-400 hover:bg-blue-500/10 transition-colors border border-dashed border-blue-500/25 hover:border-blue-500/50"
                >
                  + Ajouter une section
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Canvas ─────────────────────────────────────────────────────────── */}
        <div
          className="flex-1 bg-[#0a0a0a] overflow-auto"
          onClick={() => setSelectedId(null)}
          onDragOver={e => { e.preventDefault(); }}
          onDragLeave={() => setDropTargetIdx(null)}
        >
          <div className="min-h-full flex justify-center py-8 px-6">
            <div
              className="bg-white shadow-2xl shadow-black/50 transition-all duration-300 rounded-sm relative"
              style={{ width: device === 'desktop' ? '100%' : DEVICE_WIDTHS[device], maxWidth: DEVICE_WIDTHS[device] }}
              onClick={e => e.stopPropagation()}
            >
              {/* Browser chrome */}
              <div className="h-8 bg-[#e8e8e8] flex items-center px-3 gap-1.5 border-b border-[#d0d0d0] sticky top-0 z-10 rounded-t-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <div className="flex-1 mx-3 h-4 bg-white rounded text-[10px] flex items-center px-2 text-slate-400 font-mono truncate">
                  medicom.ma/{page?.slug || '…'}
                </div>
              </div>

              {sections.length === 0 ? (
                /* ── Empty state ── */
                <div
                  className="py-20 flex flex-col items-center gap-6 text-center px-8 min-h-[400px] justify-center"
                  onDragOver={e => { e.preventDefault(); setDropTargetIdx(0); }}
                  onDrop={e => handleCanvasDrop(e, 0)}
                >
                  {dropTargetIdx === 0 ? (
                    <div className="w-full h-32 rounded-2xl border-2 border-dashed border-blue-500 flex items-center justify-center bg-blue-500/5">
                      <p className="text-blue-400 font-semibold text-sm">Déposer ici</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-[#f8f8f8] border-2 border-[#eee] flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-lg">Page vide</p>
                        <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">Choisissez un template ou faites glisser des blocs depuis le panneau gauche.</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setLeftTab('templates'); setLeftCollapsed(false); }} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
                          Choisir un template
                        </button>
                        <button onClick={() => { setLeftTab('blocks'); setLeftCollapsed(false); }} className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors">
                          Ajouter des blocs
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  {/* Initial drop zone */}
                  <DropZone
                    index={0}
                    active={dropTargetIdx === 0}
                    onDragOver={() => setDropTargetIdx(0)}
                    onDrop={() => {
                      /* handled by placeholder — real drop is on the dragend of the section */
                    }}
                    onDragLeave={() => setDropTargetIdx(null)}
                  />

                  {sections.map((section, i) => {
                    const isSelected = section.id === selectedId;
                    const meta = getSectionMeta(section.type);
                    return (
                      <React.Fragment key={section.id}>
                        {/* Drop zone before section */}
                        <div
                          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropTargetIdx(i); }}
                          onDrop={e => handleCanvasDrop(e, i)}
                          onDragLeave={() => setDropTargetIdx(null)}
                          className={`transition-all duration-150 ${dropTargetIdx === i ? 'h-8' : 'h-0'}`}
                        >
                          {dropTargetIdx === i && (
                            <div className="mx-4 h-full flex items-center">
                              <div className="w-full h-0.5 rounded-full bg-blue-500 flex items-center justify-center relative">
                                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow absolute" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section */}
                        <div
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData(DRAG_MOVE, section.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={e => { e.stopPropagation(); setSelectedId(section.id); }}
                          className={[
                            'relative cursor-pointer transition-all group/section',
                            !section.visible ? 'opacity-40' : '',
                            isSelected ? 'ring-2 ring-blue-500 ring-inset' : 'hover:ring-1 hover:ring-blue-300/60 hover:ring-inset',
                          ].join(' ')}
                        >
                          {/* Floating toolbar (selected) */}
                          {isSelected && (
                            <SectionToolbar
                              visible={section.visible}
                              canUp={i > 0}
                              canDown={i < sections.length - 1}
                              onMoveUp={() => moveSectionUp(section.id)}
                              onMoveDown={() => moveSectionDown(section.id)}
                              onDuplicate={() => duplicateSection(section.id)}
                              onToggle={() => toggleVisible(section.id)}
                              onDelete={() => deleteSection(section.id)}
                            />
                          )}

                          {/* Section type badge (hover) */}
                          {!isSelected && (
                            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover/section:opacity-100 transition-opacity">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${meta.bg}`}>
                                <svg className={`w-2.5 h-2.5 ${meta.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d={meta.iconPath} />
                                </svg>
                                <span className={`text-[10px] font-bold ${meta.accent}`}>{meta.label}</span>
                              </div>
                            </div>
                          )}

                          {/* Section index (selected) */}
                          {isSelected && (
                            <div className="absolute top-2 left-2 z-10">
                              <div className="flex items-center gap-1.5 bg-blue-600 px-2 py-1 rounded-lg">
                                <span className="text-[10px] font-bold text-white">{i + 1}</span>
                                <span className="text-[10px] text-white/80">{meta.label}</span>
                              </div>
                            </div>
                          )}

                          {/* Section preview */}
                          <SectionLivePreview section={section} accent={accent} />

                          {/* Between-section add button (hover when not selected) */}
                          {!isSelected && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 opacity-0 group-hover/section:opacity-100 transition-opacity">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setLeftTab('blocks');
                                  setLeftCollapsed(false);
                                  setSelectedId(null);
                                }}
                                className="w-7 h-7 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                title="Insérer une section après"
                              >
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Drop zone after section */}
                        <div
                          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropTargetIdx(i + 1); }}
                          onDrop={e => handleCanvasDrop(e, i + 1)}
                          onDragLeave={() => setDropTargetIdx(null)}
                          className={`transition-all duration-150 ${dropTargetIdx === i + 1 ? 'h-8' : 'h-0'}`}
                        >
                          {dropTargetIdx === i + 1 && (
                            <div className="mx-4 h-full flex items-center">
                              <div className="w-full h-0.5 rounded-full bg-blue-500 flex items-center justify-center relative">
                                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow absolute" />
                              </div>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* Append section button */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDropTargetIdx(sections.length); }}
                    onDrop={e => handleCanvasDrop(e, sections.length)}
                    className="py-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50/50 transition-colors border-2 border-dashed border-slate-200 m-4 rounded-2xl"
                    onClick={e => { e.stopPropagation(); setLeftTab('blocks'); setLeftCollapsed(false); }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${dropTargetIdx === sections.length ? 'bg-blue-600 scale-110' : 'bg-slate-100'}`}>
                      <svg className={`w-4 h-4 ${dropTargetIdx === sections.length ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                      {dropTargetIdx === sections.length ? 'Déposer ici' : 'Ajouter une section'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel (dark properties) ─────────────────────────────────── */}
        <div className={`${!selectedSection ? 'w-0 border-0' : 'w-[290px] border-l border-[#1e1e1e]'} bg-[#141414] flex flex-col shrink-0 transition-all duration-200 overflow-hidden`}>
          {selectedSection && (
            <>
              <div className="h-11 px-4 flex items-center justify-between border-b border-[#1e1e1e] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${getSectionMeta(selectedSection.type).bg} ${getSectionMeta(selectedSection.type).accent}`}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={getSectionMeta(selectedSection.type).iconPath} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate">{getSectionMeta(selectedSection.type).label}</p>
                    <p className="text-[9px] text-slate-600">Section {selectedIdx + 1} / {sections.length}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/8 transition-colors shrink-0" title="Fermer (Esc)">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SectionEditorPanel section={selectedSection} onChange={updateSectionContent} />
              </div>
              {/* Quick actions footer */}
              <div className="border-t border-[#1e1e1e] px-3 py-2 shrink-0 flex gap-2">
                <button onClick={() => duplicateSection(selectedSection.id)} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/8 transition-colors border border-[#2a2a2a] hover:border-[#3a3a3a] flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                  Dupliquer
                </button>
                <button onClick={() => deleteSection(selectedSection.id)} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-[#2a2a2a] hover:border-red-500/30 flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom status bar ───────────────────────────────────────────────── */}
      <div className="h-7 bg-[#0d0d0d] border-t border-[#1e1e1e] flex items-center px-4 gap-4 shrink-0 z-30">
        <span className="text-[10px] text-slate-700">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
        <div className="w-px h-3 bg-[#2a2a2a]" />
        <span className="text-[10px] text-slate-700">{device} · {DEVICE_WIDTHS[device]}px</span>
        <div className="w-px h-3 bg-[#2a2a2a]" />
        <span className="text-[10px] text-slate-700">⌘Z annuler · ⌘Y refaire · Esc désélectionner</span>
        <div className="ml-auto flex items-center gap-2">
          {page?.isPublished && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-semibold">En ligne</span>
            </div>
          )}
          <span className="text-[10px] text-slate-700 font-mono">v0.15</span>
        </div>
      </div>

      {/* AI Generator */}
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
