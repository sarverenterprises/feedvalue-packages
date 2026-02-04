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
  NEGATIVE_OPTIONS_MAP,
  type ReactionOption,
  type FeedValueInstance,
  type ButtonSize,
  type FollowUpTrigger,
  type ReactionTemplate,
  type ReactionStyling,
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
  /** Whether to show text labels next to icons */
  showLabels: ComputedRef<boolean>;
  /** Button size */
  buttonSize: ComputedRef<ButtonSize>;
  /** When to show follow-up input */
  followUpTrigger: ComputedRef<FollowUpTrigger>;
  /** Check if an option should show follow-up based on followUpTrigger */
  shouldShowFollowUp: (optionValue: string) => boolean;
  /** Widget styling configuration */
  styling: ComputedRef<ReactionStyling>;
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

  // Computed: get config values with defaults
  const reactionConfig = computed(() => {
    if (!instance.value || !isReady.value) return null;
    // Access the widget config which includes reaction config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (instance.value as any)._widgetConfig?.config ?? null;
  });

  const showLabels = computed(() => {
    return reactionConfig.value?.showLabels ?? true;
  });

  const buttonSize = computed<ButtonSize>(() => {
    return reactionConfig.value?.buttonSize ?? 'md';
  });

  const followUpTrigger = computed<FollowUpTrigger>(() => {
    return reactionConfig.value?.followUpTrigger ?? 'negative';
  });

  const template = computed<ReactionTemplate | undefined>(() => {
    return reactionConfig.value?.template;
  });

  // Computed: widget styling configuration
  const styling = computed<ReactionStyling>(() => {
    const defaultStyling: ReactionStyling = {
      primaryColor: '#6366f1',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      buttonTextColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: '1',
      borderRadius: 'full',
    };

    if (!instance.value || !isReady.value) {
      return defaultStyling;
    }

    // Access the widget config styling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widgetConfig = (instance.value as any)._widgetConfig;
    if (!widgetConfig?.styling) {
      return defaultStyling;
    }

    // Cast styling to access extended properties that may be present from API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widgetStyling = widgetConfig.styling as any;
    return {
      primaryColor: widgetStyling.primaryColor ?? defaultStyling.primaryColor,
      backgroundColor: widgetStyling.backgroundColor ?? defaultStyling.backgroundColor,
      textColor: widgetStyling.textColor ?? defaultStyling.textColor,
      buttonTextColor: widgetStyling.buttonTextColor ?? defaultStyling.buttonTextColor,
      borderColor: widgetStyling.borderColor ?? defaultStyling.borderColor,
      borderWidth: widgetStyling.borderWidth ?? defaultStyling.borderWidth,
      borderRadius: widgetStyling.borderRadius ?? defaultStyling.borderRadius,
    };
  });

  /**
   * Check if an option should show follow-up based on followUpTrigger
   */
  const shouldShowFollowUp = (optionValue: string): boolean => {
    if (followUpTrigger.value === 'none') return false;
    if (followUpTrigger.value === 'all') return true;
    // followUpTrigger === 'negative'
    if (template.value && NEGATIVE_OPTIONS_MAP[template.value]) {
      return NEGATIVE_OPTIONS_MAP[template.value].includes(optionValue);
    }
    // For custom options, use the option's own showFollowUp setting
    const option = options.value?.find((o) => o.value === optionValue);
    return option?.showFollowUp ?? false;
  };

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
    showLabels,
    buttonSize,
    followUpTrigger,
    shouldShowFollowUp,
    styling,
  };
}
