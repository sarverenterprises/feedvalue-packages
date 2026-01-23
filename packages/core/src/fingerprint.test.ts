import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateFingerprint, clearFingerprint } from './fingerprint';

describe('fingerprint', () => {
  beforeEach(() => {
    // Clear any stored fingerprint before each test
    sessionStorage.clear();
  });

  describe('generateFingerprint', () => {
    it('should return a valid UUID format', () => {
      const fingerprint = generateFingerprint();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(fingerprint).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should return the same fingerprint within a session', () => {
      const fp1 = generateFingerprint();
      const fp2 = generateFingerprint();
      expect(fp1).toBe(fp2);
    });

    it('should return different fingerprints after clearing', () => {
      const fp1 = generateFingerprint();
      clearFingerprint();
      const fp2 = generateFingerprint();
      expect(fp1).not.toBe(fp2);
    });

    it('should store fingerprint in sessionStorage', () => {
      const fingerprint = generateFingerprint();
      expect(sessionStorage.getItem('fv_fingerprint')).toBe(fingerprint);
    });

    it('should handle sessionStorage being unavailable', () => {
      // Mock sessionStorage.setItem to throw
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw, should still return a fingerprint
      expect(() => generateFingerprint()).not.toThrow();
      const fp = generateFingerprint();
      expect(fp).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      sessionStorage.setItem = originalSetItem;
    });
  });

  describe('clearFingerprint', () => {
    it('should remove fingerprint from sessionStorage', () => {
      generateFingerprint();
      expect(sessionStorage.getItem('fv_fingerprint')).not.toBeNull();

      clearFingerprint();
      expect(sessionStorage.getItem('fv_fingerprint')).toBeNull();
    });

    it('should not throw if no fingerprint exists', () => {
      expect(() => clearFingerprint()).not.toThrow();
    });
  });
});
