import React, { useState } from 'react';
import type { PageSection } from '../../types';
import { createSection } from './sectionConfig';
import { supabase } from '../../lib/supabase';
import { useMedicomStore } from '../../store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Intake {
  clinicName: string;
  specialty: string;
  city: string;
  doctorName: string;
  doctorTitle: string;
  differentiator: string;
  phone: string;
}

interface Props {
  onClose: () => void;
  onGenerate: (sections: PageSection[]) => void;
  landingPageId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  'Dentisterie générale',
  'Orthodontie',
  'Médecine générale',
  'Pédiatrie',
  'Dermatologie',
  'Gynécologie',
  'Ophtalmologie',
  'Cardiologie',
  'Kinésithérapie',
  'Psychologie',
  'Autre',
];

const GENERATION_STEPS = [
  'Analyse des informations…',
  'Rédaction du contenu…',
  'Optimisation SEO…',
  'Finalisation des sections…',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSections(intake: Intake): PageSection[] {
  const { clinicName, specialty, city, doctorName, doctorTitle, differentiator, phone } = intake;
  const cityLower = city.toLowerCase();
  const specialtyLower = specialty.toLowerCase();

  const make = (type: Parameters<typeof createSection>[0], content: Record<string, unknown>): PageSection => {
    const s = createSection(type);
    s.content = content;
    return s;
  };

  return [
    make('hero', { headline: `${clinicName} — ${specialty} à ${city}`, subheadline: differentiator || `Des soins de qualité au cœur de ${city}`, ctaText: 'Prendre rendez-vous', backgroundImage: '', overlayOpacity: 50 }),
    make('about', { heading: `Votre cabinet de ${specialtyLower} à ${city}`, body: `${clinicName} est un cabinet de ${specialtyLower} situé à ${city}, fondé par ${doctorName}. ${differentiator ? differentiator + '.' : ''} Notre équipe s'engage à vous offrir des soins personnalisés dans un environnement moderne et chaleureux.`, imageUrl: '', imagePosition: 'right' }),
    make('services', { heading: `Nos soins en ${specialtyLower}`, items: getDefaultServices(specialty) }),
    make('doctors', { heading: 'Notre équipe', items: [{ id: 'd1', name: doctorName, title: doctorTitle || specialty, photoUrl: '', bio: `Praticien expérimenté en ${specialtyLower}, ${doctorName} accompagne ses patients avec rigueur et bienveillance.` }] }),
    make('booking', { heading: 'Réservez votre consultation', body: `Prenez rendez-vous en ligne ou appelez-nous directement. Cabinet ouvert du lundi au samedi à ${city}.`, buttonText: 'Appeler maintenant', phone }),
    make('testimonials', { heading: 'Ce que disent nos patients', items: [
      { id: 't1', author: 'Karim B.', role: `Patient à ${city}`, text: `Cabinet ${clinicName} excellent, je recommande vivement ! Équipe très professionnelle et à l'écoute.`, rating: 5 },
      { id: 't2', author: 'Fatima Z.', role: 'Patiente fidèle', text: `${doctorName} est un praticien remarquable. Prise en charge rapide et soins de qualité.`, rating: 5 },
    ]}),
    make('faq', { heading: 'Questions fréquentes', items: getDefaultFAQ(specialty, city, clinicName) }),
    make('contact', { heading: 'Nous contacter', phone, email: '', address: `${clinicName}, ${city}, Maroc`, googleMapsUrl: '' }),
    (() => { const s = createSection('hours'); return { ...s, content: { ...s.content, heading: 'Horaires d\'ouverture' } }; })(),
  ];
}

function getDefaultServices(specialty: string) {
  const map: Record<string, { id: string; icon: string; title: string; description: string }[]> = {
    'Dentisterie générale': [
      { id: 's1', icon: '🦷', title: 'Détartrage & Prophylaxie', description: 'Nettoyage professionnel et prévention des caries' },
      { id: 's2', icon: '✨', title: 'Blanchiment dentaire', description: 'Retrouvez un sourire éclatant et naturel' },
      { id: 's3', icon: '🔬', title: 'Soins conservateurs', description: 'Traitement des caries et restaurations esthétiques' },
    ],
    'Orthodontie': [
      { id: 's1', icon: '😁', title: 'Bagues métalliques', description: 'Solution classique et efficace pour tous les cas' },
      { id: 's2', icon: '🦷', title: 'Aligneurs transparents', description: 'Traitement discret et confortable' },
      { id: 's3', icon: '📐', title: 'Contention', description: 'Maintien du résultat après traitement' },
    ],
    'Médecine générale': [
      { id: 's1', icon: '🩺', title: 'Consultation générale', description: 'Diagnostic et prise en charge globale' },
      { id: 's2', icon: '💉', title: 'Vaccination', description: 'Programme vaccinal complet adultes et enfants' },
      { id: 's3', icon: '📋', title: 'Certificats médicaux', description: 'Sport, aptitude, arrêts de travail' },
    ],
  };
  return map[specialty] ?? [
    { id: 's1', icon: '🏥', title: 'Consultation', description: 'Prise en charge personnalisée' },
    { id: 's2', icon: '🔬', title: 'Examens', description: 'Bilan et diagnostics spécialisés' },
    { id: 's3', icon: '💊', title: 'Suivi', description: 'Accompagnement sur le long terme' },
  ];
}

function getDefaultFAQ(specialty: string, city: string, clinicName: string) {
  return [
    {
      id: 'f1',
      question: 'Comment prendre rendez-vous au cabinet ?',
      answer: `Vous pouvez réserver en ligne directement sur cette page, ou nous appeler. Le cabinet ${clinicName} vous accueille à ${city}.`,
    },
    {
      id: 'f2',
      question: 'Acceptez-vous les nouvelles mutuelles ?',
      answer: 'Oui, nous travaillons avec la plupart des organismes de complémentaire santé. Contactez-nous pour vérifier votre couverture.',
    },
    {
      id: 'f3',
      question: `Quels sont vos délais de prise en charge en ${specialty.toLowerCase()} ?`,
      answer: 'Nous proposons des consultations sous 48h pour les cas urgents, et dans la semaine pour les consultations de routine.',
    },
    {
      id: 'f4',
      question: 'Le cabinet est-il accessible aux personnes à mobilité réduite ?',
      answer: 'Oui, notre cabinet est entièrement accessible. Merci de nous prévenir lors de votre prise de rendez-vous.',
    },
  ];
}

// ─── Input component ──────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 text-[13px] border border-slate-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-300';

// ─── Main component ───────────────────────────────────────────────────────────

export const AIGenerator: React.FC<Props> = ({ onClose, onGenerate, landingPageId }) => {
  const currentTenant = useMedicomStore((s) => s.currentTenant);
  const [step, setStep] = useState<'form' | 'generating' | 'done'>('form');
  const [generatingIdx, setGeneratingIdx] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [intake, setIntake] = useState<Intake>({
    clinicName: '',
    specialty: 'Dentisterie générale',
    city: '',
    doctorName: '',
    doctorTitle: '',
    differentiator: '',
    phone: '',
  });

  const set = (k: keyof Intake) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setIntake(prev => ({ ...prev, [k]: e.target.value }));

  const canSubmit = intake.clinicName.trim() && intake.city.trim() && intake.doctorName.trim();

  const handleGenerate = async () => {
    setStep('generating');
    setGeneratingIdx(0);
    setAiError(null);

    // Animate progress steps while waiting for AI
    let idx = 0;
    const tick = setInterval(() => {
      idx = Math.min(idx + 1, GENERATION_STEPS.length - 1);
      setGeneratingIdx(idx);
    }, 1200);

    try {
      // Use Supabase edge function when available, else fall back to local template
      if (supabase && landingPageId && currentTenant) {
        const { data, error } = await supabase.functions.invoke('generate-landing-page', {
          body: {
            intake: {
              clinicName:    intake.clinicName,
              specialty:     intake.specialty,
              city:          intake.city,
              doctorName:    intake.doctorName,
              doctorTitle:   intake.doctorTitle,
              doctorYears:   0,
              differentiator: intake.differentiator,
              phone:         intake.phone,
              mainServices:  [],
            },
            tenant_id:       currentTenant.id,
            landing_page_id: landingPageId,
          },
        });
        clearInterval(tick);
        if (error) throw error;
        // Edge function already wrote sections to DB — reload the page to pick them up
        onGenerate([]);
      } else {
        // Demo mode: generate locally
        await new Promise<void>((res) => setTimeout(res, GENERATION_STEPS.length * 1200));
        clearInterval(tick);
        const sections = generateSections(intake);
        onGenerate(sections);
      }
      setStep('done');
    } catch (err) {
      clearInterval(tick);
      setAiError(err instanceof Error ? err.message : String(err));
      setStep('form');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-[10px] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900 leading-tight">Générer avec l'IA</p>
              <p className="text-[11px] text-slate-400 leading-tight">Créez votre page en 30 secondes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {step === 'form' && (
          <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Nom du cabinet *</label>
                <input className={inputCls} value={intake.clinicName} onChange={set('clinicName')} placeholder="Cabinet Dentaire Al Fath" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Spécialité *</label>
                <select className={inputCls} value={intake.specialty} onChange={set('specialty')}>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Ville *</label>
                <input className={inputCls} value={intake.city} onChange={set('city')} placeholder="Casablanca" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Médecin principal *</label>
                <input className={inputCls} value={intake.doctorName} onChange={set('doctorName')} placeholder="Dr. Amine Benali" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Titre / Spécialité</label>
                <input className={inputCls} value={intake.doctorTitle} onChange={set('doctorTitle')} placeholder="Chirurgien-dentiste" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Téléphone</label>
                <input className={inputCls} type="tel" value={intake.phone} onChange={set('phone')} placeholder="+212 6XX XXX XXX" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Argument différenciateur</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={2}
                  value={intake.differentiator}
                  onChange={set('differentiator')}
                  placeholder="Ex: Seul cabinet avec CBCT à Agdal, 15 ans d'expérience en implantologie…"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="px-5 py-10 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-[14px] font-semibold text-slate-900">{GENERATION_STEPS[generatingIdx]}</p>
              <p className="text-[12px] text-slate-400">Génération de {SECTION_META_COUNT} sections…</p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {GENERATION_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= generatingIdx ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`} />
              ))}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="px-5 py-10 flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[15px] font-semibold text-slate-900">Page générée avec succès !</p>
              <p className="text-[12px] text-slate-400">9 sections créées. Personnalisez chaque section puis publiez.</p>
            </div>
            <button onClick={onClose} className="mt-2 px-5 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-[10px] hover:bg-blue-700 transition-colors">
              Voir l'éditeur
            </button>
          </div>
        )}

        {/* Footer */}
        {step === 'form' && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
            {aiError ? (
              <p className="text-[11px] text-red-500 max-w-[260px] truncate" title={aiError}>{aiError}</p>
            ) : (
              <p className="text-[11px] text-slate-400">* Champs obligatoires</p>
            )}
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-3.5 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-100 rounded-[10px] transition-colors">
                Annuler
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canSubmit}
                className="px-4 py-2 bg-blue-600 text-white text-[12px] font-semibold rounded-[10px] hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Générer la page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SECTION_META_COUNT = 9;
