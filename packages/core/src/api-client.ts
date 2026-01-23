/**
 * @feedvalue/core - API Client
 *
 * Handles all communication with the FeedValue API.
 * Includes request deduplication, caching, and error handling.
 */

import type { ConfigResponse, FeedbackResponse, FeedbackData } from './types';

/**
 * Default API base URL
 */
export const DEFAULT_API_BASE_URL = 'https://api.feedvalue.com';

/** Buffer time before token is considered expired (seconds) */
const TOKEN_EXPIRY_BUFFER_SECONDS = 30;

/** How long to cache widget config (milliseconds) */
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * API client for FeedValue
 */
export class ApiClient {
  private baseUrl: string;
  private debug: boolean;

  // Request deduplication
  private pendingRequests = new Map<string, Promise<unknown>>();

  // Config cache
  private configCache = new Map<string, CacheEntry<ConfigResponse>>();

  // Anti-abuse tokens
  private submissionToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private fingerprint: string | null = null;

  constructor(baseUrl: string = DEFAULT_API_BASE_URL, debug = false) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.debug = debug;
  }

  /**
   * Validate widget ID to prevent path injection attacks
   * @throws Error if widget ID is invalid
   */
  private validateWidgetId(widgetId: string): void {
    if (!widgetId || typeof widgetId !== 'string') {
      throw new Error('Widget ID is required');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(widgetId)) {
      throw new Error('Invalid widget ID format: only alphanumeric characters, underscores, and hyphens are allowed');
    }
    if (widgetId.length > 64) {
      throw new Error('Widget ID exceeds maximum length of 64 characters');
    }
  }

  /**
   * Set client fingerprint for anti-abuse protection
   */
  setFingerprint(fingerprint: string): void {
    this.fingerprint = fingerprint;
  }

  /**
   * Get client fingerprint
   */
  getFingerprint(): string | null {
    return this.fingerprint;
  }

  /**
   * Check if submission token is valid
   */
  hasValidToken(): boolean {
    if (!this.submissionToken || !this.tokenExpiresAt) {
      return false;
    }
    // Add buffer before expiry
    return Date.now() / 1000 < this.tokenExpiresAt - TOKEN_EXPIRY_BUFFER_SECONDS;
  }

  /**
   * Fetch widget configuration
   * Uses caching and request deduplication
   */
  async fetchConfig(widgetId: string): Promise<ConfigResponse> {
    this.validateWidgetId(widgetId);
    const cacheKey = `config:${widgetId}`;

    // Check cache first
    const cached = this.configCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      this.log('Config cache hit', { widgetId });
      return cached.data;
    }

    // Deduplicate concurrent requests
    const pendingKey = `fetchConfig:${widgetId}`;
    const pending = this.pendingRequests.get(pendingKey);
    if (pending) {
      this.log('Deduplicating config request', { widgetId });
      return pending as Promise<ConfigResponse>;
    }

    const request = this.doFetchConfig(widgetId);
    this.pendingRequests.set(pendingKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.pendingRequests.delete(pendingKey);
    }
  }

  /**
   * Actually fetch config from API
   */
  private async doFetchConfig(widgetId: string): Promise<ConfigResponse> {
    const url = `${this.baseUrl}/api/v1/widgets/${widgetId}/config`;

    const headers: Record<string, string> = {};
    if (this.fingerprint) {
      headers['X-Client-Fingerprint'] = this.fingerprint;
    }

    this.log('Fetching config', { widgetId, url });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(error);
    }

    const data = await response.json() as ConfigResponse;

    // Store submission token
    if (data.submission_token) {
      this.submissionToken = data.submission_token;
      this.tokenExpiresAt = data.token_expires_at ?? null;
      this.log('Submission token stored', {
        expiresAt: this.tokenExpiresAt ? new Date(this.tokenExpiresAt * 1000).toISOString() : 'unknown',
      });
    }

    // Cache the response
    const cacheKey = `config:${widgetId}`;
    this.configCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
    });

    this.log('Config fetched', { widgetId });
    return data;
  }

  /**
   * Submit feedback
   */
  async submitFeedback(
    widgetId: string,
    feedback: FeedbackData
  ): Promise<FeedbackResponse> {
    this.validateWidgetId(widgetId);
    const url = `${this.baseUrl}/api/v1/widgets/${widgetId}/feedback`;

    // Refresh token if needed
    if (!this.hasValidToken()) {
      this.log('Token expired, refreshing...');
      await this.fetchConfig(widgetId);
    }

    if (!this.submissionToken) {
      throw new Error('No submission token available');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Submission-Token': this.submissionToken,
    };

    if (this.fingerprint) {
      headers['X-Client-Fingerprint'] = this.fingerprint;
    }

    this.log('Submitting feedback', { widgetId });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: feedback.message,
        metadata: feedback.metadata,
        ...(feedback.customFieldValues && {
          customFieldValues: feedback.customFieldValues,
        }),
      }),
    });

    // Handle rate limiting
    if (response.status === 429) {
      const resetAt = response.headers.get('X-RateLimit-Reset');
      const retryAfter = resetAt
        ? Math.ceil(parseInt(resetAt, 10) - Date.now() / 1000)
        : 60;
      throw new Error(`Rate limited. Try again in ${retryAfter} seconds.`);
    }

    // Handle forbidden (token issues)
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({ detail: 'Access denied' }));

      // Check for subscription limit
      if (errorData.detail?.code && errorData.detail?.message) {
        throw new Error(errorData.detail.message);
      }

      // Try token refresh and retry once
      const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : '';
      if (errorMessage.includes('token') || errorMessage.includes('expired')) {
        this.log('Token rejected, refreshing...');
        this.submissionToken = null;
        await this.fetchConfig(widgetId);

        if (this.submissionToken) {
          // Retry with new token
          headers['X-Submission-Token'] = this.submissionToken;
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              message: feedback.message,
              metadata: feedback.metadata,
              ...(feedback.customFieldValues && {
                customFieldValues: feedback.customFieldValues,
              }),
            }),
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      }

      throw new Error(errorMessage || 'Access denied');
    }

    if (!response.ok) {
      const error = await this.parseError(response);
      throw new Error(error);
    }

    const data = await response.json() as FeedbackResponse;

    // Check for soft blocks
    if (data.blocked) {
      throw new Error(data.message || 'Unable to submit feedback');
    }

    this.log('Feedback submitted', { feedbackId: data.feedback_id });
    return data;
  }

  /**
   * Parse error from response
   */
  private async parseError(response: Response): Promise<string> {
    try {
      const data = await response.json();
      return data.detail || data.message || data.error || `HTTP ${response.status}`;
    } catch {
      return `HTTP ${response.status}: ${response.statusText}`;
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.configCache.clear();
    this.submissionToken = null;
    this.tokenExpiresAt = null;
    this.log('Cache cleared');
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.debug) {
      console.log(`[FeedValue API] ${message}`, data ?? '');
    }
  }
}
