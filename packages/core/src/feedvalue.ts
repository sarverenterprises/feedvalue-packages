/**
 * @feedvalue/core - FeedValue Class
 *
 * Main FeedValue SDK class. Provides the public API for interacting
 * with the feedback widget.
 *
 * For vanilla JavaScript usage, this class also handles DOM rendering.
 * Framework packages (React, Vue) use this class as a headless core.
 */

import type {
  FeedValueOptions,
  FeedValueConfig,
  FeedValueState,
  FeedValueInstance,
  FeedValueEvents,
  EventHandler,
  UserData,
  UserTraits,
  FeedbackData,
  WidgetConfig,
} from './types';
import { TypedEventEmitter } from './event-emitter';
import { ApiClient, DEFAULT_API_BASE_URL } from './api-client';
import { generateFingerprint } from './fingerprint';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FeedValueConfig = {
  theme: 'auto',
  autoShow: true,
  debug: false,
  locale: 'en',
};

/**
 * Instance registry for singleton per widgetId
 */
const instances = new Map<string, FeedValue>();

/**
 * FeedValue SDK
 *
 * @example
 * ```ts
 * // Initialize
 * const feedvalue = FeedValue.init({ widgetId: 'abc123' });
 *
 * // Control
 * feedvalue.open();
 * feedvalue.close();
 *
 * // User data
 * feedvalue.setData({ email: 'user@example.com' });
 * feedvalue.identify('user-123', { plan: 'pro' });
 *
 * // Events
 * feedvalue.on('submit', (feedback) => {
 *   console.log('Feedback submitted:', feedback);
 * });
 * ```
 */
export class FeedValue implements FeedValueInstance {
  private readonly widgetId: string;
  private readonly apiClient: ApiClient;
  private readonly emitter: TypedEventEmitter;
  private config: FeedValueConfig;
  private widgetConfig: WidgetConfig | null = null;

  // State
  private state: FeedValueState = {
    isReady: false,
    isOpen: false,
    isVisible: true,
    error: null,
    isSubmitting: false,
  };

  // State subscribers (for React useSyncExternalStore)
  private stateSubscribers = new Set<() => void>();
  private stateSnapshot: FeedValueState;

  // User data (stored for future API submissions)
  private _userData: UserData = {};
  private _userId: string | null = null;
  private _userTraits: UserTraits = {};

  // DOM elements (for vanilla usage)
  private triggerButton: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private stylesInjected = false;

  /**
   * Create a new FeedValue instance
   * Use FeedValue.init() for public API
   */
  private constructor(options: FeedValueOptions) {
    this.widgetId = options.widgetId;
    this.config = { ...DEFAULT_CONFIG, ...options.config };

    this.apiClient = new ApiClient(
      options.apiBaseUrl ?? DEFAULT_API_BASE_URL,
      this.config.debug
    );

    this.emitter = new TypedEventEmitter();
    this.stateSnapshot = { ...this.state };

    this.log('Instance created', { widgetId: this.widgetId });
  }

  /**
   * Initialize FeedValue
   * Returns existing instance if already initialized for this widgetId
   */
  static init(options: FeedValueOptions): FeedValue {
    // Return existing instance if available
    const existing = instances.get(options.widgetId);
    if (existing) {
      return existing;
    }

    // Create new instance
    const instance = new FeedValue(options);
    instances.set(options.widgetId, instance);

    // Auto-initialize
    instance.init().catch((error) => {
      console.error('[FeedValue] Initialization failed:', error);
    });

    return instance;
  }

  /**
   * Get existing instance by widgetId
   */
  static getInstance(widgetId: string): FeedValue | undefined {
    return instances.get(widgetId);
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  /**
   * Initialize the widget
   */
  async init(): Promise<void> {
    if (this.state.isReady) {
      this.log('Already initialized');
      return;
    }

    try {
      this.log('Initializing...');

      // Generate fingerprint
      const fingerprint = await generateFingerprint();
      this.apiClient.setFingerprint(fingerprint);

      // Fetch config
      const configResponse = await this.apiClient.fetchConfig(this.widgetId);

      // Build widget config
      this.widgetConfig = {
        widgetId: configResponse.widget_id,
        widgetKey: configResponse.widget_key,
        appId: '',
        config: {
          position: configResponse.config.position ?? 'bottom-right',
          triggerText: configResponse.config.triggerText ?? 'Feedback',
          triggerIcon: configResponse.config.triggerIcon ?? 'none',
          formTitle: configResponse.config.formTitle ?? 'Share your feedback',
          submitButtonText: configResponse.config.submitButtonText ?? 'Submit',
          thankYouMessage: configResponse.config.thankYouMessage ?? 'Thank you for your feedback!',
          showBranding: configResponse.config.showBranding ?? true,
          customFields: configResponse.config.customFields,
        },
        styling: {
          primaryColor: configResponse.styling.primaryColor ?? '#3b82f6',
          backgroundColor: configResponse.styling.backgroundColor ?? '#ffffff',
          textColor: configResponse.styling.textColor ?? '#1f2937',
          buttonTextColor: configResponse.styling.buttonTextColor ?? '#ffffff',
          borderRadius: configResponse.styling.borderRadius ?? '8px',
          customCSS: configResponse.styling.customCSS,
        },
      };

      // Render DOM (for vanilla usage, no-op if framework handles rendering)
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        this.renderWidget();
      }

      // Update state
      this.updateState({ isReady: true, error: null });
      this.emitter.emit('ready');

      this.log('Initialized successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.updateState({ error: err });
      this.emitter.emit('error', err);
      throw err;
    }
  }

  /**
   * Destroy the widget
   */
  destroy(): void {
    this.log('Destroying...');

    // Remove DOM elements
    this.triggerButton?.remove();
    this.modal?.remove();
    this.overlay?.remove();
    document.getElementById('fv-widget-styles')?.remove();
    document.getElementById('fv-widget-custom-styles')?.remove();

    // Clear references
    this.triggerButton = null;
    this.modal = null;
    this.overlay = null;
    this.widgetConfig = null;

    // Clear state
    this.stateSubscribers.clear();
    this.emitter.removeAllListeners();
    this.apiClient.clearCache();

    // Remove from registry
    instances.delete(this.widgetId);

    // Reset state
    this.state = {
      isReady: false,
      isOpen: false,
      isVisible: false,
      error: null,
      isSubmitting: false,
    };

    this.log('Destroyed');
  }

  // ===========================================================================
  // Widget Control
  // ===========================================================================

  open(): void {
    if (!this.state.isReady) {
      this.log('Cannot open: not ready');
      return;
    }

    this.updateState({ isOpen: true });
    this.overlay?.classList.add('fv-widget-open');
    this.modal?.classList.add('fv-widget-open');
    this.emitter.emit('open');
    this.log('Opened');
  }

  close(): void {
    this.updateState({ isOpen: false });
    this.overlay?.classList.remove('fv-widget-open');
    this.modal?.classList.remove('fv-widget-open');
    this.emitter.emit('close');
    this.log('Closed');
  }

  toggle(): void {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  show(): void {
    this.updateState({ isVisible: true });
    if (this.triggerButton) {
      this.triggerButton.style.display = '';
    }
    this.log('Shown');
  }

  hide(): void {
    this.updateState({ isVisible: false });
    if (this.triggerButton) {
      this.triggerButton.style.display = 'none';
    }
    this.log('Hidden');
  }

  // ===========================================================================
  // State Queries
  // ===========================================================================

  isOpen(): boolean {
    return this.state.isOpen;
  }

  isVisible(): boolean {
    return this.state.isVisible;
  }

  isReady(): boolean {
    return this.state.isReady;
  }

  // ===========================================================================
  // User Data
  // ===========================================================================

  setData(data: Partial<UserData>): void {
    this._userData = { ...this._userData, ...data };
    this.log('User data set', data);
  }

  identify(userId: string, traits?: UserTraits): void {
    this._userId = userId;
    if (traits) {
      this._userTraits = { ...this._userTraits, ...traits };
    }
    this.log('User identified', { userId, traits });
  }

  reset(): void {
    this._userData = {};
    this._userId = null;
    this._userTraits = {};
    this.log('User data reset');
  }

  /**
   * Get current user data (for debugging/testing)
   */
  getUserData(): { userId: string | null; data: UserData; traits: UserTraits } {
    return {
      userId: this._userId,
      data: { ...this._userData },
      traits: { ...this._userTraits },
    };
  }

  // ===========================================================================
  // Feedback
  // ===========================================================================

  async submit(feedback: Partial<FeedbackData>): Promise<void> {
    if (!this.state.isReady) {
      throw new Error('Widget not ready');
    }

    if (!feedback.message?.trim()) {
      throw new Error('Feedback message is required');
    }

    this.updateState({ isSubmitting: true });

    try {
      const fullFeedback: FeedbackData = {
        message: feedback.message,
        sentiment: feedback.sentiment,
        customFieldValues: feedback.customFieldValues,
        metadata: {
          page_url: typeof window !== 'undefined' ? window.location.href : '',
          referrer: typeof document !== 'undefined' ? document.referrer : undefined,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          ...feedback.metadata,
        },
      };

      await this.apiClient.submitFeedback(this.widgetId, fullFeedback);

      this.emitter.emit('submit', fullFeedback);
      this.log('Feedback submitted');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitter.emit('error', err);
      throw err;
    } finally {
      this.updateState({ isSubmitting: false });
    }
  }

  // ===========================================================================
  // Events
  // ===========================================================================

  on<K extends keyof FeedValueEvents>(event: K, callback: EventHandler<K>): void {
    this.emitter.on(event, callback);
  }

  off<K extends keyof FeedValueEvents>(event: K, callback?: EventHandler<K>): void {
    this.emitter.off(event, callback);
  }

  // ===========================================================================
  // Configuration
  // ===========================================================================

  setConfig(config: Partial<FeedValueConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('Config updated', config);
  }

  getConfig(): FeedValueConfig {
    return { ...this.config };
  }

  /**
   * Get widget configuration (from API)
   */
  getWidgetConfig(): WidgetConfig | null {
    return this.widgetConfig;
  }

  // ===========================================================================
  // Framework Integration
  // ===========================================================================

  /**
   * Subscribe to state changes
   * Used by React's useSyncExternalStore
   */
  subscribe(callback: () => void): () => void {
    this.stateSubscribers.add(callback);
    return () => {
      this.stateSubscribers.delete(callback);
    };
  }

  /**
   * Get current state snapshot
   * Used by React's useSyncExternalStore
   */
  getSnapshot(): FeedValueState {
    return this.stateSnapshot;
  }

  // ===========================================================================
  // Internal Methods
  // ===========================================================================

  /**
   * Update state and notify subscribers
   */
  private updateState(partial: Partial<FeedValueState>): void {
    this.state = { ...this.state, ...partial };
    // Create new snapshot (important for React)
    this.stateSnapshot = { ...this.state };
    this.emitter.emit('stateChange', this.stateSnapshot);
    // Notify subscribers
    for (const subscriber of this.stateSubscribers) {
      subscriber();
    }
  }

  /**
   * Render widget DOM elements (for vanilla usage)
   */
  private renderWidget(): void {
    if (!this.widgetConfig) return;

    // Inject styles once
    if (!this.stylesInjected) {
      this.injectStyles();
      this.stylesInjected = true;
    }

    // Create trigger button
    this.renderTrigger();

    // Create modal
    this.renderModal();
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {
    if (!this.widgetConfig) return;

    const { styling, config } = this.widgetConfig;

    const styleEl = document.createElement('style');
    styleEl.id = 'fv-widget-styles';
    styleEl.textContent = this.getBaseStyles(styling, config.position);
    document.head.appendChild(styleEl);

    // Custom CSS - textContent is safe (no script execution)
    if (styling.customCSS) {
      const customStyleEl = document.createElement('style');
      customStyleEl.id = 'fv-widget-custom-styles';
      customStyleEl.textContent = styling.customCSS;
      document.head.appendChild(customStyleEl);
    }
  }

  /**
   * Get base CSS styles
   */
  private getBaseStyles(styling: WidgetConfig['styling'], position: string): string {
    const positionStyles = this.getPositionStyles(position);
    const modalPositionStyles = this.getModalPositionStyles(position);

    return `
      .fv-widget-trigger {
        position: fixed;
        ${positionStyles}
        background-color: ${styling.primaryColor};
        color: ${styling.buttonTextColor};
        padding: 12px 24px;
        border-radius: ${styling.borderRadius};
        cursor: pointer;
        z-index: 9998;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 500;
        border: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .fv-widget-trigger:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }
      .fv-widget-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9998;
        display: none;
        backdrop-filter: blur(4px);
      }
      .fv-widget-overlay.fv-widget-open {
        display: block;
      }
      .fv-widget-modal {
        position: fixed;
        ${modalPositionStyles}
        background-color: ${styling.backgroundColor};
        color: ${styling.textColor};
        border-radius: ${styling.borderRadius};
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        z-index: 9999;
        display: none;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        font-family: system-ui, -apple-system, sans-serif;
      }
      .fv-widget-modal.fv-widget-open {
        display: block;
      }
      .fv-widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .fv-widget-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
      }
      .fv-widget-close {
        background: transparent;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: ${styling.textColor};
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .fv-widget-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .fv-widget-textarea {
        width: 100%;
        min-height: 120px;
        padding: 12px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: ${styling.borderRadius};
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        resize: vertical;
        box-sizing: border-box;
        background-color: ${styling.backgroundColor};
        color: ${styling.textColor};
      }
      .fv-widget-textarea:focus {
        outline: none;
        border-color: ${styling.primaryColor};
        box-shadow: 0 0 0 2px ${styling.primaryColor}33;
      }
      .fv-widget-submit {
        background-color: ${styling.primaryColor};
        color: ${styling.buttonTextColor};
        padding: 12px 24px;
        border: none;
        border-radius: ${styling.borderRadius};
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .fv-widget-submit:hover:not(:disabled) {
        opacity: 0.9;
      }
      .fv-widget-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .fv-widget-error {
        color: #ef4444;
        font-size: 14px;
        margin-top: 8px;
        display: none;
      }
      .fv-widget-branding {
        text-align: center;
        font-size: 12px;
        color: ${styling.textColor};
        margin-top: 16px;
        opacity: 0.7;
      }
      .fv-widget-branding a {
        color: ${styling.primaryColor};
        text-decoration: none;
      }
    `;
  }

  /**
   * Get trigger button position styles
   */
  private getPositionStyles(position: string): string {
    switch (position) {
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;';
      case 'top-right':
        return 'top: 20px; right: 20px;';
      case 'top-left':
        return 'top: 20px; left: 20px;';
      case 'center':
        return 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
      case 'bottom-right':
      default:
        return 'bottom: 20px; right: 20px;';
    }
  }

  /**
   * Get modal position styles
   */
  private getModalPositionStyles(position: string): string {
    switch (position) {
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;';
      case 'bottom-right':
        return 'bottom: 20px; right: 20px;';
      case 'top-right':
        return 'top: 20px; right: 20px;';
      case 'top-left':
        return 'top: 20px; left: 20px;';
      case 'center':
      default:
        return 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
    }
  }

  /**
   * Render trigger button using safe DOM methods
   */
  private renderTrigger(): void {
    if (!this.widgetConfig) return;

    this.triggerButton = document.createElement('button');
    this.triggerButton.className = 'fv-widget-trigger';
    // textContent is safe - no HTML parsing
    this.triggerButton.textContent = this.widgetConfig.config.triggerText;
    this.triggerButton.addEventListener('click', () => this.open());

    document.body.appendChild(this.triggerButton);
  }

  /**
   * Render modal using safe DOM methods (no innerHTML)
   */
  private renderModal(): void {
    if (!this.widgetConfig) return;

    const { config } = this.widgetConfig;

    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'fv-widget-overlay';
    this.overlay.addEventListener('click', () => this.close());
    document.body.appendChild(this.overlay);

    // Modal container
    this.modal = document.createElement('div');
    this.modal.className = 'fv-widget-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'fv-widget-header';

    const title = document.createElement('h2');
    title.className = 'fv-widget-title';
    title.textContent = config.formTitle; // Safe - textContent
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fv-widget-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    this.modal.appendChild(header);

    // Form
    const form = document.createElement('form');
    form.className = 'fv-widget-form';
    form.id = 'fv-feedback-form';

    const textarea = document.createElement('textarea');
    textarea.className = 'fv-widget-textarea';
    textarea.id = 'fv-feedback-content';
    textarea.placeholder = 'Tell us what you think...';
    textarea.required = true;
    form.appendChild(textarea);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'fv-widget-submit';
    submitBtn.textContent = config.submitButtonText; // Safe - textContent
    form.appendChild(submitBtn);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'fv-widget-error';
    errorDiv.id = 'fv-error-message';
    form.appendChild(errorDiv);

    form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    this.modal.appendChild(form);

    // Branding
    if (config.showBranding) {
      const branding = document.createElement('div');
      branding.className = 'fv-widget-branding';

      const brandText = document.createTextNode('Powered by ');
      branding.appendChild(brandText);

      const link = document.createElement('a');
      link.href = 'https://feedvalue.com';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'FeedValue';
      branding.appendChild(link);

      this.modal.appendChild(branding);
    }

    document.body.appendChild(this.modal);
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const textarea = document.getElementById('fv-feedback-content') as HTMLTextAreaElement;
    const submitBtn = this.modal?.querySelector('.fv-widget-submit') as HTMLButtonElement;
    const errorEl = document.getElementById('fv-error-message');

    if (!textarea?.value.trim()) {
      this.showError('Please enter your feedback');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      if (errorEl) errorEl.style.display = 'none';

      await this.submit({ message: textarea.value.trim() });

      // Show success
      this.showSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit';
      this.showError(message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.widgetConfig?.config.submitButtonText ?? 'Submit';
    }
  }

  /**
   * Show error message (safe - uses textContent)
   */
  private showError(message: string): void {
    const errorEl = document.getElementById('fv-error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  /**
   * Show success message using safe DOM methods
   */
  private showSuccess(): void {
    if (!this.modal || !this.widgetConfig) return;

    // Clear modal
    this.modal.textContent = '';

    // Success container
    const successDiv = document.createElement('div');
    successDiv.style.cssText = 'text-align: center; padding: 40px 20px;';

    // Checkmark icon
    const iconDiv = document.createElement('div');
    iconDiv.style.cssText = 'font-size: 48px; margin-bottom: 16px;';
    iconDiv.textContent = '✓';
    successDiv.appendChild(iconDiv);

    // Thank you message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = 'font-size: 16px; margin-bottom: 24px;';
    messageDiv.textContent = this.widgetConfig.config.thankYouMessage; // Safe
    successDiv.appendChild(messageDiv);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'fv-widget-submit';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
      this.close();
      this.resetForm();
    });
    successDiv.appendChild(closeBtn);

    this.modal.appendChild(successDiv);

    // Auto-close after 3 seconds
    setTimeout(() => {
      if (this.state.isOpen) {
        this.close();
        this.resetForm();
      }
    }, 3000);
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    if (!this.modal) return;

    // Clear and rebuild modal
    this.modal.textContent = '';
    this.modal.remove();
    this.modal = null;

    // Re-render
    this.renderModal();
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[FeedValue] ${message}`, data ?? '');
    }
  }
}
