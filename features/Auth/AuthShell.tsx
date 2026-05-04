import React from 'react';
import { Link } from 'react-router-dom';

// ─── Brand panel features ─────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Agenda intelligent',
    body: 'Calendrier temps réel, rappels automatiques, zéro double réservation.',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Dossiers patients complets',
    body: 'Historique médical, ordonnances, documents — tout en un.',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Réservation en ligne 24/7',
    body: 'Page publique optimisée SEO, prise de RDV par WhatsApp OTP.',
  },
];

// ─── AuthShell ────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
}

export const AuthShell: React.FC<Props> = ({ children }) => (
  <div className="min-h-screen flex font-sans antialiased">
    {/* ── Left brand panel ─────────────────────────────────────────── */}
    <div className="hidden lg:flex lg:w-[52%] bg-[#0f0f10] flex-col justify-between p-12 relative overflow-hidden select-none">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top: wordmark */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-[8px] flex items-center justify-center shrink-0">
          <span className="text-[#0f0f10] font-bold text-[13px] tracking-tight">M</span>
        </div>
        <span className="text-white font-semibold text-[15px] tracking-tight">Medicom</span>
      </div>

      {/* Center: headline + features */}
      <div className="relative z-10 space-y-10">
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em]">
            Plateforme SaaS médicale
          </p>
          <h2 className="text-[32px] font-semibold text-white leading-tight tracking-tight">
            Le cabinet médical,<br />
            <span className="text-white/50">réinventé.</span>
          </h2>
          <p className="text-[14px] text-white/40 leading-relaxed max-w-xs">
            Gestion patients, agenda, facturation et réservation en ligne — tout ce dont votre cabinet a besoin, en un seul endroit.
          </p>
        </div>

        <div className="space-y-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3.5">
              <div className="w-8 h-8 bg-white/8 rounded-[8px] flex items-center justify-center text-white/60 shrink-0 mt-0.5 border border-white/10">
                {f.icon}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/80 leading-tight">{f.title}</p>
                <p className="text-[12px] text-white/35 mt-0.5 leading-snug">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: testimonial + footer */}
      <div className="relative z-10 space-y-5">
        <div className="border-t border-white/8 pt-5">
          <p className="text-[13px] text-white/40 italic leading-relaxed">
            "Medicom a transformé notre cabinet. Le gain de temps sur l'administratif est immédiat."
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">AB</div>
            <div>
              <p className="text-[12px] font-semibold text-white/50">Dr. Amina Belhaj</p>
              <p className="text-[11px] text-white/25">Cabinet Dentaire, Casablanca</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/20">© 2026 Medicom · SaaS médical marocain</p>
          <div className="flex items-center gap-3 text-[11px] text-white/25">
            <Link to="#" className="hover:text-white/50 transition-colors">Confidentialité</Link>
            <Link to="#" className="hover:text-white/50 transition-colors">CGU</Link>
          </div>
        </div>
      </div>
    </div>

    {/* ── Right form panel ─────────────────────────────────────────── */}
    <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 lg:p-16 min-h-screen">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5 mb-10 self-start">
        <div className="w-7 h-7 bg-[#0f0f10] rounded-[7px] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-[12px]">M</span>
        </div>
        <span className="font-semibold text-slate-900 text-[14px]">Medicom</span>
      </div>

      <div className="w-full max-w-[360px]">
        {children}
      </div>
    </div>
  </div>
);
