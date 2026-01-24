/**
 * @feedvalue/vue - Plugin
 *
 * Vue plugin for FeedValue. Provides app-level configuration
 * and automatic initialization.
 */

import type { App, InjectionKey } from 'vue';
import { FeedValue, type FeedValueConfig, type FeedValueInstance } from '@feedvalue/core';

/**
 * Plugin options
 */
export interface FeedValuePluginOptions {
  /** Widget ID from FeedValue dashboard */
  widgetId: string;
  /** API base URL (for self-hosted) */
  apiBaseUrl?: string;
  /** Configuration overrides */
  config?: Partial<FeedValueConfig>;
  /**
   * Headless mode - disables all DOM rendering.
   * Use this when you want full control over the UI.
   * The SDK will still fetch config and provide all API methods
   * but won't render any trigger button or modal.
   *
   * @default false
   */
  headless?: boolean;
}

/**
 * Injection key for FeedValue instance
 */
export const FEEDVALUE_KEY: InjectionKey<FeedValueInstance> = Symbol('feedvalue');

/**
 * Injection key for widget ID (used by useFeedValue when no instance is injected)
 */
export const FEEDVALUE_OPTIONS_KEY: InjectionKey<FeedValuePluginOptions> = Symbol('feedvalue-options');

/**
 * Create FeedValue Vue plugin
 *
 * @example
 * ```ts
 * // main.ts
 * import { createApp } from 'vue';
 * import { createFeedValue } from '@feedvalue/vue';
 * import App from './App.vue';
 *
 * const app = createApp(App);
 *
 * app.use(createFeedValue({
 *   widgetId: 'your-widget-id',
 *   config: { theme: 'dark' }
 * }));
 *
 * app.mount('#app');
 * ```
 */
export function createFeedValue(options: FeedValuePluginOptions) {
  let instance: FeedValueInstance | null = null;

  return {
    install(app: App) {
      // Only initialize on client side
      if (typeof window !== 'undefined') {
        instance = FeedValue.init({
          widgetId: options.widgetId,
          apiBaseUrl: options.apiBaseUrl,
          config: options.config,
          headless: options.headless,
        });

        // Provide instance to all components
        app.provide(FEEDVALUE_KEY, instance);

        // Also provide to global properties for Options API access
        app.config.globalProperties.$feedvalue = instance;
      }

      // Always provide options (for SSR where we don't initialize)
      app.provide(FEEDVALUE_OPTIONS_KEY, options);
    },
  };
}

/**
 * Type augmentation for global properties
 */
declare module 'vue' {
  interface ComponentCustomProperties {
    $feedvalue: FeedValueInstance | undefined;
  }
}
