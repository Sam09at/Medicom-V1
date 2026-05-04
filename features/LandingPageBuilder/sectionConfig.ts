import type { PageSectionType, PageSection } from '../../types';

// ─── Per-section content interfaces ──────────────────────────────────────────

export interface HeroContent {
  headline: string; subheadline: string; ctaText: string;
  backgroundImage: string; overlayOpacity: number;
}
export interface AboutContent {
  heading: string; body: string; imageUrl: string; imagePosition: 'left' | 'right';
}
export interface ServicesItem { id: string; icon: string; title: string; description: string; }
export interface ServicesContent { heading: string; items: ServicesItem[]; }
export interface DoctorsItem { id: string; name: string; title: string; photoUrl: string; bio: string; }
export interface DoctorsContent { heading: string; items: DoctorsItem[]; }
export interface BookingContent { heading: string; body: string; buttonText: string; phone: string; }
export interface TestimonialsItem { id: string; author: string; role: string; text: string; rating: number; }
export interface TestimonialsContent { heading: string; items: TestimonialsItem[]; }
export interface FAQItem { id: string; question: string; answer: string; }
export interface FAQContent { heading: string; items: FAQItem[]; }
export interface ContactContent { heading: string; phone: string; email: string; address: string; googleMapsUrl: string; }
export interface HoursRow { id: string; day: string; hours: string; closed: boolean; }
export interface HoursContent { heading: string; schedule: HoursRow[]; }

// ─── Section meta ─────────────────────────────────────────────────────────────

export interface SectionMeta {
  type: PageSectionType;
  label: string;
  description: string;
  iconPath: string;
  accent: string;  // text color class
  bg: string;      // bg color class
  defaultContent: Record<string, unknown>;
}

const DEFAULT_DAYS: HoursRow[] = [
  { id: 'lun', day: 'Lundi',    hours: '09:00 – 18:00', closed: false },
  { id: 'mar', day: 'Mardi',    hours: '09:00 – 18:00', closed: false },
  { id: 'mer', day: 'Mercredi', hours: '09:00 – 18:00', closed: false },
  { id: 'jeu', day: 'Jeudi',    hours: '09:00 – 18:00', closed: false },
  { id: 'ven', day: 'Vendredi', hours: '09:00 – 17:00', closed: false },
  { id: 'sam', day: 'Samedi',   hours: '09:00 – 13:00', closed: false },
  { id: 'dim', day: 'Dimanche', hours: '',               closed: true  },
];

export const SECTION_META: SectionMeta[] = [
  {
    type: 'hero',
    label: 'Bannière principale',
    description: 'Grande section d\'accueil avec titre et CTA',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    accent: 'text-blue-600', bg: 'bg-blue-50',
    defaultContent: { headline: 'Cabinet Dentaire Excellence', subheadline: 'Des soins dentaires de qualité pour toute votre famille', ctaText: 'Prendre rendez-vous', backgroundImage: '', overlayOpacity: 50 } satisfies HeroContent,
  },
  {
    type: 'about',
    label: 'À propos',
    description: 'Présentation du cabinet avec texte et photo',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    accent: 'text-violet-600', bg: 'bg-violet-50',
    defaultContent: { heading: 'Notre Cabinet', body: 'Fondé par des praticiens passionnés, notre cabinet vous accueille dans un environnement moderne et bienveillant.', imageUrl: '', imagePosition: 'right' } satisfies AboutContent,
  },
  {
    type: 'services',
    label: 'Services',
    description: 'Liste des soins et prestations proposés',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    accent: 'text-emerald-600', bg: 'bg-emerald-50',
    defaultContent: { heading: 'Nos Services', items: [
      { id: 's1', icon: '🦷', title: 'Détartrage', description: 'Nettoyage professionnel et prévention' },
      { id: 's2', icon: '✨', title: 'Blanchiment', description: 'Retrouvez un sourire éclatant' },
      { id: 's3', icon: '🔬', title: 'Orthodontie', description: 'Correction discrète de l\'alignement' },
    ] } satisfies ServicesContent,
  },
  {
    type: 'doctors',
    label: 'Équipe médicale',
    description: 'Présentation des praticiens du cabinet',
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    accent: 'text-sky-600', bg: 'bg-sky-50',
    defaultContent: { heading: 'Notre Équipe', items: [
      { id: 'd1', name: 'Dr. Amine Benali', title: 'Chirurgien-dentiste', photoUrl: '', bio: 'Spécialiste en prothèse et implantologie.' },
    ] } satisfies DoctorsContent,
  },
  {
    type: 'booking',
    label: 'Prise de RDV',
    description: 'Section CTA pour inciter à réserver',
    iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    accent: 'text-blue-600', bg: 'bg-blue-50',
    defaultContent: { heading: 'Prenez rendez-vous', body: 'Disponible du lundi au samedi. Réservez votre consultation en quelques clics.', buttonText: 'Appeler maintenant', phone: '' } satisfies BookingContent,
  },
  {
    type: 'testimonials',
    label: 'Avis patients',
    description: 'Témoignages et retours d\'expérience',
    iconPath: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    accent: 'text-amber-600', bg: 'bg-amber-50',
    defaultContent: { heading: 'Ce que disent nos patients', items: [
      { id: 't1', author: 'Sarah M.', role: 'Patiente depuis 3 ans', text: 'Cabinet excellent, équipe très professionnelle et bienveillante.', rating: 5 },
    ] } satisfies TestimonialsContent,
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Questions fréquentes et réponses',
    iconPath: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    accent: 'text-rose-600', bg: 'bg-rose-50',
    defaultContent: { heading: 'Questions fréquentes', items: [
      { id: 'f1', question: 'Acceptez-vous les nouvelles mutuelles ?', answer: 'Oui, nous travaillons avec la plupart des organismes de complémentaire santé.' },
      { id: 'f2', question: 'Quels sont vos délais de prise en charge ?', answer: 'Nous proposons des consultations sous 48h pour les urgences.' },
    ] } satisfies FAQContent,
  },
  {
    type: 'contact',
    label: 'Contact',
    description: 'Coordonnées et localisation du cabinet',
    iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    accent: 'text-slate-600', bg: 'bg-slate-50',
    defaultContent: { heading: 'Nous contacter', phone: '', email: '', address: '', googleMapsUrl: '' } satisfies ContactContent,
  },
  {
    type: 'hours',
    label: 'Horaires',
    description: 'Planning d\'ouverture hebdomadaire',
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    accent: 'text-teal-600', bg: 'bg-teal-50',
    defaultContent: { heading: 'Nos Horaires', schedule: DEFAULT_DAYS } satisfies HoursContent,
  },
];

export function getSectionMeta(type: PageSectionType): SectionMeta {
  return SECTION_META.find(m => m.type === type) ?? SECTION_META[0];
}

export function createSection(type: PageSectionType): PageSection {
  const meta = getSectionMeta(type);
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    visible: true,
    content: { ...meta.defaultContent },
  };
}
