import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { getLandingPageBySlug } from '../lib/api/landingPages';
import type { LandingPage, PageSection } from '../types';
import type {
  HeroContent, AboutContent, ServicesContent, DoctorsContent,
  BookingContent, BookingWidgetContent, TestimonialsContent, FAQContent, ContactContent, HoursContent,
} from './LandingPageBuilder/sectionConfig';

const BookingModal = lazy(() =>
  import('./PublicBooking/BookingModal').then(m => ({ default: m.BookingModal }))
);

const InlineBookingWidget = lazy(() =>
  import('./PublicBooking/InlineBookingWidget').then(m => ({ default: m.InlineBookingWidget }))
);

// ─── Sub-screens ──────────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      <span className="text-sm text-slate-400">Chargement…</span>
    </div>
  </div>
);

const NotFoundScreen = ({ slug }: { slug?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center max-w-sm px-6">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Page introuvable</h1>
      <p className="text-sm text-slate-500">
        {slug ? `Aucun cabinet actif à l'adresse « ${slug} ».` : "Cette page n'existe pas ou n'est pas encore publiée."}
      </p>
    </div>
  </div>
);

// ─── Shared icons ─────────────────────────────────────────────────────────────

const PhoneIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const MailIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const MapPinIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

// ─── Section renderers ────────────────────────────────────────────────────────

function HeroSection({ content, accent, clinicName, phone }: {
  content: HeroContent; accent: string; clinicName: string; phone?: string | null;
}) {
  const c = content;
  if (c.backgroundImage) {
    return (
      <section className="relative min-h-[480px] sm:min-h-[580px] flex items-end overflow-hidden">
        <img src={c.backgroundImage} alt={clinicName} className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, rgba(0,0,0,${(c.overlayOpacity ?? 50) / 100}) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)` }}
        />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-8 pb-16 pt-24">
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight drop-shadow">{c.headline || clinicName}</h1>
          {c.subheadline && <p className="mt-4 text-white/80 text-lg sm:text-xl max-w-xl leading-relaxed">{c.subheadline}</p>}
          {(c.ctaText && phone) && (
            <a
              href={`tel:${phone}`}
              className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
              style={{ backgroundColor: accent }}
            >
              <PhoneIcon className="w-4 h-4" />
              {c.ctaText}
            </a>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className="py-28 px-6 text-center"
      style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)` }}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-8 flex items-center justify-center"
          style={{ backgroundColor: `${accent}20` }}
        >
          <svg className="w-7 h-7" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900">{c.headline || clinicName}</h1>
        {c.subheadline && <p className="mt-5 text-slate-600 text-lg sm:text-xl leading-relaxed">{c.subheadline}</p>}
        {(c.ctaText && phone) && (
          <a
            href={`tel:${phone}`}
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: accent }}
          >
            <PhoneIcon className="w-4 h-4" />
            {c.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

function AboutSection({ content }: { content: AboutContent }) {
  const c = content;
  const textBlock = (
    <div className="flex-1">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">{c.heading}</h2>
      <p className="text-slate-600 leading-relaxed text-base sm:text-lg">{c.body}</p>
    </div>
  );
  const imageBlock = c.imageUrl ? (
    <div className="flex-1">
      <img src={c.imageUrl} alt={c.heading} className="w-full h-64 sm:h-80 object-cover rounded-2xl" />
    </div>
  ) : null;

  return (
    <section className="py-20 px-6 bg-white">
      <div className={`max-w-4xl mx-auto flex flex-col ${imageBlock ? 'sm:flex-row' : ''} gap-12 items-center`}>
        {c.imagePosition === 'left' ? <>{imageBlock}{textBlock}</> : <>{textBlock}{imageBlock}</>}
      </div>
    </section>
  );
}

function ServicesSection({ content, accent }: { content: ServicesContent; accent: string }) {
  const c = content;
  return (
    <section className="py-20 px-6 bg-slate-50/60">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12 text-center">{c.heading}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {c.items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DoctorsSection({ content, accent }: { content: DoctorsContent; accent: string }) {
  const c = content;
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12 text-center">{c.heading}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {c.items.map((doc) => (
            <div key={doc.id} className="text-center">
              {doc.photoUrl ? (
                <img src={doc.photoUrl} alt={doc.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md" />
              ) : (
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white shadow-md"
                  style={{ backgroundColor: accent }}
                >
                  {doc.name.charAt(0)}
                </div>
              )}
              <p className="font-bold text-slate-900">{doc.name}</p>
              <p className="text-sm font-medium mb-2" style={{ color: accent }}>{doc.title}</p>
              {doc.bio && <p className="text-xs text-slate-500 leading-relaxed">{doc.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingSection({ content, accent, onBookingClick }: { content: BookingContent; accent: string; onBookingClick: () => void }) {
  const c = content;
  return (
    <section className="py-20 px-6" style={{ backgroundColor: accent }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{c.heading}</h2>
        {c.body && <p className="text-white/75 text-base mb-8 leading-relaxed">{c.body}</p>}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onBookingClick}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white font-bold text-base hover:opacity-90 transition-opacity shadow-lg"
            style={{ color: accent }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {c.buttonText || 'Prendre rendez-vous'}
          </button>
          {c.phone && (
            <a
              href={`tel:${c.phone}`}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              <PhoneIcon className="w-4 h-4" />
              {c.phone}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ content }: { content: TestimonialsContent }) {
  const c = content;
  return (
    <section className="py-20 px-6 bg-slate-50/60">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12 text-center">{c.heading}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {c.items.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < t.rating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{t.author}</p>
                {t.role && <p className="text-xs text-slate-400">{t.role}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ content, accent }: { content: FAQContent; accent: string }) {
  const c = content;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10 text-center">{c.heading}</h2>
        <div className="space-y-3">
          {c.items.map((faq) => (
            <div key={faq.id} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-900 text-sm pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${open === faq.id ? 'rotate-180' : ''}`}
                  style={{ color: accent }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === faq.id && (
                <div className="px-6 pb-5">
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ content, accent }: { content: ContactContent; accent: string }) {
  const c = content;
  return (
    <section className="py-20 px-6 bg-slate-50/60">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10 text-center">{c.heading}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {c.phone && (
            <a
              href={`tel:${c.phone}`}
              className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15`, color: accent }}>
                <PhoneIcon />
              </div>
              <p className="text-sm font-semibold text-slate-700">{c.phone}</p>
            </a>
          )}
          {c.email && (
            <a
              href={`mailto:${c.email}`}
              className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow text-center"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15`, color: accent }}>
                <MailIcon />
              </div>
              <p className="text-sm font-semibold text-slate-700">{c.email}</p>
            </a>
          )}
          {c.address && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15`, color: accent }}>
                <MapPinIcon />
              </div>
              <p className="text-sm font-semibold text-slate-700">{c.address}</p>
              {c.googleMapsUrl && (
                <a href={c.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold hover:opacity-75 transition-opacity" style={{ color: accent }}>
                  Voir sur Maps →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HoursSection({ content, accent }: { content: HoursContent; accent: string }) {
  const c = content;
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-sm mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">{c.heading}</h2>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          {c.schedule.map((row, i) => (
            <div
              key={row.id}
              className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? 'border-t border-slate-50' : ''} ${row.closed ? 'opacity-50' : ''}`}
            >
              <span className="text-sm font-semibold text-slate-700">{row.day}</span>
              {row.closed ? (
                <span className="text-xs text-slate-400 font-medium px-2.5 py-1 bg-slate-50 rounded-full">Fermé</span>
              ) : (
                <span className="text-sm text-slate-600 font-medium" style={{ color: accent }}>{row.hours}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionRenderer({ section, accent, page, onBookingClick }: { section: PageSection; accent: string; page: LandingPage; onBookingClick: () => void }) {
  const c = section.content as Record<string, unknown>;
  switch (section.type) {
    case 'hero':           return <HeroSection content={c as unknown as HeroContent} accent={accent} clinicName={page.headline ?? page.slug} phone={page.contactPhone} />;
    case 'about':          return <AboutSection content={c as unknown as AboutContent} />;
    case 'services':       return <ServicesSection content={c as unknown as ServicesContent} accent={accent} />;
    case 'doctors':        return <DoctorsSection content={c as unknown as DoctorsContent} accent={accent} />;
    case 'booking':        return <BookingSection content={c as unknown as BookingContent} accent={accent} onBookingClick={onBookingClick} />;
    case 'booking_widget': {
      const wc = c as unknown as BookingWidgetContent;
      return (
        <Suspense fallback={null}>
          <InlineBookingWidget page={page} heading={wc.heading} body={wc.body} />
        </Suspense>
      );
    }
    case 'testimonials':   return <TestimonialsSection content={c as unknown as TestimonialsContent} />;
    case 'faq':            return <FAQSection content={c as unknown as FAQContent} accent={accent} />;
    case 'contact':        return <ContactSection content={c as unknown as ContactContent} accent={accent} />;
    case 'hours':          return <HoursSection content={c as unknown as HoursContent} accent={accent} />;
    default:               return null;
  }
}

// ─── Fallback layout (no sections configured yet) ─────────────────────────────

function FallbackLayout({ page, accent, clinicName, onBookingClick }: { page: LandingPage; accent: string; clinicName: string; onBookingClick: () => void }) {
  return (
    <>
      {/* Hero */}
      {page.heroImageUrl ? (
        <section className="relative h-72 sm:h-[420px] overflow-hidden">
          <img src={page.heroImageUrl} alt={clinicName} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight drop-shadow-sm">{clinicName}</h1>
            {page.description && <p className="mt-3 text-white/80 text-base sm:text-lg max-w-xl leading-relaxed">{page.description}</p>}
          </div>
        </section>
      ) : (
        <section className="py-24 px-6 text-center" style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)` }}>
          <div className="max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
              <svg className="w-7 h-7" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{clinicName}</h1>
            {page.description && <p className="mt-4 text-slate-600 text-lg leading-relaxed">{page.description}</p>}
            {page.city && <p className="mt-2 text-sm font-semibold uppercase tracking-widest" style={{ color: accent }}>{page.city}</p>}
          </div>
        </section>
      )}

      {/* CTA strip */}
      <div style={{ backgroundColor: accent }} className="py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white">
            <p className="font-bold text-lg">Prendre un rendez-vous</p>
            <p className="text-white/70 text-sm">Consultation disponible 6j/7</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBookingClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ color: accent }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Réserver en ligne
            </button>
            {page.contactPhone && (
              <a href={`tel:${page.contactPhone}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                <PhoneIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{page.contactPhone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <section className="py-16 px-6 bg-slate-50/60">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(page.contactPhone || page.contactEmail) && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15`, color: accent }}>
                <PhoneIcon />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-3">Contact</h3>
                {page.contactPhone && (
                  <a href={`tel:${page.contactPhone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-2">
                    <PhoneIcon className="w-4 h-4" />{page.contactPhone}
                  </a>
                )}
                {page.contactEmail && (
                  <a href={`mailto:${page.contactEmail}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    <MailIcon className="w-4 h-4" />{page.contactEmail}
                  </a>
                )}
              </div>
            </div>
          )}
          {(page.addressDisplay || page.city) && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15`, color: accent }}>
                <MapPinIcon />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-3">Adresse</h3>
                {page.addressDisplay && <p className="text-sm text-slate-600 mb-1">{page.addressDisplay}</p>}
                {page.city && <p className="text-sm font-semibold text-slate-700">{page.city}</p>}
                {page.googleMapsUrl && (
                  <a href={page.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold hover:opacity-75 transition-opacity" style={{ color: accent }}>
                    Voir sur Google Maps →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {page.googleMapsUrl && (
        <section className="h-64 bg-slate-100">
          <a href={page.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="relative flex items-center justify-center h-full group" style={{ background: `linear-gradient(135deg, ${accent}12, ${accent}06)` }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-105" style={{ backgroundColor: accent }}>
                <MapPinIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Voir sur Google Maps</span>
            </div>
          </a>
        </section>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const PublicLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    getLandingPageBySlug(slug).then((data) => {
      if (!data) setNotFound(true);
      else setPage(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <LoadingScreen />;
  if (notFound || !page) return <NotFoundScreen slug={slug} />;

  const accent = page.accentColor || '#136cfb';
  const clinicName = page.headline ?? page.slug;
  const visibleSections = (page.sectionsJson ?? []).filter((s) => s.visible);
  const hasSections = visibleSections.length > 0;
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif', color: '#0f172a' }}>

      {/* Booking modal */}
      {bookingOpen && (
        <Suspense fallback={null}>
          <BookingModal page={page} onClose={() => setBookingOpen(false)} />
        </Suspense>
      )}

      {/* Sticky nav */}
      <nav style={{ borderBottom: '1px solid #f1f5f9' }} className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">{clinicName}</span>
          <div className="flex items-center gap-2">
            {page.contactPhone && (
              <a
                href={`tel:${page.contactPhone}`}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
                {page.contactPhone}
              </a>
            )}
            <button
              onClick={() => setBookingOpen(true)}
              style={{ backgroundColor: accent }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Prendre RDV</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      {hasSections
        ? visibleSections.map((section) => (
            <SectionRenderer key={section.id} section={section} accent={accent} page={page} onBookingClick={() => setBookingOpen(true)} />
          ))
        : <FallbackLayout page={page} accent={accent} clinicName={clinicName} onBookingClick={() => setBookingOpen(true)} />
      }

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">{clinicName}</p>
          <p className="text-xs text-slate-400">
            Propulsé par{' '}
            <span className="font-semibold" style={{ color: accent }}>Medicom</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
