import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML to prevent XSS attacks.
 * Allows safe HTML tags (formatting) but strips scripts, event handlers, etc.
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

/**
 * Sanitizes plain text by stripping all HTML tags.
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

// ── File Upload Validation ──

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file for upload (type + size).
 * @param file - The File object to validate
 * @param opts - Optional overrides for allowed types and max size
 */
export function validateFileUpload(
  file: File,
  opts?: { allowedTypes?: string[]; maxSize?: number }
): FileValidationResult {
  const types = opts?.allowedTypes ?? ALLOWED_FILE_TYPES;
  const maxSize = opts?.maxSize ?? MAX_FILE_SIZE;

  if (!types.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non supporté: ${file.type}. Types acceptés: ${types.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Maximum: ${maxMB} Mo.`,
    };
  }

  return { valid: true };
}
