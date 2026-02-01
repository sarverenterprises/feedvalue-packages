'use client';

/**
 * @feedvalue/react - useReaction Hook
 *
 * Hook for reaction widgets in React applications.
 * Provides a simple API for submitting reactions.
 */

import { useCallback, useMemo, useState } from 'react';
import type { ReactionOption, ReactionState } from '@feedvalue/core';
import { useFeedValue } from './provider';

/**
 * Return type for useReaction hook
 */
export interface UseReactionReturn extends ReactionState {
  /** Submit a reaction */
  react: (value: string, followUp?: string) => Promise<void>;
  /** Set which option is showing follow-up input */
  setShowFollowUp: (value: string | null) => void;
  /** Clear the submitted state to allow re-submission */
  clearSubmitted: () => void;
  /** Check if widget is a reaction type */
  isReactionWidget: boolean;
  /** Widget configuration is ready */
  isReady: boolean;
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

  // Check if this is a reaction widget
  const isReactionWidget = useMemo(() => {
    return instance?.isReaction() ?? false;
  }, [instance]);

  // Submit reaction
  const react = useCallback(
    async (value: string, followUp?: string) => {
      if (!instance) {
        throw new Error('FeedValue not initialized');
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await instance.react(value, followUp ? { followUp } : undefined);
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
  };
}
