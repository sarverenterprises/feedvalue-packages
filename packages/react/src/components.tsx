'use client';

/**
 * @feedvalue/react - Components
 *
 * Standalone React components for FeedValue.
 */

import React, { useCallback, useState, type FormEvent } from 'react';
import type { ReactionOption } from '@feedvalue/core';
import { FeedValueProvider, type FeedValueProviderProps } from './provider';
import { useReaction } from './use-reaction';

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

/**
 * Props for ReactionButtons component
 */
export interface ReactionButtonsProps {
  /** Custom CSS class for the container */
  className?: string;
  /** Custom CSS class for buttons */
  buttonClassName?: string;
  /** Custom CSS class for the follow-up form */
  formClassName?: string;
  /** Custom CSS class for the thank you message */
  thankYouClassName?: string;
  /** Callback when a reaction is submitted */
  onReact?: (value: string, followUp?: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Custom render function for buttons (for full control) */
  renderButton?: (option: ReactionOption, onClick: () => void, isDisabled: boolean) => React.ReactNode;
  /** Custom render function for thank you message */
  renderThankYou?: (value: string) => React.ReactNode;
  /** Whether to show follow-up inline (default) or in a modal */
  followUpMode?: 'inline' | 'none';
  /** Hide after submission (default: false) */
  hideAfterSubmit?: boolean;
}

/**
 * Default button styles (inline to avoid CSS dependencies)
 */
const defaultStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '20px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.15s ease',
  },
  buttonHover: {
    borderColor: '#6366f1',
    background: '#f5f3ff',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '8px',
    width: '100%',
    maxWidth: '400px',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none' as const,
  },
  submitButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    background: '#6366f1',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    alignSelf: 'flex-start' as const,
  },
  thankYou: {
    color: '#059669',
    fontSize: '14px',
    fontWeight: 500,
  },
  error: {
    color: '#dc2626',
    fontSize: '14px',
  },
};

/**
 * Internal ReactionButtons implementation (must be inside FeedValueProvider)
 */
function ReactionButtonsInner({
  className,
  buttonClassName,
  formClassName,
  thankYouClassName,
  onReact,
  onError,
  renderButton,
  renderThankYou,
  followUpMode = 'inline',
  hideAfterSubmit = false,
}: ReactionButtonsProps): React.ReactElement | null {
  const {
    options,
    react,
    isSubmitting,
    submitted,
    error,
    showFollowUp,
    setShowFollowUp,
    isReactionWidget,
    isReady,
  } = useReaction();

  const [followUpText, setFollowUpText] = useState('');
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Handle button click
  const handleClick = useCallback(
    (option: ReactionOption) => {
      if (option.showFollowUp && followUpMode === 'inline') {
        setShowFollowUp(option.value);
      } else {
        react(option.value)
          .then(() => onReact?.(option.value))
          .catch((err) => onError?.(err));
      }
    },
    [react, setShowFollowUp, followUpMode, onReact, onError]
  );

  // Handle follow-up form submission
  const handleFollowUpSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!showFollowUp) return;

      react(showFollowUp, followUpText.trim() || undefined)
        .then(() => {
          onReact?.(showFollowUp, followUpText.trim() || undefined);
          setFollowUpText('');
        })
        .catch((err) => onError?.(err));
    },
    [react, showFollowUp, followUpText, onReact, onError]
  );

  // Cancel follow-up
  const handleCancelFollowUp = useCallback(() => {
    setShowFollowUp(null);
    setFollowUpText('');
  }, [setShowFollowUp]);

  // Not ready or not a reaction widget
  if (!isReady || !isReactionWidget || !options) {
    return null;
  }

  // Already submitted and hide option enabled
  if (submitted && hideAfterSubmit) {
    return null;
  }

  // Show thank you message
  if (submitted) {
    if (renderThankYou) {
      return <>{renderThankYou(submitted)}</>;
    }

    return (
      <div className={thankYouClassName} style={thankYouClassName ? undefined : defaultStyles.thankYou}>
        Thanks for your feedback!
      </div>
    );
  }

  // Get the option that needs follow-up
  const followUpOption = showFollowUp ? options.find((o) => o.value === showFollowUp) : null;

  return (
    <div className={className} style={className ? undefined : defaultStyles.container}>
      {/* Reaction buttons */}
      {!showFollowUp &&
        options.map((option) => {
          if (renderButton) {
            return (
              <React.Fragment key={option.value}>
                {renderButton(option, () => handleClick(option), isSubmitting)}
              </React.Fragment>
            );
          }

          const isHovered = hoveredButton === option.value;
          const buttonStyle = {
            ...defaultStyles.button,
            ...(isHovered ? defaultStyles.buttonHover : {}),
            ...(isSubmitting ? defaultStyles.buttonDisabled : {}),
          };

          return (
            <button
              key={option.value}
              type="button"
              className={buttonClassName}
              style={buttonClassName ? undefined : buttonStyle}
              onClick={() => handleClick(option)}
              onMouseEnter={() => setHoveredButton(option.value)}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={isSubmitting}
              aria-label={option.label}
            >
              <span role="img" aria-hidden="true">
                {option.icon}
              </span>
              <span>{option.label}</span>
            </button>
          );
        })}

      {/* Follow-up form */}
      {showFollowUp && followUpOption && (
        <form
          className={formClassName}
          style={formClassName ? undefined : defaultStyles.form}
          onSubmit={handleFollowUpSubmit}
        >
          <textarea
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder={followUpOption.followUpPlaceholder ?? 'Tell us more (optional)'}
            rows={3}
            style={defaultStyles.input}
            disabled={isSubmitting}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              style={defaultStyles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
            <button
              type="button"
              onClick={handleCancelFollowUp}
              style={{ ...defaultStyles.button, padding: '8px 16px' }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Error message */}
      {error && (
        <div style={defaultStyles.error}>
          {error.message}
        </div>
      )}
    </div>
  );
}

/**
 * ReactionButtons component
 *
 * Renders reaction buttons (thumbs up/down, helpful, emoji, etc.) for inline feedback.
 * Must be used within a FeedValueProvider with a reaction-type widget.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { FeedValueProvider, ReactionButtons } from '@feedvalue/react';
 *
 * function ArticleFooter() {
 *   return (
 *     <FeedValueProvider widgetId="your-reaction-widget-id" headless>
 *       <div>
 *         <h3>Was this helpful?</h3>
 *         <ReactionButtons
 *           onReact={(value) => console.log('Reacted:', value)}
 *         />
 *       </div>
 *     </FeedValueProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom button rendering
 * <ReactionButtons
 *   renderButton={(option, onClick, isDisabled) => (
 *     <button
 *       key={option.value}
 *       onClick={onClick}
 *       disabled={isDisabled}
 *       className="my-custom-button"
 *     >
 *       {option.icon} {option.label}
 *     </button>
 *   )}
 * />
 * ```
 */
export function ReactionButtons(props: ReactionButtonsProps): React.ReactElement {
  return <ReactionButtonsInner {...props} />;
}
