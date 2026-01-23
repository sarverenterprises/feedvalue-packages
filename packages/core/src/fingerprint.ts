/**
 * Simple fingerprint generation for anti-abuse protection.
 * Uses a session-based UUID stored in sessionStorage.
 *
 * This replaces the previous complex fingerprinting system (canvas, WebGL, audio)
 * which was overkill for an MVP feedback widget and raised privacy concerns.
 */

/**
 * Storage key for the fingerprint
 */
const FINGERPRINT_STORAGE_KEY = 'fv_fingerprint';

/**
 * Generate a UUID v4.
 * Uses crypto.randomUUID() if available, otherwise falls back to a manual implementation.
 */
function generateUUID(): string {
  // Use native crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: manual UUID v4 generation using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) and variant (RFC 4122)
    // Using non-null assertions since we know the array has 16 elements
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last resort fallback using Math.random (less secure but functional)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate or retrieve a session fingerprint.
 *
 * The fingerprint is:
 * - Generated once per browser session using crypto.randomUUID()
 * - Stored in sessionStorage for consistency within a session
 * - Automatically cleared when the browser tab/window is closed
 *
 * @returns A unique fingerprint string for the current session
 */
export function generateFingerprint(): string {
  // Check for SSR environment
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return generateUUID();
  }

  // Try to get existing fingerprint from session
  const stored = sessionStorage.getItem(FINGERPRINT_STORAGE_KEY);
  if (stored) {
    return stored;
  }

  // Generate new fingerprint
  const fingerprint = generateUUID();

  try {
    sessionStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);
  } catch {
    // sessionStorage may be unavailable (private browsing, quota exceeded)
    // Fall through and return the generated fingerprint anyway
  }

  return fingerprint;
}

/**
 * Clear the stored fingerprint.
 * Useful for testing or when user requests data reset.
 */
export function clearFingerprint(): void {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(FINGERPRINT_STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }
}
