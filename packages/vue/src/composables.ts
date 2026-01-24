/**
 * @feedvalue/vue - Composables
 *
 * Vue composables for FeedValue. Provides reactive state and methods.
 */

import {
  ref,
  shallowRef,
  readonly,
  onMounted,
  onUnmounted,
  inject,
  type Ref,
  type ShallowRef,
} from 'vue';
import {
  FeedValue,
  type FeedValueConfig,
  type FeedValueInstance,
  type FeedbackData,
  type UserTraits,
} from '@feedvalue/core';
import { FEEDVALUE_KEY, FEEDVALUE_OPTIONS_KEY } from './plugin';

/**
 * Return type for useFeedValue composable
 */
export interface UseFeedValueReturn {
  /** FeedValue instance (for advanced usage) */
  instance: Readonly<ShallowRef<FeedValueInstance | null>>;
  /** Widget is ready */
  isReady: Readonly<Ref<boolean>>;
  /** Modal is open */
  isOpen: Readonly<Ref<boolean>>;
  /** Widget is visible */
  isVisible: Readonly<Ref<boolean>>;
  /** Current error */
  error: Readonly<Ref<Error | null>>;
  /** Submission in progress */
  isSubmitting: Readonly<Ref<boolean>>;
  /** Running in headless mode (no default UI rendered) */
  isHeadless: Readonly<Ref<boolean>>;
  /** Open the feedback modal */
  open: () => void;
  /** Close the feedback modal */
  close: () => void;
  /** Toggle the feedback modal */
  toggle: () => void;
  /** Show the trigger button */
  show: () => void;
  /** Hide the trigger button */
  hide: () => void;
  /** Submit feedback programmatically */
  submit: (feedback: Partial<FeedbackData>) => Promise<void>;
  /** Identify user */
  identify: (userId: string, traits?: UserTraits) => void;
  /** Set user data */
  setData: (data: Record<string, string>) => void;
  /** Reset user data */
  reset: () => void;
}

/**
 * FeedValue composable
 *
 * Can be used with or without plugin. If plugin is installed, uses the
 * provided instance. Otherwise, creates a new instance.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFeedValue } from '@feedvalue/vue';
 *
 * // With plugin installed
 * const { open, isReady } = useFeedValue();
 *
 * // Or standalone with widgetId
 * const { open, isReady } = useFeedValue('your-widget-id');
 * </script>
 *
 * <template>
 *   <button @click="open" :disabled="!isReady">
 *     Give Feedback
 *   </button>
 * </template>
 * ```
 */
export function useFeedValue(
  widgetId?: string,
  config?: Partial<FeedValueConfig>
): UseFeedValueReturn {
  // Try to inject instance from plugin
  const injectedInstance = inject(FEEDVALUE_KEY, null);
  const injectedOptions = inject(FEEDVALUE_OPTIONS_KEY, null);

  // Refs for reactive state
  const instance = shallowRef<FeedValueInstance | null>(null);
  const isReady = ref(false);
  const isOpen = ref(false);
  const isVisible = ref(false);
  const error = ref<Error | null>(null);
  const isSubmitting = ref(false);
  const isHeadless = ref(false);

  // Track if we own the instance (need to destroy on unmount)
  let ownsInstance = false;
  let unsubscribe: (() => void) | null = null;

  /**
   * Sync reactive state from instance
   */
  const syncState = () => {
    const state = instance.value?.getSnapshot();
    if (state) {
      isReady.value = state.isReady;
      isOpen.value = state.isOpen;
      isVisible.value = state.isVisible;
      error.value = state.error;
      isSubmitting.value = state.isSubmitting;
    }
  };

  onMounted(() => {
    // Use injected instance if available and no widgetId override
    if (injectedInstance && !widgetId) {
      instance.value = injectedInstance;
      isHeadless.value = injectedInstance.isHeadless();
    } else {
      // Create new instance
      const effectiveWidgetId = widgetId ?? injectedOptions?.widgetId;

      if (!effectiveWidgetId) {
        console.error(
          '[FeedValue] No widgetId provided. Either install the plugin with createFeedValue() ' +
            'or pass widgetId to useFeedValue().'
        );
        return;
      }

      instance.value = FeedValue.init({
        widgetId: effectiveWidgetId,
        apiBaseUrl: injectedOptions?.apiBaseUrl,
        config: config ?? injectedOptions?.config,
        headless: injectedOptions?.headless,
      });
      ownsInstance = true;
    }

    // Subscribe to state changes
    if (instance.value) {
      unsubscribe = instance.value.subscribe(syncState);
      isHeadless.value = instance.value.isHeadless();
      syncState(); // Initial sync
    }
  });

  onUnmounted(() => {
    unsubscribe?.();
    if (ownsInstance && instance.value) {
      instance.value.destroy();
    }
    instance.value = null;
  });

  // Methods that delegate to instance
  const open = () => instance.value?.open();
  const close = () => instance.value?.close();
  const toggle = () => instance.value?.toggle();
  const show = () => instance.value?.show();
  const hide = () => instance.value?.hide();
  const submit = (feedback: Partial<FeedbackData>) =>
    instance.value?.submit(feedback) ?? Promise.reject(new Error('Not initialized'));
  const identify = (userId: string, traits?: UserTraits) =>
    instance.value?.identify(userId, traits);
  const setData = (data: Record<string, string>) => instance.value?.setData(data);
  const reset = () => instance.value?.reset();

  return {
    instance: readonly(instance),
    isReady: readonly(isReady),
    isOpen: readonly(isOpen),
    isVisible: readonly(isVisible),
    error: readonly(error),
    isSubmitting: readonly(isSubmitting),
    isHeadless: readonly(isHeadless),
    open,
    close,
    toggle,
    show,
    hide,
    submit,
    identify,
    setData,
    reset,
  };
}
