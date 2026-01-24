'use client';

import { useState, useEffect } from 'react';
import { useFeedValue } from '@feedvalue/react';
import styles from './headless-demo.module.css';

export function HeadlessDemo() {
  const {
    isReady,
    submit,
    isSubmitting,
    identify,
    setData,
    error,
  } = useFeedValue();

  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Simulate user identification on mount
  useEffect(() => {
    if (isReady) {
      identify('demo-user-123', {
        name: 'Demo User',
        email: 'demo@example.com',
        plan: 'pro',
      });
      setData({ source: 'nextjs-example' });
    }
  }, [isReady, identify, setData]);

  const handleOpen = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await submit({ message: message.trim() });
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      console.error('Submission failed:', err);
    }
  };

  if (!isReady) {
    return <div className={styles.loading}>Loading headless demo...</div>;
  }

  return (
    <div className={styles.container}>
      <button className={styles.trigger} onClick={handleOpen}>
        Open Custom Feedback Modal
      </button>

      {showModal && (
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {submitted ? (
              <div className={styles.success}>
                <span className={styles.checkmark}>✓</span>
                <p>Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                <h3 className={styles.modalTitle}>Custom Feedback Form</h3>
                <p className={styles.modalDescription}>
                  This is a completely custom UI using headless mode.
                </p>
                <form onSubmit={handleSubmit}>
                  <textarea
                    className={styles.textarea}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={4}
                    disabled={isSubmitting}
                  />
                  {error && <p className={styles.error}>{error.message}</p>}
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={isSubmitting || !message.trim()}
                    >
                      {isSubmitting ? 'Sending...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
