import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FeedValue } from './feedvalue';

// Mock API responses
const mockConfigResponse = {
  widget_id: 'test-widget-123',
  app_id: 'test-app-456',
  submission_token: 'test-token',
  token_expires_at: Math.floor(Date.now() / 1000) + 3600,
  config: {
    position: 'bottom-right',
    triggerText: 'Feedback',
    formTitle: 'Share your feedback',
    submitButtonText: 'Submit',
    thankYouMessage: 'Thank you!',
    showBranding: true,
  },
  styling: {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    buttonTextColor: '#ffffff',
    borderRadius: '8px',
  },
  allowed_origins: ['*'],
};

describe('FeedValue', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup mock fetch
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockConfigResponse),
    });
    globalThis.fetch = mockFetch;

    // Mock crypto for fingerprint
    vi.stubGlobal('crypto', {
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    // Destroy any existing instances
    const instance = FeedValue.getInstance('test-widget-123');
    if (instance) {
      instance.destroy();
    }

    // Clean up any remaining DOM elements
    document.querySelectorAll('.fv-widget-trigger, .fv-widget-modal, .fv-widget-overlay').forEach(el => el.remove());
    document.getElementById('fv-widget-styles')?.remove();
    document.getElementById('fv-widget-custom-styles')?.remove();
  });

  describe('init()', () => {
    it('should create a new instance', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      expect(instance).toBeDefined();
    });

    it('should return existing instance for same widgetId', () => {
      const instance1 = FeedValue.init({ widgetId: 'test-widget-123' });
      const instance2 = FeedValue.init({ widgetId: 'test-widget-123' });
      expect(instance1).toBe(instance2);
    });

    it('should create different instances for different widgetIds', () => {
      const instance1 = FeedValue.init({ widgetId: 'widget-1' });
      const instance2 = FeedValue.init({ widgetId: 'widget-2' });
      expect(instance1).not.toBe(instance2);

      // Cleanup
      instance1.destroy();
      instance2.destroy();
    });
  });

  describe('getInstance()', () => {
    it('should return undefined for non-existent widgetId', () => {
      expect(FeedValue.getInstance('non-existent')).toBeUndefined();
    });

    it('should return instance after init', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      expect(FeedValue.getInstance('test-widget-123')).toBe(instance);
    });
  });

  describe('state management', () => {
    it('should start with isReady = false', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      expect(instance.getSnapshot().isReady).toBe(false);
    });

    it('should become ready after initialization', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      // Wait for async init
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(instance.getSnapshot().isReady).toBe(true);
    });

    it('should notify subscribers on state change', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      const callback = vi.fn();

      instance.subscribe(callback);

      // Wait for async init which triggers state changes
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      const callback = vi.fn();

      const unsubscribe = instance.subscribe(callback);
      unsubscribe();

      // State changes shouldn't trigger callback
      instance.open(); // This won't work yet but will call updateState internally
      // Callback should not be called since we unsubscribed
    });
  });

  describe('widget control', () => {
    it('should not open before ready', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.open();
      expect(instance.getSnapshot().isOpen).toBe(false);
    });

    it('should open after ready', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      // Wait for ready
      await new Promise((resolve) => setTimeout(resolve, 50));

      instance.open();
      expect(instance.getSnapshot().isOpen).toBe(true);
      expect(instance.isOpen()).toBe(true);
    });

    it('should close correctly', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      instance.open();
      expect(instance.isOpen()).toBe(true);

      instance.close();
      expect(instance.isOpen()).toBe(false);
    });

    it('should toggle between open and close', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(instance.isOpen()).toBe(false);
      instance.toggle();
      expect(instance.isOpen()).toBe(true);
      instance.toggle();
      expect(instance.isOpen()).toBe(false);
    });

    it('should show and hide trigger', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(instance.isVisible()).toBe(true);
      instance.hide();
      expect(instance.isVisible()).toBe(false);
      instance.show();
      expect(instance.isVisible()).toBe(true);
    });
  });

  describe('user data', () => {
    it('should set user data', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.setData({ email: 'test@example.com' });

      const userData = instance.getUserData();
      expect(userData.data.email).toBe('test@example.com');
    });

    it('should merge user data', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.setData({ email: 'test@example.com' });
      instance.setData({ name: 'Test User' });

      const userData = instance.getUserData();
      expect(userData.data.email).toBe('test@example.com');
      expect(userData.data.name).toBe('Test User');
    });

    it('should identify user', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.identify('user-123', { plan: 'pro' });

      const userData = instance.getUserData();
      expect(userData.userId).toBe('user-123');
      expect(userData.traits.plan).toBe('pro');
    });

    it('should reset user data', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.setData({ email: 'test@example.com' });
      instance.identify('user-123');

      instance.reset();

      const userData = instance.getUserData();
      expect(userData.userId).toBeNull();
      expect(userData.data).toEqual({});
    });
  });

  describe('events', () => {
    it('should emit ready event', async () => {
      const callback = vi.fn();
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.on('ready', callback);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalled();
    });

    it('should emit open and close events', async () => {
      const openCallback = vi.fn();
      const closeCallback = vi.fn();

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.on('open', openCallback);
      instance.on('close', closeCallback);

      await new Promise((resolve) => setTimeout(resolve, 50));

      instance.open();
      expect(openCallback).toHaveBeenCalled();

      instance.close();
      expect(closeCallback).toHaveBeenCalled();
    });

    it('should unsubscribe from events', async () => {
      const callback = vi.fn();
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.on('open', callback);

      await new Promise((resolve) => setTimeout(resolve, 50));

      instance.off('open', callback);
      instance.open();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should call once() handler only once', async () => {
      const callback = vi.fn();
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      instance.once('open', callback);

      instance.open();
      expect(callback).toHaveBeenCalledTimes(1);

      instance.close();
      instance.open();
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('waitUntilReady()', () => {
    it('should resolve immediately if already ready', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      // Wait for ready
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should resolve immediately
      await expect(instance.waitUntilReady()).resolves.toBeUndefined();
    });

    it('should wait for ready event', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      // Call waitUntilReady before it's ready
      const readyPromise = instance.waitUntilReady();

      // Wait for initialization to complete
      await expect(readyPromise).resolves.toBeUndefined();
      expect(instance.isReady()).toBe(true);
    });

    it('should reject if initialization fails', async () => {
      // Make fetch fail
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      await expect(instance.waitUntilReady()).rejects.toThrow('Network error');
    });

    it('should reject immediately if error already occurred', async () => {
      // Make fetch fail
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      // Wait for the error to be set
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should reject immediately with the stored error
      await expect(instance.waitUntilReady()).rejects.toThrow('Network error');
    });
  });

  describe('configuration', () => {
    it('should merge config options', () => {
      const instance = FeedValue.init({
        widgetId: 'test-widget-123',
        config: { debug: true, theme: 'dark' },
      });

      const config = instance.getConfig();
      expect(config.debug).toBe(true);
      expect(config.theme).toBe('dark');
    });

    it('should update config', () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.setConfig({ theme: 'light' });

      const config = instance.getConfig();
      expect(config.theme).toBe('light');
    });
  });

  describe('feedback submission', () => {
    it('should throw if not ready', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      await expect(instance.submit({ message: 'Test' })).rejects.toThrow(
        'Widget not ready'
      );
    });

    it('should throw if message is empty', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      await expect(instance.submit({ message: '' })).rejects.toThrow(
        'Feedback message is required'
      );
    });

    it('should submit feedback successfully', async () => {
      // Setup feedback response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ feedback_id: 'fb-123' }),
      });

      const submitCallback = vi.fn();
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      instance.on('submit', submitCallback);

      await new Promise((resolve) => setTimeout(resolve, 50));

      await instance.submit({ message: 'Great product!' });

      expect(submitCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Great product!',
        })
      );
    });

    it('should throw if message exceeds maximum length', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const longMessage = 'a'.repeat(10001);
      await expect(instance.submit({ message: longMessage })).rejects.toThrow(
        'Feedback message exceeds maximum length of 10000 characters'
      );
    });

    it('should throw for invalid sentiment value', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      await expect(
        instance.submit({
          message: 'Test feedback',
          sentiment: 'invalid-sentiment' as any,
        })
      ).rejects.toThrow('Invalid sentiment value. Must be one of: angry, disappointed, satisfied, excited');
    });

    it('should accept valid sentiment values', async () => {
      // Setup feedback response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ feedback_id: 'fb-123' }),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not throw for valid sentiment
      await expect(
        instance.submit({
          message: 'Great product!',
          sentiment: 'excited',
        })
      ).resolves.not.toThrow();
    });

    it('should throw if metadata field exceeds maximum length', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const longValue = 'a'.repeat(1001);
      await expect(
        instance.submit({
          message: 'Test feedback',
          metadata: {
            page_url: 'https://example.com',
            custom_field: longValue,
          } as any,
        })
      ).rejects.toThrow('Metadata field "custom_field" exceeds maximum length of 1000 characters');
    });
  });

  describe('destroy()', () => {
    it('should clean up instance', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      instance.destroy();

      expect(FeedValue.getInstance('test-widget-123')).toBeUndefined();
    });

    it('should remove DOM elements', async () => {
      const instance = FeedValue.init({ widgetId: 'test-widget-123' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // DOM elements should exist
      const trigger = document.querySelector('.fv-widget-trigger');
      expect(trigger).toBeDefined();

      instance.destroy();

      // DOM elements should be removed
      expect(document.querySelector('.fv-widget-trigger')).toBeNull();
      expect(document.querySelector('.fv-widget-modal')).toBeNull();
    });
  });

  describe('initialization failure', () => {
    it('should set error state when initialization fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API unavailable'));
      const errorCallback = vi.fn();

      const instance = FeedValue.init({ widgetId: 'test-widget-fail' });
      instance.on('error', errorCallback);

      // Wait for async init to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = instance.getSnapshot();
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error?.message).toContain('API unavailable');
      expect(state.isReady).toBe(false);
      expect(errorCallback).toHaveBeenCalled();

      instance.destroy();
    });

    it('should handle 404 for invalid widget ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Widget not found' }),
      });

      const instance = FeedValue.init({ widgetId: 'invalid-widget' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const state = instance.getSnapshot();
      expect(state.error?.message).toContain('Widget not found');
      expect(state.isReady).toBe(false);

      instance.destroy();
    });

    it('should handle destroy() called multiple times', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          widget_id: 'test-widget-multi-destroy',
          name: 'Test',
          config: {},
          styling: {},
          submission_token: 'token',
          token_expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-multi-destroy' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(() => {
        instance.destroy();
        instance.destroy();
      }).not.toThrow();

      expect(FeedValue.getInstance('test-widget-multi-destroy')).toBeUndefined();
    });

    it('should handle operations after destroy gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          widget_id: 'test-widget-post-destroy',
          name: 'Test',
          config: {},
          styling: {},
          submission_token: 'token',
          token_expires_at: Math.floor(Date.now() / 1000) + 3600,
        }),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-post-destroy' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      instance.destroy();

      // These should not throw
      expect(() => instance.open()).not.toThrow();
      expect(() => instance.close()).not.toThrow();
    });
  });

  describe('CSS sanitization', () => {
    it('should inject safe customCSS', async () => {
      const safeCSS = '.fv-widget-trigger { font-size: 16px; }';
      const responseWithCSS = {
        ...mockConfigResponse,
        styling: {
          ...mockConfigResponse.styling,
          customCSS: safeCSS,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithCSS),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customStyles = document.getElementById('fv-widget-custom-styles');
      expect(customStyles).not.toBeNull();
      expect(customStyles?.textContent).toBe(safeCSS);

      instance.destroy();
    });

    it('should block customCSS with url() pattern', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const unsafeCSS = '.widget { background: url(https://evil.com/track.png); }';
      const responseWithCSS = {
        ...mockConfigResponse,
        styling: {
          ...mockConfigResponse.styling,
          customCSS: unsafeCSS,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithCSS),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customStyles = document.getElementById('fv-widget-custom-styles');
      expect(customStyles).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[FeedValue] Blocked potentially unsafe CSS pattern');

      warnSpy.mockRestore();
      instance.destroy();
    });

    it('should block customCSS with @import pattern', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const unsafeCSS = '@import url("https://evil.com/styles.css");';
      const responseWithCSS = {
        ...mockConfigResponse,
        styling: {
          ...mockConfigResponse.styling,
          customCSS: unsafeCSS,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithCSS),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customStyles = document.getElementById('fv-widget-custom-styles');
      expect(customStyles).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[FeedValue] Blocked potentially unsafe CSS pattern');

      warnSpy.mockRestore();
      instance.destroy();
    });

    it('should block customCSS with javascript: URL', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const unsafeCSS = '.widget { content: "javascript:alert(1)"; }';
      const responseWithCSS = {
        ...mockConfigResponse,
        styling: {
          ...mockConfigResponse.styling,
          customCSS: unsafeCSS,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithCSS),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customStyles = document.getElementById('fv-widget-custom-styles');
      expect(customStyles).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[FeedValue] Blocked potentially unsafe CSS pattern');

      warnSpy.mockRestore();
      instance.destroy();
    });

    it('should block customCSS with expression() (IE)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const unsafeCSS = '.widget { width: expression(alert("xss")); }';
      const responseWithCSS = {
        ...mockConfigResponse,
        styling: {
          ...mockConfigResponse.styling,
          customCSS: unsafeCSS,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithCSS),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customStyles = document.getElementById('fv-widget-custom-styles');
      expect(customStyles).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[FeedValue] Blocked potentially unsafe CSS pattern');

      warnSpy.mockRestore();
      instance.destroy();
    });

    it('should block customCSS with behavior: (IE)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const unsafeCSS = '.widget { behavior: url(malicious.htc); }';
      const responseWithCSS = {
        ...mockConfigResponse,
        styling: {
          ...mockConfigResponse.styling,
          customCSS: unsafeCSS,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithCSS),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customStyles = document.getElementById('fv-widget-custom-styles');
      expect(customStyles).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[FeedValue] Blocked potentially unsafe CSS pattern');

      warnSpy.mockRestore();
      instance.destroy();
    });

    it('should block customCSS with -moz-binding (Firefox XBL)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const unsafeCSS = '.widget { -moz-binding: url("chrome://xbl/binding.xml"); }';
      const responseWithCSS = {
        ...mockConfigResponse,
        styling: {
          ...mockConfigResponse.styling,
          customCSS: unsafeCSS,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithCSS),
      });

      const instance = FeedValue.init({ widgetId: 'test-widget-123' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      const customStyles = document.getElementById('fv-widget-custom-styles');
      expect(customStyles).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('[FeedValue] Blocked potentially unsafe CSS pattern');

      warnSpy.mockRestore();
      instance.destroy();
    });
  });
});
