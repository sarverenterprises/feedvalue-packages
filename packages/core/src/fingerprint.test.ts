import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateFingerprint, clearFingerprint } from './fingerprint';

describe('fingerprint', () => {
  beforeEach(() => {
    // Clear any stored fingerprint before each test
    sessionStorage.clear();
  });

  describe('generateFingerprint', () => {
    it('should return a valid 32-character hex string', () => {
      const fingerprint = generateFingerprint();
      // 32-character hex string (16 bytes)
      expect(fingerprint).toMatch(/^[0-9a-f]{32}$/i);
      expect(fingerprint).toHaveLength(32);
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

    it('should migrate old UUID format to hex format', () => {
      // Simulate an old UUID-format fingerprint in storage
      const oldUuidFingerprint = 'f0f01214-cebb-4c8f-a229-8b872baa6164';
      sessionStorage.setItem('fv_fingerprint', oldUuidFingerprint);

      const fingerprint = generateFingerprint();

      // Should return hex format (UUID without dashes)
      expect(fingerprint).toBe('f0f01214cebb4c8fa2298b872baa6164');
      expect(fingerprint).toMatch(/^[0-9a-f]{32}$/i);

      // Storage should be updated to hex format
      expect(sessionStorage.getItem('fv_fingerprint')).toBe('f0f01214cebb4c8fa2298b872baa6164');
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
      expect(fp).toMatch(/^[0-9a-f]{32}$/i);

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
