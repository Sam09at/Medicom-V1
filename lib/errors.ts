/**
 * Medicom error codes.
 * Used with MedicomError to provide structured error handling.
 */
export const ERROR_CODES = {
  // ── Auth ──
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // ── Tenant ──
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',

  // ── Patient ──
  PATIENT_NOT_FOUND: 'PATIENT_NOT_FOUND',
  PATIENT_DUPLICATE_PHONE: 'PATIENT_DUPLICATE_PHONE',

  // ── Appointment ──
  APPOINTMENT_CONFLICT: 'APPOINTMENT_CONFLICT',
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND',

  // ── Invoice ──
  INVOICE_ALREADY_PAID: 'INVOICE_ALREADY_PAID',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',

  // ── Upload ──
  UPLOAD_TOO_LARGE: 'UPLOAD_TOO_LARGE',
  UPLOAD_INVALID_TYPE: 'UPLOAD_INVALID_TYPE',

  // ── System ──
  DB_ERROR: 'DB_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** User-friendly messages for each error code (French) */
const USER_MESSAGES: Record<ErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS: 'Identifiants invalides.',
  AUTH_SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
  AUTH_UNAUTHORIZED: "Vous n'avez pas les permissions nécessaires.",
  TENANT_NOT_FOUND: 'Cabinet introuvable.',
  TENANT_SUSPENDED: 'Ce cabinet est suspendu. Contactez le support.',
  PATIENT_NOT_FOUND: 'Patient introuvable.',
  PATIENT_DUPLICATE_PHONE: 'Un patient avec ce numéro de téléphone existe déjà.',
  APPOINTMENT_CONFLICT: 'Ce créneau est déjà occupé.',
  APPOINTMENT_NOT_FOUND: 'Rendez-vous introuvable.',
  INVOICE_ALREADY_PAID: 'Cette facture est déjà réglée.',
  INVOICE_NOT_FOUND: 'Facture introuvable.',
  UPLOAD_TOO_LARGE: 'Le fichier est trop volumineux (max 10 Mo).',
  UPLOAD_INVALID_TYPE: 'Type de fichier non supporté.',
  DB_ERROR: 'Erreur de base de données. Réessayez.',
  NETWORK_ERROR: 'Erreur réseau. Vérifiez votre connexion.',
  UNKNOWN: 'Une erreur inattendue est survenue.',
};

/**
 * Structured error class for the Medicom application.
 * Provides both a technical message and a user-facing message in French.
 */
export class MedicomError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode = 500,
    context?: Record<string, unknown>
  ) {
    const userMsg = USER_MESSAGES[code] ?? USER_MESSAGES.UNKNOWN;
    super(message ?? userMsg);
    this.name = 'MedicomError';
    this.code = code;
    this.userMessage = userMsg;
    this.statusCode = statusCode;
    this.context = context;
  }
}

/**
 * Wraps a Supabase error into a MedicomError.
 * @param error - The error object from Supabase
 * @param fallbackCode - The error code to use if not mappable
 */
export function fromSupabaseError(
  error: { message?: string; code?: string; details?: string },
  fallbackCode: ErrorCode = ERROR_CODES.DB_ERROR
): MedicomError {
  // Map known Postgres error codes
  if (error.code === '23505') {
    // unique_violation
    if (error.details?.includes('phone')) {
      return new MedicomError(ERROR_CODES.PATIENT_DUPLICATE_PHONE, error.message, 409);
    }
  }
  if (error.code === '23P01') {
    // exclusion_violation (appointment overlap)
    return new MedicomError(ERROR_CODES.APPOINTMENT_CONFLICT, error.message, 409);
  }
  return new MedicomError(fallbackCode, error.message, 500, { pgCode: error.code });
}
