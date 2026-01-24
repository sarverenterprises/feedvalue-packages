/**
 * Vitest setup file for @feedvalue/core
 *
 * Polyfills crypto.getRandomValues for the happy-dom test environment.
 */

import { webcrypto } from 'node:crypto';

// Polyfill crypto.getRandomValues if not available
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as unknown as Crypto;
} else if (typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto.getRandomValues = webcrypto.getRandomValues.bind(
    webcrypto
  ) as typeof globalThis.crypto.getRandomValues;
}
