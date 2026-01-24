/**
 * Simple fingerprint generation for anti-abuse protection.
 * Uses a session-based hex string stored in sessionStorage.
 *
 * This replaces the previous complex fingerprinting system (canvas, WebGL, audio)
 * which was overkill for an MVP feedback widget and raised privacy concerns.
 *
 * The fingerprint is a 32-character hex string (16 random bytes), matching
 * the format expected by the core-api's TokenPayload validator.
 */

/**
 * Storage key for the fingerprint
 */
const FINGERPRINT_STORAGE_KEY = 'fv_fingerprint';

/**
 * Generate a 32-character hex string (16 random bytes).
 * Uses crypto.getRandomValues which is available in all modern browsers and Node.js 15+.
 */
function generateHexFingerprint(): string {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error(
      'crypto.getRandomValues is required but not available. ' +
      'Ensure you are running in a modern browser or Node.js 15+.'
    );
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate or retrieve a session fingerprint.
 *
 * The fingerprint is:
 * - Generated once per browser session as a 32-character hex string
 * - Stored in sessionStorage for consistency within a session
 * - Automatically cleared when the browser tab/window is closed
 *
 * @returns A unique fingerprint hex string for the current session
 */
export function generateFingerprint(): string {
  // Check for SSR environment
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return generateHexFingerprint();
  }

  // Try to get existing fingerprint from session
  const stored = sessionStorage.getItem(FINGERPRINT_STORAGE_KEY);
  if (stored) {
    // Migrate old UUID format to hex format (remove dashes)
    if (stored.includes('-')) {
      const hexFingerprint = stored.replace(/-/g, '');
      try {
        sessionStorage.setItem(FINGERPRINT_STORAGE_KEY, hexFingerprint);
      } catch {
        // Ignore storage errors
      }
      return hexFingerprint;
    }
    return stored;
  }

  // Generate new fingerprint
  const fingerprint = generateHexFingerprint();

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
