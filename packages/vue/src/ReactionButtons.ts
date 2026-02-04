/**
 * @feedvalue/vue - ReactionButtons Component
 *
 * Pre-built reaction buttons component for Vue applications.
 * Renders reaction options with optional follow-up input.
 */

import { defineComponent, ref, computed, h, type PropType } from 'vue';
import { useReaction } from './use-reaction';
import type { ReactionOption } from '@feedvalue/core';

import type { ButtonSize, ReactionBorderRadius } from '@feedvalue/core';

/**
 * Border radius mapping from preset to CSS value
 */
const borderRadiusMap: Record<ReactionBorderRadius, string> = {
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
const sizeStyles: Record<ButtonSize, { button: Record<string, string>; icon: Record<string, string>; label: Record<string, string> }> = {
  sm: {
    button: { padding: '0.375rem 0.75rem', fontSize: '0.75rem', gap: '0.375rem' },
    icon: { fontSize: '1rem' },
    label: { fontSize: '0.75rem' },
  },
  md: {
    button: { padding: '0.5rem 1rem', fontSize: '0.875rem', gap: '0.5rem' },
    icon: { fontSize: '1.125rem' },
    label: { fontSize: '0.875rem' },
  },
  lg: {
    button: { padding: '0.75rem 1.25rem', fontSize: '1rem', gap: '0.625rem' },
    icon: { fontSize: '1.5rem' },
    label: { fontSize: '1rem' },
  },
};

/**
 * Default CSS styles for the component
 */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s, transform 0.1s',
  },
  buttonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
    color: '#4f46e5',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  icon: {},
  followUp: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
    resize: 'none' as const,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  submitButton: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  thankYou: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '0.5rem',
  },
  resetButton: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  error: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '0.375rem',
  },
};

/**
 * ReactionButtons Component
 *
 * Pre-built reaction buttons with follow-up input support.
 *
 * @example
 * ```vue
 * <template>
 *   <ReactionButtons widget-id="xxx" @react="onReact" />
 * </template>
 *
 * <script setup>
 * import { ReactionButtons } from '@feedvalue/vue';
 *
 * const onReact = (value, followUp) => {
 *   console.log('Reacted:', value, followUp);
 * };
 * </script>
 * ```
 */
export const ReactionButtons = defineComponent({
  name: 'ReactionButtons',

  props: {
    /** Widget ID (optional if using FeedValue plugin) */
    widgetId: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /** Custom thank you message (overrides widget config) */
    thankYouMessage: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /** Custom class for the container */
    containerClass: {
      type: String,
      default: '',
    },
    /** Custom class for buttons */
    buttonClass: {
      type: String,
      default: '',
    },
    /** Custom class for the follow-up form */
    formClass: {
      type: String,
      default: '',
    },
    /** Custom class for the thank you message */
    thankYouClass: {
      type: String,
      default: '',
    },
    /** Hide after submission (default: false) */
    hideAfterSubmit: {
      type: Boolean,
      default: false,
    },
    /** Whether to show follow-up inline or not at all */
    followUpMode: {
      type: String as PropType<'inline' | 'none'>,
      default: 'inline',
    },
  },

  emits: {
    /** Emitted when a reaction is submitted */
    react: (value: string, _followUp?: string) => typeof value === 'string',
    /** Emitted when an error occurs */
    error: (_error: Error) => true,
  },

  setup(props, { emit }) {
    const {
      options,
      react,
      isSubmitting,
      submitted,
      error,
      showFollowUp,
      setShowFollowUp,
      clearSubmitted,
      isReady,
      showLabels,
      buttonSize,
      shouldShowFollowUp,
      styling,
      isReactionWidget,
    } = useReaction(props.widgetId);

    // Local state for follow-up input
    const followUpText = ref('');
    // Hover state for buttons
    const hoveredButton = ref<string | null>(null);

    // Get follow-up option
    const getFollowUpOption = computed<ReactionOption | null>(() => {
      if (!showFollowUp.value || !options.value) return null;
      return options.value.find((opt) => opt.value === showFollowUp.value) ?? null;
    });

    /**
     * Handle option click
     */
    const handleOptionClick = (option: ReactionOption) => {
      if (props.followUpMode === 'inline' && shouldShowFollowUp(option.value)) {
        setShowFollowUp(option.value);
      } else {
        submitReaction(option.value);
      }
    };

    /**
     * Submit reaction
     */
    const submitReaction = async (value: string, followUp?: string) => {
      const trimmedFollowUp = followUp?.trim() || undefined;
      try {
        await react(value, trimmedFollowUp);
        emit('react', value, trimmedFollowUp);
      } catch (err) {
        const reactionError = err instanceof Error ? err : new Error(String(err));
        emit('error', reactionError);
      }
    };

    /**
     * Handle follow-up form submit
     */
    const handleFollowUpSubmit = (e: Event) => {
      e.preventDefault();
      if (showFollowUp.value) {
        submitReaction(showFollowUp.value, followUpText.value || undefined);
        followUpText.value = '';
      }
    };

    /**
     * Cancel follow-up
     */
    const cancelFollowUp = () => {
      setShowFollowUp(null);
      followUpText.value = '';
    };

    return () => {
      // Don't render if not ready, not a reaction widget, or no options
      if (!isReady.value || !isReactionWidget.value || !options.value) {
        return null;
      }

      // Hide after submission if prop is set
      if (submitted.value && props.hideAfterSubmit) {
        return null;
      }

      // Render thank you message after submission
      if (submitted.value) {
        const currentStyling = styling.value;
        return h(
          'div',
          {
            class: props.thankYouClass || props.containerClass,
            style: props.thankYouClass ? undefined : {
              ...styles.thankYou,
              color: currentStyling.primaryColor ?? '#059669',
            },
          },
          [
            h('span', props.thankYouMessage || 'Thanks for your feedback!'),
            h(
              'button',
              {
                type: 'button',
                style: styles.resetButton,
                onClick: clearSubmitted,
                'aria-label': 'Submit another reaction',
              },
              '↺'
            ),
          ]
        );
      }

      // Build reaction buttons using styling from widget config
      const currentSizeStyles = sizeStyles[buttonSize.value] || sizeStyles.md;
      const currentStyling = styling.value;
      const borderRadius = borderRadiusMap[currentStyling.borderRadius ?? 'full'] ?? '9999px';
      const borderWidth = borderWidthMap[currentStyling.borderWidth ?? '1'] ?? '1px';

      // Only show buttons when follow-up is not displayed
      const buttonElements = !showFollowUp.value ? options.value.map((option) => {
        const isActive = showFollowUp.value === option.value;
        const isHovered = hoveredButton.value === option.value;
        const children = [
          h('span', { style: { ...styles.icon, ...currentSizeStyles.icon }, 'aria-hidden': 'true' }, option.icon),
        ];
        if (showLabels.value) {
          children.push(h('span', { style: { ...currentSizeStyles.label, color: currentStyling.buttonTextColor ?? '#4b5563' } }, option.label));
        }

        return h(
          'button',
          {
            key: option.value,
            type: 'button',
            class: props.buttonClass,
            style: {
              ...styles.button,
              ...currentSizeStyles.button,
              backgroundColor: currentStyling.backgroundColor ?? '#ffffff',
              borderColor: isActive || isHovered ? (currentStyling.primaryColor ?? '#6366f1') : (currentStyling.borderColor ?? '#e5e7eb'),
              borderWidth: borderWidth,
              borderRadius: borderRadius,
              borderStyle: 'solid',
              color: currentStyling.buttonTextColor ?? '#4b5563',
              ...(isActive || isHovered ? {
                backgroundColor: `${currentStyling.primaryColor ?? '#6366f1'}10`,
              } : {}),
              ...(isSubmitting.value ? styles.buttonDisabled : {}),
            },
            disabled: isSubmitting.value,
            'aria-pressed': isActive,
            'aria-label': option.label,
            onClick: () => handleOptionClick(option),
            onMouseenter: () => { hoveredButton.value = option.value; },
            onMouseleave: () => { hoveredButton.value = null; },
          },
          children
        );
      }) : [];

      // Build follow-up form if needed
      let followUpForm = null;
      const followUpOption = getFollowUpOption.value;
      if (showFollowUp.value && followUpOption) {
        followUpForm = h(
          'form',
          {
            class: props.formClass,
            style: props.formClass ? undefined : styles.followUp,
            onSubmit: handleFollowUpSubmit,
          },
          [
            h('textarea', {
              style: styles.input,
              value: followUpText.value,
              placeholder: followUpOption.followUpPlaceholder || 'Tell us more (optional)',
              disabled: isSubmitting.value,
              maxlength: 500,
              rows: 3,
              onInput: (e: Event) => {
                followUpText.value = (e.target as HTMLTextAreaElement).value;
              },
            }),
            h('div', { style: { ...styles.actions, justifyContent: 'center' } }, [
              h(
                'button',
                {
                  type: 'submit',
                  style: {
                    ...styles.submitButton,
                    backgroundColor: currentStyling.primaryColor ?? '#6366f1',
                    borderRadius: borderRadius,
                    ...(isSubmitting.value ? styles.buttonDisabled : {}),
                  },
                  disabled: isSubmitting.value,
                },
                isSubmitting.value ? 'Sending...' : 'Send'
              ),
              h(
                'button',
                {
                  type: 'button',
                  style: {
                    ...styles.cancelButton,
                    backgroundColor: currentStyling.backgroundColor ?? '#ffffff',
                    color: currentStyling.buttonTextColor ?? '#6b7280',
                    borderRadius: borderRadius,
                    border: `${borderWidth} solid ${currentStyling.borderColor ?? '#e5e7eb'}`,
                  },
                  disabled: isSubmitting.value,
                  onClick: cancelFollowUp,
                },
                'Cancel'
              ),
            ]),
          ]
        );
      }

      // Build error message
      let errorElement = null;
      if (error.value) {
        errorElement = h(
          'div',
          { style: styles.error, role: 'alert' },
          error.value.message
        );
      }

      // Return full component
      return h(
        'div',
        {
          class: props.containerClass,
          style: styles.container,
          role: 'group',
          'aria-label': 'Reaction buttons',
        },
        [
          // Only render button group if there are buttons to show
          buttonElements.length > 0
            ? h('div', { style: styles.buttonGroup, role: 'radiogroup' }, buttonElements)
            : null,
          followUpForm,
          errorElement,
        ].filter(Boolean)
      );
    };
  },
});

export default ReactionButtons;
