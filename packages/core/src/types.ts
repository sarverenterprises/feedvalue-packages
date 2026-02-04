/**
 * @feedvalue/core - Type Definitions
 *
 * Core types for the FeedValue SDK. These types are shared across
 * all framework packages (React, Vue) and the vanilla API.
 */

import type { ContextCaptureConfig } from './context-capture';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Widget position on screen
 */
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';

/**
 * Widget theme mode
 */
export type WidgetTheme = 'light' | 'dark' | 'auto';

/**
 * Trigger icon type
 */
export type TriggerIconType = 'none' | 'chat' | 'message' | 'feedback' | 'comment' | 'help' | 'lightbulb';

/**
 * Custom field types
 */
export type CustomFieldType = 'text' | 'email' | 'emoji';

/**
 * Emoji sentiment values
 */
export type EmojiSentiment = 'angry' | 'disappointed' | 'satisfied' | 'excited';

/**
 * Custom field definition
 */
export interface CustomField {
  id: string;
  type: CustomFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
}

/**
 * Widget styling configuration
 */
export interface WidgetStyling {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonTextColor: string;
  borderRadius: string;
  customCSS?: string | undefined;
}

/**
 * Widget UI configuration
 */
export interface WidgetUIConfig {
  position: WidgetPosition;
  triggerText: string;
  triggerIcon: TriggerIconType;
  formTitle: string;
  submitButtonText: string;
  thankYouMessage: string;
  showBranding: boolean;
  customFields?: CustomField[] | undefined;
}

/**
 * Full widget configuration (from API)
 */
export interface WidgetConfig {
  widgetId: string;
  widgetKey: string;
  appId: string;
  type: WidgetType;
  config: WidgetUIConfig & Partial<ReactionConfig>;
  styling: WidgetStyling;
}

// ============================================================================
// Initialization Types
// ============================================================================

/**
 * Options passed to FeedValue.init()
 */
export interface FeedValueOptions {
  /** Widget ID from FeedValue dashboard */
  widgetId: string;
  /** API base URL (defaults to production) */
  apiBaseUrl?: string | undefined;
  /** Enable debug logging */
  debug?: boolean | undefined;
  /** Initial configuration overrides */
  config?: Partial<FeedValueConfig> | undefined;
  /**
   * Headless mode - disables all DOM rendering.
   * Use this when you want full control over the UI.
   * The SDK will still fetch config and provide all API methods
   * (open, close, submit, etc.) but won't render any elements.
   *
   * @default false
   */
  headless?: boolean | undefined;
  /**
   * Context capture configuration for reaction widgets.
   * When enabled, captures DOM context (section ID, nearest heading, data attributes)
   * from the trigger element when react() is called.
   *
   * @default { enabled: true, maxDepth: 5, maxHeadingLength: 100, dataAttributeWhitelist: ['data-section', 'data-feature', 'data-component', 'data-fv-section', 'data-fv-feature'] }
   */
  contextCapture?: Partial<ContextCaptureConfig> | undefined;
}

/**
 * Runtime configuration (can be changed after init)
 */
export interface FeedValueConfig {
  /** Widget theme */
  theme: WidgetTheme;
  /** Widget position override */
  position?: WidgetPosition;
  /** Auto-show widget on init */
  autoShow: boolean;
  /** Enable debug logging */
  debug: boolean;
  /** Locale for internationalization */
  locale: string;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Widget state (for framework integration)
 * Used by useSyncExternalStore in React and reactive refs in Vue
 */
export interface FeedValueState {
  /** Widget is ready (config loaded) */
  isReady: boolean;
  /** Modal is open */
  isOpen: boolean;
  /** Widget is visible on page */
  isVisible: boolean;
  /** Current error (if any) */
  error: Error | null;
  /** Feedback submission in progress */
  isSubmitting: boolean;
}

// ============================================================================
// Feedback Types
// ============================================================================

/**
 * Feedback submission data
 */
export interface FeedbackData {
  /** Feedback message content */
  message: string;
  /** Sentiment rating (from emoji field) */
  sentiment?: EmojiSentiment | undefined;
  /** Custom field values */
  customFieldValues?: Record<string, string> | undefined;
  /** Page metadata */
  metadata?: FeedbackMetadata | undefined;
}

/**
 * Feedback metadata (auto-collected)
 */
export interface FeedbackMetadata {
  /** Current page URL */
  page_url: string;
  /** Referrer URL */
  referrer?: string | undefined;
  /** User agent string */
  user_agent?: string | undefined;
}

// ============================================================================
// Reaction Types
// ============================================================================

/**
 * Widget type - feedback (modal form) or reaction (inline buttons)
 */
export type WidgetType = 'feedback' | 'reaction';

/**
 * Reaction template presets
 */
export type ReactionTemplate = 'thumbs' | 'helpful' | 'emoji' | 'rating';

/**
 * Button size options
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Follow-up trigger options
 */
export type FollowUpTrigger = 'negative' | 'all' | 'none';

/**
 * Border radius options for reaction buttons
 */
export type ReactionBorderRadius = 'full' | 'lg' | 'md' | 'sm' | 'none';

/**
 * Border width options for reaction buttons
 */
export type ReactionBorderWidth = '0' | '1' | '2' | '3' | '4';

/**
 * Reaction widget styling configuration
 */
export interface ReactionStyling {
  /** Primary/accent color (hex) */
  primaryColor?: string;
  /** Button background color (hex) */
  backgroundColor?: string;
  /** Text color (hex) */
  textColor?: string;
  /** Button label text color (hex) */
  buttonTextColor?: string;
  /** Border color (hex) */
  borderColor?: string;
  /** Border width preset */
  borderWidth?: ReactionBorderWidth;
  /** Border radius preset */
  borderRadius?: ReactionBorderRadius;
}

/**
 * Map of negative reaction options for each template.
 * Used to determine when to show follow-up input when followUpTrigger is 'negative'.
 *
 * @example
 * ```ts
 * import { NEGATIVE_OPTIONS_MAP, ReactionTemplate } from '@feedvalue/core';
 *
 * const template: ReactionTemplate = 'thumbs';
 * const isNegative = NEGATIVE_OPTIONS_MAP[template].includes('not_helpful'); // true
 * ```
 */
export const NEGATIVE_OPTIONS_MAP: Record<ReactionTemplate, string[]> = {
  thumbs: ['not_helpful'],
  helpful: ['no'],
  emoji: ['angry', 'disappointed'],
  rating: ['1', '2'],
};

/**
 * Single reaction option
 */
export interface ReactionOption {
  /** Display label for the option */
  label: string;
  /** Value submitted when selected (lowercase alphanumeric with underscores/hyphens) */
  value: string;
  /** Icon name (Lucide icon) or emoji character */
  icon: string;
  /** Whether to show follow-up text input after selection */
  showFollowUp: boolean;
  /** Placeholder text for follow-up input (if showFollowUp is true) */
  followUpPlaceholder?: string;
}

/**
 * Reaction widget configuration
 */
export interface ReactionConfig {
  /** Prebuilt template (if set, options are ignored) */
  template?: ReactionTemplate;
  /** Custom reaction options (required if template is null) */
  options?: ReactionOption[];
  /** Label for follow-up text input */
  followUpLabel: string;
  /** Submit button text for follow-up */
  submitText: string;
  /** Message shown after submission */
  thankYouMessage: string;
  /** Whether to show text labels next to icons */
  showLabels?: boolean;
  /** Button size: 'sm', 'md', or 'lg' */
  buttonSize?: ButtonSize;
  /** When to show follow-up input: 'negative' (default), 'all', or 'none' */
  followUpTrigger?: FollowUpTrigger;
}

/**
 * Reaction submission data
 */
export interface ReactionData {
  /** Selected reaction option value */
  value: string;
  /** Optional follow-up text */
  followUp?: string;
  /** Page metadata */
  metadata?: ReactionMetadata;
}

/**
 * Reaction metadata (auto-collected)
 */
export interface ReactionMetadata {
  /** Current page URL */
  page_url: string;
  /** Session ID for tracking */
  session_id?: string;
  /** User agent string */
  user_agent?: string;
}

/**
 * Reaction submission state (for hooks/components)
 */
export interface ReactionState {
  /** Available reaction options */
  options: ReactionOption[] | null;
  /** Currently submitting */
  isSubmitting: boolean;
  /** Successfully submitted value (null if not yet submitted) */
  submitted: string | null;
  /** Error if submission failed */
  error: Error | null;
  /** Option value requiring follow-up input (null if none) */
  showFollowUp: string | null;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Event types emitted by FeedValue
 */
export interface FeedValueEvents {
  /** Widget is ready (config loaded) */
  ready: () => void;
  /** Modal opened */
  open: () => void;
  /** Modal closed */
  close: () => void;
  /** Feedback submitted successfully */
  submit: (feedback: FeedbackData) => void;
  /** Error occurred */
  error: (error: Error) => void;
  /** State changed (for generic listeners) */
  stateChange: (state: FeedValueState) => void;
  /** Reaction clicked (before submission) */
  react: (data: { value: string; hasFollowUp: boolean }) => void;
  /** Reaction submitted successfully */
  reactSubmit: (data: { value: string; followUp?: string }) => void;
  /** Reaction submission error */
  reactError: (error: Error) => void;
}

/**
 * Event handler type
 */
export type EventHandler<K extends keyof FeedValueEvents> = FeedValueEvents[K];

// ============================================================================
// User Data Types
// ============================================================================

/**
 * User data for identification
 */
export interface UserData {
  /** User email */
  email?: string;
  /** User display name */
  name?: string;
  /** Custom user properties */
  [key: string]: string | undefined;
}

/**
 * User traits for identify()
 */
export interface UserTraits {
  /** User email */
  email?: string;
  /** User display name */
  name?: string;
  /** Company or organization */
  company?: string;
  /** User plan/tier */
  plan?: string;
  /** Custom traits */
  [key: string]: unknown;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * User identification data for API submissions
 * Sent with feedback when identify() or setData() has been called
 */
export interface SubmissionUserData {
  /** User ID (from identify()) */
  user_id?: string;
  /** User email (from setData or identify traits) */
  email?: string;
  /** User display name (from setData or identify traits) */
  name?: string;
  /** Additional user traits (from identify()) */
  traits?: Record<string, unknown>;
  /** Custom user data (from setData()) */
  custom_data?: Record<string, string>;
}

/**
 * API response for widget config
 */
export interface ConfigResponse {
  widget_id: string;
  widget_key: string;
  type: WidgetType;
  config: Partial<WidgetUIConfig & ReactionConfig>;
  styling: Partial<WidgetStyling>;
  submission_token?: string;
  token_expires_at?: number;
}

/**
 * API response for feedback submission
 */
export interface FeedbackResponse {
  success: boolean;
  feedback_id: string;
  message?: string;
  blocked?: boolean;
}

/**
 * API response for reaction submission
 */
export interface ReactionResponse {
  success: boolean;
  submission_id: string | null;
  message: string;
  blocked: boolean;
  block_reason?: string;
}

// ============================================================================
// Instance Types
// ============================================================================

/**
 * FeedValue instance interface
 * This is the public API for the widget
 */
export interface FeedValueInstance {
  // Lifecycle
  /** Initialize the widget (fetch config, prepare DOM) */
  init(): Promise<void>;
  /** Destroy the widget (cleanup DOM, event listeners) */
  destroy(): void;

  // Widget Control
  /** Open the feedback modal */
  open(): void;
  /** Close the feedback modal */
  close(): void;
  /** Toggle the feedback modal */
  toggle(): void;
  /** Show the trigger button */
  show(): void;
  /** Hide the trigger button */
  hide(): void;

  // State Queries
  /** Check if modal is open */
  isOpen(): boolean;
  /** Check if trigger is visible */
  isVisible(): boolean;
  /** Check if widget is ready */
  isReady(): boolean;
  /** Check if running in headless mode (no DOM rendering) */
  isHeadless(): boolean;

  // User Data
  /** Set user data (email, name, custom fields) */
  setData(data: Partial<UserData>): void;
  /** Identify user with ID and traits */
  identify(userId: string, traits?: UserTraits): void;
  /** Reset user data and state */
  reset(): void;

  // Feedback
  /** Programmatically submit feedback */
  submit(feedback: Partial<FeedbackData>): Promise<void>;

  // Reactions
  /**
   * Get reaction options from widget config.
   * Returns null if widget is not a reaction type.
   */
  getReactionOptions(): ReactionOption[] | null;
  /**
   * Submit a reaction.
   * @param value - Selected reaction option value
   * @param options - Optional follow-up text and trigger element for context capture
   */
  react(value: string, options?: { followUp?: string; triggerElement?: Element | null }): Promise<void>;
  /**
   * Check if widget is a reaction type
   */
  isReaction(): boolean;
  /**
   * Get widget type ('feedback' or 'reaction')
   */
  getWidgetType(): WidgetType;

  // Events
  /** Subscribe to an event */
  on<K extends keyof FeedValueEvents>(event: K, callback: EventHandler<K>): void;
  /** Subscribe to an event for a single emission */
  once<K extends keyof FeedValueEvents>(event: K, callback: EventHandler<K>): void;
  /** Unsubscribe from an event */
  off<K extends keyof FeedValueEvents>(event: K, callback?: EventHandler<K>): void;
  /** Returns a promise that resolves when the widget is ready */
  waitUntilReady(): Promise<void>;

  // Configuration
  /** Update runtime configuration */
  setConfig(config: Partial<FeedValueConfig>): void;
  /** Get current configuration */
  getConfig(): FeedValueConfig;
  /** Get widget configuration (from API) */
  getWidgetConfig(): WidgetConfig | null;

  // Framework Integration (for React useSyncExternalStore, Vue reactivity)
  /** Subscribe to state changes */
  subscribe(callback: () => void): () => void;
  /** Get current state snapshot */
  getSnapshot(): FeedValueState;
}
