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
 * Border radius mapping from preset to CSS value
 */
const borderRadiusMap: Record<string, string> = {
  full: '9999px',
  lg: '12px',
  md: '8px',
  sm: '4px',
  none: '0px',
};

/**
 * Border width mapping from preset to CSS value
 */
const borderWidthMap: Record<string, string> = {
  '0': '0px',
  '1': '1px',
  '2': '2px',
  '3': '3px',
  '4': '4px',
  thin: '1px',
  medium: '2px',
  thick: '3px',
};

/**
 * Button size style variants
 */
const sizeStyles = {
  sm: {
    button: { padding: '6px 12px', fontSize: '12px', gap: '4px' },
    icon: { fontSize: '16px' },
    label: { fontSize: '12px' },
  },
  md: {
    button: { padding: '8px 16px', fontSize: '14px', gap: '6px' },
    icon: { fontSize: '18px' },
    label: { fontSize: '14px' },
  },
  lg: {
    button: { padding: '12px 20px', fontSize: '16px', gap: '8px' },
    icon: { fontSize: '24px' },
    label: { fontSize: '16px' },
  },
};

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
    borderStyle: 'solid',
    cursor: 'pointer',
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
    showLabels,
    buttonSize,
    shouldShowFollowUp,
    styling,
  } = useReaction();

  const [followUpText, setFollowUpText] = useState('');
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Handle button click
  const handleClick = useCallback(
    (option: ReactionOption) => {
      if (shouldShowFollowUp(option.value) && followUpMode === 'inline') {
        setShowFollowUp(option.value);
      } else {
        react(option.value)
          .then(() => onReact?.(option.value))
          .catch((err) => onError?.(err));
      }
    },
    [react, setShowFollowUp, followUpMode, onReact, onError, shouldShowFollowUp]
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
      <div className={thankYouClassName} style={thankYouClassName ? undefined : { ...defaultStyles.thankYou, color: styling.primaryColor ?? '#059669' }}>
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
          const sizeStyle = sizeStyles[buttonSize] || sizeStyles.md;

          // Apply widget styling
          const borderRadius = borderRadiusMap[styling.borderRadius ?? 'full'] ?? '9999px';
          const borderWidth = borderWidthMap[styling.borderWidth ?? 'thin'] ?? '1px';

          const buttonStyle = {
            ...defaultStyles.button,
            ...sizeStyle.button,
            background: styling.backgroundColor ?? '#fff',
            borderColor: styling.borderColor ?? '#e5e7eb',
            borderWidth: borderWidth,
            borderRadius: borderRadius,
            color: styling.buttonTextColor ?? '#4b5563',
            ...(isHovered ? {
              borderColor: styling.primaryColor ?? '#6366f1',
              background: `${styling.primaryColor ?? '#6366f1'}10`, // 10% opacity
            } : {}),
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
              <span role="img" aria-hidden="true" style={sizeStyle.icon}>
                {option.icon}
              </span>
              {showLabels && <span style={{ ...sizeStyle.label, color: styling.buttonTextColor ?? '#4b5563' }}>{option.label}</span>}
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
              style={{ ...defaultStyles.submitButton, background: styling.primaryColor ?? '#6366f1' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
            <button
              type="button"
              onClick={handleCancelFollowUp}
              style={{ ...defaultStyles.button, padding: '8px 16px', borderRadius: borderRadiusMap[styling.borderRadius ?? 'full'] ?? '9999px' }}
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
