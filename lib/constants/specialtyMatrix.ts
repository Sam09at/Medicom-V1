import type { ClinicSpecialty, ModuleConfiguration } from '../../types';

export const SPECIALTY_LABELS: Record<ClinicSpecialty, string> = {
  dentistry: 'Dentisterie générale',
  orthodontics: 'Orthodontie',
  pediatric_dentistry: 'Pédodontie',
  oral_surgery: 'Chirurgie orale',
  periodontology: 'Parodontologie',
  endodontics: 'Endodontie',
  general_medicine: 'Médecine générale',
  cardiology: 'Cardiologie',
  dermatology: 'Dermatologie',
  psychology: 'Psychologie / Psychiatrie',
  pediatrics: 'Pédiatrie',
  gynecology: 'Gynécologie',
  ophthalmology: 'Ophtalmologie',
  orthopedics: 'Orthopédie',
  ent: 'ORL',
  other: 'Autre spécialité',
};

// Groups: dental specialties get treatments+labOrders; psychology gets neither; medical gets labOrders
export const SPECIALTY_MODULE_DEFAULTS: Record<ClinicSpecialty, ModuleConfiguration> = {
  dentistry:           { dashboard:true, calendar:true, patients:true, treatments:true,  inventory:true,  labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  orthodontics:        { dashboard:true, calendar:true, patients:true, treatments:true,  inventory:true,  labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  pediatric_dentistry: { dashboard:true, calendar:true, patients:true, treatments:true,  inventory:true,  labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  oral_surgery:        { dashboard:true, calendar:true, patients:true, treatments:true,  inventory:true,  labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  periodontology:      { dashboard:true, calendar:true, patients:true, treatments:true,  inventory:true,  labOrders:false, documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  endodontics:         { dashboard:true, calendar:true, patients:true, treatments:true,  inventory:true,  labOrders:false, documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  general_medicine:    { dashboard:true, calendar:true, patients:true, treatments:false, inventory:true,  labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  cardiology:          { dashboard:true, calendar:true, patients:true, treatments:false, inventory:false, labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  dermatology:         { dashboard:true, calendar:true, patients:true, treatments:false, inventory:true,  labOrders:false, documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  psychology:          { dashboard:true, calendar:true, patients:true, treatments:false, inventory:false, labOrders:false, documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  pediatrics:          { dashboard:true, calendar:true, patients:true, treatments:false, inventory:true,  labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  gynecology:          { dashboard:true, calendar:true, patients:true, treatments:false, inventory:true,  labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  ophthalmology:       { dashboard:true, calendar:true, patients:true, treatments:false, inventory:true,  labOrders:false, documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  orthopedics:         { dashboard:true, calendar:true, patients:true, treatments:false, inventory:true,  labOrders:true,  documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  ent:                 { dashboard:true, calendar:true, patients:true, treatments:false, inventory:true,  labOrders:false, documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
  other:               { dashboard:true, calendar:true, patients:true, treatments:false, inventory:false, labOrders:false, documents:true, records:true, billing:true, reports:true, support:true, landingPageBuilder:true },
};

export const PLAN_CONFIG: Record<string, {
  label: string;
  price: number;
  maxUsers: number;
  maxPatients: number | null;
  storage: string;
  color: string;
  popular?: boolean;
  features: string[];
}> = {
  starter: {
    label: 'Starter',
    price: 299,
    maxUsers: 2,
    maxPatients: 500,
    storage: '2 GB',
    color: 'text-slate-700',
    features: ['Calendrier & patients', 'Facturation de base', 'Support email'],
  },
  pro: {
    label: 'Pro',
    price: 599,
    maxUsers: 5,
    maxPatients: 2000,
    storage: '10 GB',
    color: 'text-blue-700',
    popular: true,
    features: ['Tous les modules spécialité', 'Page web publique', 'Laboratoires & stock', 'Support chat'],
  },
  premium: {
    label: 'Premium',
    price: 999,
    maxUsers: 10,
    maxPatients: null,
    storage: '50 GB',
    color: 'text-purple-700',
    features: ['Patients illimités', 'Analytics avancées', 'Multi-docteurs', 'Support prioritaire'],
  },
  enterprise: {
    label: 'Enterprise',
    price: 0,
    maxUsers: 9999,
    maxPatients: null,
    storage: 'Illimité',
    color: 'text-emerald-700',
    features: ['Illimité tout', 'White-label', 'API accès', 'Support dédié'],
  },
};

/** Generates a URL-safe slug from a clinic name */
export function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
}
