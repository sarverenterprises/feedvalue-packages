'use client';

/**
 * @feedvalue/react - Components
 *
 * Standalone React components for FeedValue.
 */

import React from 'react';
import { FeedValueProvider, type FeedValueProviderProps } from './provider';

/**
 * Props for FeedValueWidget component
 */
export interface FeedValueWidgetProps extends Omit<FeedValueProviderProps, 'children'> {}

/**
 * Standalone FeedValue widget component
 *
 * Use this when you don't need to access the FeedValue context elsewhere.
 * The widget renders itself via DOM injection - this component is a container.
 *
 * @example
 * ```tsx
 * // Simple usage - just drop in anywhere
 * import { FeedValueWidget } from '@feedvalue/react';
 *
 * export function App() {
 *   return (
 *     <div>
 *       <h1>My App</h1>
 *       <FeedValueWidget
 *         widgetId="your-widget-id"
 *         onSubmit={(feedback) => console.log('Feedback:', feedback)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function FeedValueWidget(props: FeedValueWidgetProps): React.ReactElement {
  return (
    <FeedValueProvider {...props}>
      {/* Widget renders via DOM injection, no children needed */}
      {null}
    </FeedValueProvider>
  );
}
