import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Merges Tailwind CSS classes safely, resolving conflicts.
 * @example cn('px-2 py-1', condition && 'bg-blue-500', 'px-4') → 'py-1 bg-blue-500 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date using date-fns with French locale.
 * @param date - Date object or ISO string
 * @param fmt - date-fns format string (default: 'dd/MM/yyyy')
 */
export function formatDate(date: Date | string, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: fr });
}

/**
 * Formats a date + time in French format.
 * @returns e.g. "18/02/2026 14:30"
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Formats a number as Moroccan Dirham currency.
 * @returns e.g. "1 500,00 MAD"
 */
export function formatCurrency(amount: number): string {
  return (
    new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' MAD'
  );
}

/**
 * Validates a Moroccan phone number.
 * Accepts: +212XXXXXXXXX or 0[5-7]XXXXXXXX
 */
export function validateMoroccanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^(\+212|0)[5-7]\d{8}$/.test(cleaned);
}

/**
 * Generates an invoice number in the format INV-YYYY-NNNN.
 * @example generateInvoiceNumber(2026, 1) → "INV-2026-0001"
 */
export function generateInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(4, '0')}`;
}

/** Insurance type alias matching the existing types.ts convention */
type InsuranceType = 'CNOPS' | 'CNSS' | 'Private' | 'None';

/** Coverage percentages by insurance type */
const COVERAGE_RATES: Record<InsuranceType, number> = {
  CNOPS: 0.8,
  CNSS: 0.7,
  Private: 0,
  None: 0,
};

/**
 * Calculates insurance coverage split for a given amount.
 * @returns Object with patientShare, insuranceShare, and coverage percentage.
 */
export function calculateInsuranceCoverage(
  amount: number,
  type: InsuranceType
): { patientShare: number; insuranceShare: number; coverage: number } {
  const coverage = COVERAGE_RATES[type];
  const insuranceShare = Math.round(amount * coverage * 100) / 100;
  const patientShare = Math.round((amount - insuranceShare) * 100) / 100;
  return { patientShare, insuranceShare, coverage };
}

/**
 * Converts a string to a URL-friendly slug.
 * @example slugify("Dr. Amina Benali") → "dr-amina-benali"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Truncates a string to a maximum length with ellipsis.
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + '…';
}

/**
 * Returns initials from first and last name.
 * @example getInitials("Amina", "Benali") → "AB"
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
