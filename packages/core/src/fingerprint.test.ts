import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateFingerprint } from './fingerprint';

describe('generateFingerprint', () => {
  beforeEach(() => {
    // Setup minimal browser globals for happy-dom
    vi.stubGlobal('screen', {
      width: 1920,
      height: 1080,
      colorDepth: 24,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate a non-empty fingerprint', async () => {
    const fingerprint = await generateFingerprint();
    expect(fingerprint).toBeTruthy();
    expect(typeof fingerprint).toBe('string');
    expect(fingerprint.length).toBeGreaterThan(0);
  });

  it('should generate consistent fingerprints for same environment', async () => {
    const fp1 = await generateFingerprint();
    const fp2 = await generateFingerprint();
    expect(fp1).toBe(fp2);
  });

  it('should handle missing screen gracefully', async () => {
    vi.stubGlobal('screen', undefined);
    const fingerprint = await generateFingerprint();
    expect(fingerprint).toBeTruthy();
  });

  it('should handle missing Intl gracefully', async () => {
    const originalIntl = globalThis.Intl;
    // @ts-expect-error - Testing undefined case
    globalThis.Intl = undefined;
    const fingerprint = await generateFingerprint();
    expect(fingerprint).toBeTruthy();
    globalThis.Intl = originalIntl;
  });

  it('should handle missing navigator gracefully', async () => {
    const originalNavigator = globalThis.navigator;
    // @ts-expect-error - Testing undefined case
    globalThis.navigator = undefined;
    const fingerprint = await generateFingerprint();
    expect(fingerprint).toBeTruthy();
    globalThis.navigator = originalNavigator;
  });
});
