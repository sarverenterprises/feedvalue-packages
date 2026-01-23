/**
 * @feedvalue/vue
 *
 * Vue 3 SDK for FeedValue feedback widget.
 *
 * @example
 * ```ts
 * // 1. Install the plugin (main.ts)
 * import { createApp } from 'vue';
 * import { createFeedValue } from '@feedvalue/vue';
 * import App from './App.vue';
 *
 * const app = createApp(App);
 * app.use(createFeedValue({ widgetId: 'your-widget-id' }));
 * app.mount('#app');
 *
 * // 2. Use the composable in any component
 * <script setup>
 * import { useFeedValue } from '@feedvalue/vue';
 *
 * const { open, isReady } = useFeedValue();
 * </script>
 *
 * <template>
 *   <button @click="open" :disabled="!isReady">Feedback</button>
 * </template>
 * ```
 *
 * @packageDocumentation
 */

// Plugin
export {
  createFeedValue,
  FEEDVALUE_KEY,
  FEEDVALUE_OPTIONS_KEY,
  type FeedValuePluginOptions,
} from './plugin';

// Composables
export { useFeedValue, type UseFeedValueReturn } from './composables';

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
