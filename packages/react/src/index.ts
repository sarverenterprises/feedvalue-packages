/**
 * @feedvalue/react
 *
 * React SDK for FeedValue feedback widget.
 *
 * @example
 * ```tsx
 * // 1. Wrap your app with FeedValueProvider
 * import { FeedValueProvider } from '@feedvalue/react';
 *
 * function App() {
 *   return (
 *     <FeedValueProvider widgetId="your-widget-id">
 *       <YourApp />
 *     </FeedValueProvider>
 *   );
 * }
 *
 * // 2. Use the hook in any component
 * import { useFeedValue } from '@feedvalue/react';
 *
 * function FeedbackButton() {
 *   const { open, isReady } = useFeedValue();
 *   return (
 *     <button onClick={open} disabled={!isReady}>
 *       Feedback
 *     </button>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Provider and hooks
export {
  FeedValueProvider,
  useFeedValue,
  useFeedValueOptional,
  type FeedValueProviderProps,
  type FeedValueContextValue,
} from './provider';

// Standalone component
export { FeedValueWidget, type FeedValueWidgetProps } from './components';

// Re-export useful types from core
export type {
  FeedValueConfig,
  FeedValueState,
  FeedbackData,
  FeedbackMetadata,
  FeedValueEvents,
  UserData,
  UserTraits,
} from '@feedvalue/core';
