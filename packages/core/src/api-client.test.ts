import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, DEFAULT_API_BASE_URL } from './api-client';
import type { ConfigResponse } from './types';

describe('ApiClient', () => {
  let client: ApiClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  const mockConfigResponse: ConfigResponse = {
    widget_id: 'test-widget-123',
    app_id: 'test-app-456',
    submission_token: 'test-token-abc',
    token_expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    ui_config: {
      form_title: 'Send Feedback',
      form_subtitle: 'We appreciate your feedback',
      submit_button_text: 'Submit',
      placeholder_text: 'Enter your feedback...',
      success_message: 'Thank you!',
      max_length: 1000,
    },
    styling: {
      theme: 'light',
      primary_color: '#7c3aed',
      trigger_position: 'bottom-right',
    },
    allowed_origins: ['https://example.com'],
  };

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    client = new ApiClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default API base URL', () => {
      const defaultClient = new ApiClient();
      expect(defaultClient).toBeDefined();
    });

    it('should accept custom API base URL', () => {
      const customClient = new ApiClient('https://custom.api.com/');
      expect(customClient).toBeDefined();
    });

    it('should remove trailing slash from base URL', () => {
      const customClient = new ApiClient('https://custom.api.com/', true);
      // Verify by making a request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      });
      customClient.fetchConfig('test-id');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/api/v1/widgets/test-id/config',
        expect.any(Object)
      );
    });
  });

  describe('setFingerprint()', () => {
    it('should store fingerprint', () => {
      client.setFingerprint('test-fingerprint-123');
      expect(client.getFingerprint()).toBe('test-fingerprint-123');
    });
  });

  describe('hasValidToken()', () => {
    it('should return false when no token', () => {
      expect(client.hasValidToken()).toBe(false);
    });

    it('should return true after fetching config with valid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      });

      await client.fetchConfig('test-widget');
      expect(client.hasValidToken()).toBe(true);
    });

    it('should return false when token is expired', async () => {
      const expiredResponse = {
        ...mockConfigResponse,
        token_expires_at: Math.floor(Date.now() / 1000) - 60, // Expired 1 minute ago
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(expiredResponse),
      });

      await client.fetchConfig('test-widget');
      expect(client.hasValidToken()).toBe(false);
    });
  });

  describe('fetchConfig()', () => {
    it('should fetch widget config successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      });

      const config = await client.fetchConfig('test-widget-123');

      expect(config).toEqual(mockConfigResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/api/v1/widgets/test-widget-123/config`,
        {
          method: 'GET',
          headers: {},
        }
      );
    });

    it('should include fingerprint header when set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      });

      client.setFingerprint('fp-123');
      await client.fetchConfig('test-widget');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { 'X-Client-Fingerprint': 'fp-123' },
        })
      );
    });

    it('should cache config responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      });

      await client.fetchConfig('test-widget');
      await client.fetchConfig('test-widget');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate concurrent requests', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve(mockConfigResponse),
                }),
              10
            )
          )
      );

      const [config1, config2] = await Promise.all([
        client.fetchConfig('test-widget'),
        client.fetchConfig('test-widget'),
      ]);

      expect(config1).toEqual(config2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error on failed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ detail: 'Widget not found' }),
      });

      await expect(client.fetchConfig('invalid-widget')).rejects.toThrow(
        'Widget not found'
      );
    });
  });

  describe('submitFeedback()', () => {
    beforeEach(async () => {
      // Pre-fetch config to get token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      });
      await client.fetchConfig('test-widget');
    });

    it('should submit feedback successfully', async () => {
      const feedbackResponse = {
        feedback_id: 'fb-123',
        status: 'received',
        message: 'Thank you for your feedback!',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(feedbackResponse),
      });

      const result = await client.submitFeedback('test-widget', {
        message: 'Great app!',
      });

      expect(result).toEqual(feedbackResponse);
      expect(mockFetch).toHaveBeenLastCalledWith(
        `${DEFAULT_API_BASE_URL}/api/v1/widgets/test-widget/feedback`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Submission-Token': 'test-token-abc',
          }),
        })
      );
    });

    it('should include fingerprint in feedback request', async () => {
      client.setFingerprint('fp-123');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ feedback_id: 'fb-123' }),
      });

      await client.submitFeedback('test-widget', { message: 'Test' });

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Client-Fingerprint': 'fp-123',
          }),
        })
      );
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
        }),
      });

      await expect(
        client.submitFeedback('test-widget', { message: 'Test' })
      ).rejects.toThrow(/Rate limited/);
    });

    it('should throw on blocked feedback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            blocked: true,
            message: 'Submission blocked',
          }),
      });

      await expect(
        client.submitFeedback('test-widget', { message: 'Test' })
      ).rejects.toThrow('Submission blocked');
    });
  });

  describe('clearCache()', () => {
    it('should clear all cached data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      });

      await client.fetchConfig('test-widget');
      expect(client.hasValidToken()).toBe(true);

      client.clearCache();

      expect(client.hasValidToken()).toBe(false);
      // Should fetch again after cache clear
      await client.fetchConfig('test-widget');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
