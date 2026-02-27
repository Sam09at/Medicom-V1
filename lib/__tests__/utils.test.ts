import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatDateTime,
  formatCurrency,
  validateMoroccanPhone,
  generateInvoiceNumber,
  calculateInsuranceCoverage,
  slugify,
  truncate,
  getInitials,
} from '../utils';

// ── cn() ──
describe('cn()', () => {
  it('merges classes', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });
});

// ── formatDate() ──
describe('formatDate()', () => {
  it('formats ISO string to dd/MM/yyyy by default', () => {
    expect(formatDate('2026-02-18')).toBe('18/02/2026');
  });

  it('formats Date object', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('05/01/2026');
  });

  it('accepts custom format', () => {
    expect(formatDate('2026-02-18', 'yyyy')).toBe('2026');
  });
});

// ── formatDateTime() ──
describe('formatDateTime()', () => {
  it('formats date + time', () => {
    const result = formatDateTime('2026-02-18T14:30:00');
    expect(result).toBe('18/02/2026 14:30');
  });
});

// ── formatCurrency() ──
describe('formatCurrency()', () => {
  it('formats small amount', () => {
    const result = formatCurrency(100);
    // Should contain "100" and "MAD"
    expect(result).toContain('MAD');
    expect(result).toContain('100');
  });

  it('formats large amount with grouping', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('MAD');
    // Should have some form of thousands separator
    expect(result).toMatch(/1[\s\u202f.,]?500/);
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('MAD');
  });
});

// ── validateMoroccanPhone() ──
describe('validateMoroccanPhone()', () => {
  it('accepts +212 format', () => {
    expect(validateMoroccanPhone('+212612345678')).toBe(true);
  });

  it('accepts 06 format', () => {
    expect(validateMoroccanPhone('0612345678')).toBe(true);
  });

  it('accepts 07 format', () => {
    expect(validateMoroccanPhone('0712345678')).toBe(true);
  });

  it('accepts 05 format', () => {
    expect(validateMoroccanPhone('0512345678')).toBe(true);
  });

  it('rejects numbers starting with 08', () => {
    expect(validateMoroccanPhone('0812345678')).toBe(false);
  });

  it('rejects too short numbers', () => {
    expect(validateMoroccanPhone('06123456')).toBe(false);
  });

  it('rejects too long numbers', () => {
    expect(validateMoroccanPhone('061234567890')).toBe(false);
  });

  it('strips spaces and dashes', () => {
    expect(validateMoroccanPhone('06 12 34 56 78')).toBe(true);
    expect(validateMoroccanPhone('06-12-34-56-78')).toBe(true);
  });
});

// ── generateInvoiceNumber() ──
describe('generateInvoiceNumber()', () => {
  it('generates correct format', () => {
    expect(generateInvoiceNumber(2026, 1)).toBe('INV-2026-0001');
  });

  it('pads sequence to 4 digits', () => {
    expect(generateInvoiceNumber(2026, 42)).toBe('INV-2026-0042');
  });

  it('handles large sequence', () => {
    expect(generateInvoiceNumber(2026, 9999)).toBe('INV-2026-9999');
  });
});

// ── calculateInsuranceCoverage() ──
describe('calculateInsuranceCoverage()', () => {
  it('calculates CNOPS (80% coverage)', () => {
    const result = calculateInsuranceCoverage(1000, 'CNOPS');
    expect(result.coverage).toBe(0.8);
    expect(result.insuranceShare).toBe(800);
    expect(result.patientShare).toBe(200);
  });

  it('calculates CNSS (70% coverage)', () => {
    const result = calculateInsuranceCoverage(1000, 'CNSS');
    expect(result.coverage).toBe(0.7);
    expect(result.insuranceShare).toBe(700);
    expect(result.patientShare).toBe(300);
  });

  it('calculates None (0% coverage)', () => {
    const result = calculateInsuranceCoverage(500, 'None');
    expect(result.coverage).toBe(0);
    expect(result.insuranceShare).toBe(0);
    expect(result.patientShare).toBe(500);
  });

  it('calculates Private (0% coverage)', () => {
    const result = calculateInsuranceCoverage(1200, 'Private');
    expect(result.insuranceShare).toBe(0);
    expect(result.patientShare).toBe(1200);
  });

  it('handles decimal amounts correctly', () => {
    const result = calculateInsuranceCoverage(333.33, 'CNOPS');
    // Should round to 2 decimal places
    expect(result.insuranceShare).toBe(266.66);
    expect(result.patientShare).toBe(66.67);
  });
});

// ── slugify() ──
describe('slugify()', () => {
  it('converts basic string', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('handles accented characters', () => {
    expect(slugify('Dr. Amina Benali')).toBe('dr-amina-benali');
  });

  it('handles French accents', () => {
    expect(slugify('Réservé à léquipe')).toBe('reserve-a-lequipe');
  });

  it('strips leading/trailing dashes', () => {
    expect(slugify(' Hello ')).toBe('hello');
  });
});

// ── truncate() ──
describe('truncate()', () => {
  it('returns original if short enough', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates with ellipsis', () => {
    const result = truncate('This is a long string', 10);
    expect(result.length).toBeLessThanOrEqual(11); // 10 + ellipsis char
    expect(result).toContain('…');
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

// ── getInitials() ──
describe('getInitials()', () => {
  it('returns uppercase initials', () => {
    expect(getInitials('Amina', 'Benali')).toBe('AB');
  });

  it('handles lowercase input', () => {
    expect(getInitials('amina', 'benali')).toBe('AB');
  });
});
