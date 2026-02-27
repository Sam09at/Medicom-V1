import { describe, it, expect } from 'vitest';
import { MedicomError, ERROR_CODES, fromSupabaseError } from '../errors';

// ── MedicomError class ──
describe('MedicomError', () => {
  it('creates error with code and default user message', () => {
    const err = new MedicomError(ERROR_CODES.PATIENT_NOT_FOUND);
    expect(err.code).toBe('PATIENT_NOT_FOUND');
    expect(err.name).toBe('MedicomError');
    expect(err.userMessage).toBe('Patient introuvable.');
    expect(err.statusCode).toBe(500);
  });

  it('accepts custom message override', () => {
    const err = new MedicomError(ERROR_CODES.DB_ERROR, 'Custom technical detail');
    expect(err.message).toBe('Custom technical detail');
    expect(err.userMessage).toBe('Erreur de base de données. Réessayez.');
  });

  it('accepts custom status code', () => {
    const err = new MedicomError(ERROR_CODES.AUTH_UNAUTHORIZED, undefined, 403);
    expect(err.statusCode).toBe(403);
  });

  it('accepts context object', () => {
    const ctx = { tenantId: 'abc-123' };
    const err = new MedicomError(ERROR_CODES.TENANT_SUSPENDED, undefined, 403, ctx);
    expect(err.context).toEqual({ tenantId: 'abc-123' });
  });

  it('is an instance of Error', () => {
    const err = new MedicomError(ERROR_CODES.UNKNOWN);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MedicomError);
  });

  it('falls back to UNKNOWN user message for unrecognized codes', () => {
    // Force a bad code to test fallback
    const err = new MedicomError('NONEXISTENT_CODE' as any);
    expect(err.userMessage).toBe('Une erreur inattendue est survenue.');
  });
});

// ── fromSupabaseError() ──
describe('fromSupabaseError()', () => {
  it('maps phone duplicate violation (23505 + phone)', () => {
    const err = fromSupabaseError({
      message: 'duplicate key value violates unique constraint',
      code: '23505',
      details: 'Key (phone)=(0612345678) already exists.',
    });
    expect(err.code).toBe(ERROR_CODES.PATIENT_DUPLICATE_PHONE);
    expect(err.statusCode).toBe(409);
  });

  it('maps appointment conflict (23P01)', () => {
    const err = fromSupabaseError({
      message: 'conflicting key value violates exclusion constraint',
      code: '23P01',
    });
    expect(err.code).toBe(ERROR_CODES.APPOINTMENT_CONFLICT);
    expect(err.statusCode).toBe(409);
  });

  it('uses fallback code for unknown errors', () => {
    const err = fromSupabaseError({
      message: 'Something went wrong',
      code: '99999',
    });
    expect(err.code).toBe(ERROR_CODES.DB_ERROR);
    expect(err.statusCode).toBe(500);
  });

  it('accepts custom fallback code', () => {
    const err = fromSupabaseError({ message: 'fail' }, ERROR_CODES.NETWORK_ERROR);
    expect(err.code).toBe(ERROR_CODES.NETWORK_ERROR);
  });

  it('returns a MedicomError instance', () => {
    const err = fromSupabaseError({ message: 'test' });
    expect(err).toBeInstanceOf(MedicomError);
  });
});

// ── ERROR_CODES ──
describe('ERROR_CODES', () => {
  it('has all expected error codes', () => {
    expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe('AUTH_INVALID_CREDENTIALS');
    expect(ERROR_CODES.TENANT_SUSPENDED).toBe('TENANT_SUSPENDED');
    expect(ERROR_CODES.APPOINTMENT_CONFLICT).toBe('APPOINTMENT_CONFLICT');
    expect(ERROR_CODES.UPLOAD_TOO_LARGE).toBe('UPLOAD_TOO_LARGE');
    expect(ERROR_CODES.UNKNOWN).toBe('UNKNOWN');
  });

  it('is a frozen-like const object', () => {
    // TypeScript ensures this at compile time, but verify at runtime
    expect(typeof ERROR_CODES).toBe('object');
    expect(Object.keys(ERROR_CODES).length).toBeGreaterThanOrEqual(14);
  });
});
