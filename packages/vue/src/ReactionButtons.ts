/**
 * @feedvalue/vue - ReactionButtons Component
 *
 * Pre-built reaction buttons component for Vue applications.
 * Renders reaction options with optional follow-up input.
 */

import { defineComponent, ref, computed, h, type PropType } from 'vue';
import { useReaction } from './use-reaction';
import type { ReactionOption } from '@feedvalue/core';

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
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s',
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
  icon: {
    fontSize: '1.125rem',
  },
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
  },

  emits: {
    /** Emitted when a reaction is submitted */
    react: (value: string, _followUp?: string) => typeof value === 'string',
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
    } = useReaction(props.widgetId);

    // Local state for follow-up input
    const followUpText = ref('');

    // Get follow-up option
    const getFollowUpOption = computed<ReactionOption | null>(() => {
      if (!showFollowUp.value || !options.value) return null;
      return options.value.find((opt) => opt.value === showFollowUp.value) ?? null;
    });

    /**
     * Handle option click
     */
    const handleOptionClick = (option: ReactionOption) => {
      if (option.showFollowUp) {
        setShowFollowUp(option.value);
      } else {
        submitReaction(option.value);
      }
    };

    /**
     * Submit reaction
     */
    const submitReaction = async (value: string, followUp?: string) => {
      try {
        await react(value, followUp);
        emit('react', value, followUp);
      } catch {
        // Error is already set in state
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
      // Don't render if not ready or no options
      if (!isReady.value || !options.value) {
        return null;
      }

      // Render thank you message after submission
      if (submitted.value) {
        return h(
          'div',
          {
            class: props.containerClass,
            style: styles.thankYou,
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

      // Build reaction buttons
      const buttonElements = options.value.map((option) =>
        h(
          'button',
          {
            key: option.value,
            type: 'button',
            class: props.buttonClass,
            style: {
              ...styles.button,
              ...(showFollowUp.value === option.value ? styles.buttonActive : {}),
              ...(isSubmitting.value ? styles.buttonDisabled : {}),
            },
            disabled: isSubmitting.value,
            'aria-pressed': showFollowUp.value === option.value,
            onClick: () => handleOptionClick(option),
          },
          [
            h('span', { style: styles.icon, 'aria-hidden': 'true' }, option.icon),
            h('span', option.label),
          ]
        )
      );

      // Build follow-up form if needed
      let followUpForm = null;
      const followUpOption = getFollowUpOption.value;
      if (showFollowUp.value && followUpOption) {
        followUpForm = h(
          'form',
          {
            style: styles.followUp,
            onSubmit: handleFollowUpSubmit,
          },
          [
            h('input', {
              type: 'text',
              style: styles.input,
              value: followUpText.value,
              placeholder: followUpOption.followUpPlaceholder || 'Tell us more...',
              disabled: isSubmitting.value,
              maxlength: 500,
              onInput: (e: Event) => {
                followUpText.value = (e.target as HTMLInputElement).value;
              },
            }),
            h('div', { style: styles.actions }, [
              h(
                'button',
                {
                  type: 'submit',
                  style: {
                    ...styles.submitButton,
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
                  style: styles.cancelButton,
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
          h('div', { style: styles.buttonGroup, role: 'radiogroup' }, buttonElements),
          followUpForm,
          errorElement,
        ]
      );
    };
  },
});

export default ReactionButtons;
