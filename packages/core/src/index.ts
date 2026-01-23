/**
 * @feedvalue/core
 *
 * Core FeedValue SDK for JavaScript/TypeScript applications.
 *
 * @example
 * ```ts
 * import { FeedValue } from '@feedvalue/core';
 *
 * // Initialize widget
 * const widget = FeedValue.init({ widgetId: 'your-widget-id' });
 *
 * // Control widget
 * widget.open();
 * widget.close();
 *
 * // Set user data
 * widget.setData({ email: 'user@example.com' });
 * widget.identify('user-123', { plan: 'pro' });
 *
 * // Listen to events
 * widget.on('submit', (feedback) => {
 *   console.log('Feedback submitted:', feedback);
 * });
 *
 * // Programmatic submission
 * await widget.submit({ message: 'Great product!' });
 * ```
 *
 * @packageDocumentation
 */

// Main class
export { FeedValue } from './feedvalue';

// Types
export type {
  // Configuration
  FeedValueOptions,
  FeedValueConfig,
  WidgetConfig,
  WidgetPosition,
  WidgetTheme,
  WidgetUIConfig,
  WidgetStyling,
  TriggerIconType,

  // Custom Fields
  CustomField,
  CustomFieldType,
  EmojiSentiment,

  // State
  FeedValueState,

  // Feedback
  FeedbackData,
  FeedbackMetadata,

  // Events
  FeedValueEvents,
  EventHandler,

  // User Data
  UserData,
  UserTraits,

  // Instance Interface
  FeedValueInstance,

  // API Types (for advanced usage)
  ConfigResponse,
  FeedbackResponse,
} from './types';

// Event Emitter (for advanced usage)
export { TypedEventEmitter } from './event-emitter';

// API Client (for advanced usage)
export { ApiClient, DEFAULT_API_BASE_URL } from './api-client';

// Fingerprint (for advanced usage)
export { generateFingerprint, clearFingerprint } from './fingerprint';
