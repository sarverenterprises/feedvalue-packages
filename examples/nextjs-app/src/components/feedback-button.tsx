'use client';

import { useFeedValue } from '@feedvalue/react';
import styles from './feedback-button.module.css';

export function FeedbackButton() {
  const { open, isReady, isOpen } = useFeedValue();

  return (
    <button
      className={styles.button}
      onClick={open}
      disabled={!isReady}
    >
      {!isReady ? 'Loading...' : isOpen ? 'Close Feedback' : 'Give Feedback'}
    </button>
  );
}
