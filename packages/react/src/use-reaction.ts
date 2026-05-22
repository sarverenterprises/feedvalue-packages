'use client';

/**
 * @feedvalue/react - useReaction Hook
 *
 * Hook for reaction widgets in React applications.
 * Provides a simple API for submitting reactions.
 */

import { useCallback, useMemo, useState } from 'react';
import type { ReactionOption, ReactionState, ReactionConfig, ButtonSize, FollowUpTrigger, ReactionStyling } from '@feedvalue/core';
import { NEGATIVE_OPTIONS_MAP } from '@feedvalue/core';
import { useFeedValue } from './provider';

type WidgetReactionStyling = Partial<Record<keyof ReactionStyling, string>>;
type ReactionBorderWidthValue = NonNullable<ReactionStyling['borderWidth']>;
type ReactionBorderRadiusValue = NonNullable<ReactionStyling['borderRadius']>;
type ResolvedReactionStyling = {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonTextColor: string;
  borderColor: string;
  borderWidth: ReactionBorderWidthValue;
  borderRadius: ReactionBorderRadiusValue;
};

function getReactionBorderWidth(
  value: string | undefined,
  fallback: ReactionBorderWidthValue
): ReactionBorderWidthValue {
  switch (value) {
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
      return value;
    default:
      return fallback;
  }
}

function getReactionBorderRadius(
  value: string | undefined,
  fallback: ReactionBorderRadiusValue
): ReactionBorderRadiusValue {
  switch (value) {
    case 'full':
    case 'lg':
    case 'md':
    case 'sm':
    case 'none':
      return value;
    default:
      return fallback;
  }
}

/**
 * Options for the react function
 */
export interface ReactOptions {
  /** Optional follow-up text */
  followUp?: string | undefined;
  /** Trigger element for context capture (pass event.currentTarget from click handler) */
  triggerElement?: Element | null | undefined;
}

/**
 * Return type for useReaction hook
 */
export interface UseReactionReturn extends ReactionState {
  /** Submit a reaction with optional follow-up text and trigger element for context capture */
  react: (value: string, options?: ReactOptions | string) => Promise<void>;
  /** Set which option is showing follow-up input */
  setShowFollowUp: (value: string | null) => void;
  /** Clear the submitted state to allow re-submission */
  clearSubmitted: () => void;
  /** Check if widget is a reaction type */
  isReactionWidget: boolean;
  /** Widget configuration is ready */
  isReady: boolean;
  /** Whether to show text labels next to icons */
  showLabels: boolean;
  /** Button size */
  buttonSize: ButtonSize;
  /** When to show follow-up input */
  followUpTrigger: FollowUpTrigger;
  /** Check if an option should show follow-up based on followUpTrigger */
  shouldShowFollowUp: (optionValue: string) => boolean;
  /** Widget styling configuration */
  styling: ReactionStyling;
}

/**
 * Hook for reaction widgets
 *
 * Provides reaction options, submission handling, and follow-up state management.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useReaction } from '@feedvalue/react';
 *
 * function ReactionButtons() {
 *   const {
 *     options,
 *     react,
 *     isSubmitting,
 *     submitted,
 *     error,
 *     showFollowUp,
 *     setShowFollowUp,
 *     isReady,
 *   } = useReaction();
 *
 *   if (!isReady || !options) return null;
 *
 *   if (submitted) {
 *     return <div>Thanks for your feedback!</div>;
 *   }
 *
 *   return (
 *     <div>
 *       {options.map((option) => (
 *         <button
 *           key={option.value}
 *           onClick={() => {
 *             if (option.showFollowUp) {
 *               setShowFollowUp(option.value);
 *             } else {
 *               react(option.value);
 *             }
 *           }}
 *           disabled={isSubmitting}
 *         >
 *           {option.icon} {option.label}
 *         </button>
 *       ))}
 *
 *       {showFollowUp && (
 *         <form onSubmit={(e) => {
 *           e.preventDefault();
 *           const form = e.target as HTMLFormElement;
 *           const input = form.elements.namedItem('followUp') as HTMLInputElement;
 *           react(showFollowUp, input.value);
 *         }}>
 *           <input name="followUp" placeholder="Tell us more..." />
 *           <button type="submit">Send</button>
 *         </form>
 *       )}
 *
 *       {error && <div>Error: {error.message}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useReaction(): UseReactionReturn {
  const { instance, isReady } = useFeedValue();

  // Local state for follow-up and submitted
  const [showFollowUp, setShowFollowUp] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get reaction options from instance
  const options = useMemo<ReactionOption[] | null>(() => {
    if (!instance || !isReady) return null;
    return instance.getReactionOptions();
  }, [instance, isReady]);

  // Get reaction config from instance
  const reactionConfig = useMemo<Partial<ReactionConfig> | null>(() => {
    if (!instance || !isReady) return null;
    // Access the widget config which includes reaction config
    const widgetConfig = instance.getWidgetConfig();
    return widgetConfig?.config ?? null;
  }, [instance, isReady]);

  // Extract config values with defaults
  const showLabels = reactionConfig?.showLabels ?? true;
  const buttonSize: ButtonSize = reactionConfig?.buttonSize ?? 'md';
  const followUpTrigger: FollowUpTrigger = reactionConfig?.followUpTrigger ?? 'negative';
  const template = reactionConfig?.template;

  // Get styling from instance
  const styling = useMemo<ReactionStyling>(() => {
    const defaultStyling: ResolvedReactionStyling = {
      primaryColor: '#6366f1',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      buttonTextColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: '1',
      borderRadius: 'full',
    };

    if (!instance || !isReady) {
      return defaultStyling;
    }
    const widgetConfig = instance.getWidgetConfig();
    if (!widgetConfig?.styling) {
      return defaultStyling;
    }
    const widgetStyling: WidgetReactionStyling = widgetConfig.styling;
    return {
      primaryColor: widgetStyling.primaryColor ?? defaultStyling.primaryColor,
      backgroundColor: widgetStyling.backgroundColor ?? defaultStyling.backgroundColor,
      textColor: widgetStyling.textColor ?? defaultStyling.textColor,
      buttonTextColor: widgetStyling.buttonTextColor ?? defaultStyling.buttonTextColor,
      borderColor: widgetStyling.borderColor ?? defaultStyling.borderColor,
      borderWidth: getReactionBorderWidth(widgetStyling.borderWidth, defaultStyling.borderWidth),
      borderRadius: getReactionBorderRadius(widgetStyling.borderRadius, defaultStyling.borderRadius),
    };
  }, [instance, isReady]);

  // Check if this is a reaction widget
  const isReactionWidget = useMemo(() => {
    return instance?.isReaction() ?? false;
  }, [instance, isReady]);

  // Function to determine if follow-up should show for an option
  const shouldShowFollowUp = useCallback(
    (optionValue: string): boolean => {
      if (followUpTrigger === 'none') return false;
      if (followUpTrigger === 'all') return true;
      // followUpTrigger === 'negative'
      if (template && NEGATIVE_OPTIONS_MAP[template]) {
        return NEGATIVE_OPTIONS_MAP[template].includes(optionValue);
      }
      // For custom options, use the option's own showFollowUp setting
      const option = options?.find((o) => o.value === optionValue);
      return option?.showFollowUp ?? false;
    },
    [followUpTrigger, template, options]
  );

  // Submit reaction
  const react = useCallback(
    async (value: string, options?: ReactOptions | string) => {
      if (!instance) {
        throw new Error('FeedValue not initialized');
      }

      // Support legacy string parameter for backwards compatibility
      const opts: ReactOptions = typeof options === 'string'
        ? { followUp: options }
        : options ?? {};

      setIsSubmitting(true);
      setError(null);

      try {
        await instance.react(value, {
          ...(opts.followUp && { followUp: opts.followUp }),
          ...(opts.triggerElement && { triggerElement: opts.triggerElement }),
        });
        setSubmitted(value);
        setShowFollowUp(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [instance]
  );

  // Clear submitted state
  const clearSubmitted = useCallback(() => {
    setSubmitted(null);
    setError(null);
  }, []);

  return {
    options,
    isSubmitting,
    submitted,
    error,
    showFollowUp,
    setShowFollowUp,
    react,
    clearSubmitted,
    isReactionWidget,
    isReady,
    showLabels,
    buttonSize,
    followUpTrigger,
    shouldShowFollowUp,
    styling,
  };
}
