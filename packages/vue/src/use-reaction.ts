/**
 * @feedvalue/vue - useReaction Composable
 *
 * Composable for reaction widgets in Vue applications.
 * Provides a simple API for submitting reactions.
 */

import {
  ref,
  computed,
  readonly,
  onMounted,
  onUnmounted,
  inject,
  type Ref,
  type ComputedRef,
} from 'vue';
import {
  FeedValue,
  type ReactionOption,
  type FeedValueInstance,
} from '@feedvalue/core';
import { FEEDVALUE_KEY, FEEDVALUE_OPTIONS_KEY } from './plugin';

/**
 * Return type for useReaction composable
 */
export interface UseReactionReturn {
  /** Available reaction options */
  options: ComputedRef<ReactionOption[] | null>;
  /** Currently submitting */
  isSubmitting: Readonly<Ref<boolean>>;
  /** Successfully submitted value (null if not yet submitted) */
  submitted: Readonly<Ref<string | null>>;
  /** Error if submission failed */
  error: Readonly<Ref<Error | null>>;
  /** Option value requiring follow-up input (null if none) */
  showFollowUp: Readonly<Ref<string | null>>;
  /** Submit a reaction */
  react: (value: string, followUp?: string) => Promise<void>;
  /** Set which option is showing follow-up input */
  setShowFollowUp: (value: string | null) => void;
  /** Clear the submitted state to allow re-submission */
  clearSubmitted: () => void;
  /** Check if widget is a reaction type */
  isReactionWidget: ComputedRef<boolean>;
  /** Widget configuration is ready */
  isReady: Readonly<Ref<boolean>>;
}

/**
 * Composable for reaction widgets
 *
 * Provides reaction options, submission handling, and follow-up state management.
 * Can be used with or without the FeedValue plugin.
 *
 * @param widgetId - Optional widget ID override (uses plugin widget if not provided)
 *
 * @example
 * ```vue
 * <script setup>
 * import { useReaction } from '@feedvalue/vue';
 *
 * const {
 *   options,
 *   react,
 *   isSubmitting,
 *   submitted,
 *   error,
 *   showFollowUp,
 *   setShowFollowUp,
 *   isReady,
 * } = useReaction();
 *
 * const handleClick = (option) => {
 *   if (option.showFollowUp) {
 *     setShowFollowUp(option.value);
 *   } else {
 *     react(option.value);
 *   }
 * };
 * </script>
 *
 * <template>
 *   <div v-if="isReady && options">
 *     <div v-if="submitted">Thanks for your feedback!</div>
 *
 *     <template v-else>
 *       <button
 *         v-for="option in options"
 *         :key="option.value"
 *         @click="handleClick(option)"
 *         :disabled="isSubmitting"
 *       >
 *         {{ option.icon }} {{ option.label }}
 *       </button>
 *
 *       <form v-if="showFollowUp" @submit.prevent="react(showFollowUp, followUpText)">
 *         <input v-model="followUpText" placeholder="Tell us more..." />
 *         <button type="submit">Send</button>
 *       </form>
 *
 *       <div v-if="error">Error: {{ error.message }}</div>
 *     </template>
 *   </div>
 * </template>
 * ```
 */
export function useReaction(widgetId?: string): UseReactionReturn {
  // Try to inject instance from plugin
  const injectedInstance = inject(FEEDVALUE_KEY, null);
  const injectedOptions = inject(FEEDVALUE_OPTIONS_KEY, null);

  // Local instance ref (may be created if no plugin or widgetId override)
  const instance = ref<FeedValueInstance | null>(null);
  const isReady = ref(false);

  // Local state for reaction UI
  const showFollowUp = ref<string | null>(null);
  const submitted = ref<string | null>(null);
  const isSubmitting = ref(false);
  const error = ref<Error | null>(null);

  // Track if we own the instance (need to destroy on unmount)
  let ownsInstance = false;
  let unsubscribe: (() => void) | null = null;

  /**
   * Sync ready state from instance
   */
  const syncState = () => {
    const state = instance.value?.getSnapshot();
    if (state) {
      isReady.value = state.isReady;
    }
  };

  onMounted(() => {
    // Use injected instance if available and no widgetId override
    if (injectedInstance && !widgetId) {
      instance.value = injectedInstance;
    } else {
      // Create new instance
      const effectiveWidgetId = widgetId ?? injectedOptions?.widgetId;

      if (!effectiveWidgetId) {
        console.error(
          '[FeedValue] No widgetId provided. Either install the plugin with createFeedValue() ' +
            'or pass widgetId to useReaction().'
        );
        return;
      }

      instance.value = FeedValue.init({
        widgetId: effectiveWidgetId,
        apiBaseUrl: injectedOptions?.apiBaseUrl,
        config: injectedOptions?.config,
        headless: true, // Reaction widgets are always headless
      });
      ownsInstance = true;
    }

    // Subscribe to state changes
    if (instance.value) {
      unsubscribe = instance.value.subscribe(syncState);
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

  // Computed: reaction options from instance
  const options = computed<ReactionOption[] | null>(() => {
    if (!instance.value || !isReady.value) return null;
    return instance.value.getReactionOptions();
  });

  // Computed: check if this is a reaction widget
  const isReactionWidget = computed(() => {
    return instance.value?.isReaction() ?? false;
  });

  /**
   * Submit a reaction
   */
  const react = async (value: string, followUp?: string): Promise<void> => {
    if (!instance.value) {
      throw new Error('FeedValue not initialized');
    }

    isSubmitting.value = true;
    error.value = null;

    try {
      await instance.value.react(value, followUp ? { followUp } : undefined);
      submitted.value = value;
      showFollowUp.value = null;
    } catch (err) {
      const reactionError = err instanceof Error ? err : new Error(String(err));
      error.value = reactionError;
      throw reactionError;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Set which option is showing follow-up input
   */
  const setShowFollowUp = (value: string | null): void => {
    showFollowUp.value = value;
  };

  /**
   * Clear submitted state to allow re-submission
   */
  const clearSubmitted = (): void => {
    submitted.value = null;
    error.value = null;
  };

  return {
    options,
    isSubmitting: readonly(isSubmitting),
    submitted: readonly(submitted),
    error: readonly(error),
    showFollowUp: readonly(showFollowUp),
    react,
    setShowFollowUp,
    clearSubmitted,
    isReactionWidget,
    isReady: readonly(isReady),
  };
}
