import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedValueProvider, useFeedValue, useFeedValueOptional } from './provider';
import { FeedValue } from '@feedvalue/core';

// Test component that uses optional hook
function OptionalConsumer() {
  const context = useFeedValueOptional();
  return (
    <div>
      <span data-testid="has-context">{String(context !== null)}</span>
      {context && (
        <>
          <span data-testid="is-ready">{String(context.isReady)}</span>
          <span data-testid="has-open-fn">{String(typeof context.open === 'function')}</span>
          <span data-testid="has-close-fn">{String(typeof context.close === 'function')}</span>
          <span data-testid="has-submit-fn">{String(typeof context.submit === 'function')}</span>
        </>
      )}
    </div>
  );
}

// Test component that throws when outside provider
function RequiredConsumer() {
  const context = useFeedValue();
  return <span data-testid="context-value">{String(context.isReady)}</span>;
}

describe('FeedValueProvider', () => {
  beforeEach(() => {
    // Mock fetch globally
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        widget_id: 'test-widget-123',
        app_id: 'test-app',
        submission_token: 'token',
        token_expires_at: Math.floor(Date.now() / 1000) + 3600,
        config: { position: 'bottom-right', formTitle: 'Feedback' },
        styling: { primaryColor: '#000' },
        allowed_origins: ['*'],
      }),
    }));

    vi.stubGlobal('crypto', {
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    // Cleanup instances
    const instance = FeedValue.getInstance('test-widget-123');
    if (instance) {
      instance.destroy();
    }
    const instance2 = FeedValue.getInstance('another-widget');
    if (instance2) {
      instance2.destroy();
    }

    // Clean up DOM
    document.querySelectorAll('.fv-widget-trigger, .fv-widget-modal, .fv-widget-overlay').forEach(el => el.remove());
    document.getElementById('fv-widget-styles')?.remove();
  });

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <FeedValueProvider widgetId="test-widget-123">
          <div data-testid="child">Child content</div>
        </FeedValueProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Child content');
    });

    it('should render multiple children', () => {
      render(
        <FeedValueProvider widgetId="test-widget-123">
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </FeedValueProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('useFeedValueOptional', () => {
    it('should return null outside provider', () => {
      render(<OptionalConsumer />);
      expect(screen.getByTestId('has-context')).toHaveTextContent('false');
    });

    it('should return context inside provider', () => {
      render(
        <FeedValueProvider widgetId="test-widget-123">
          <OptionalConsumer />
        </FeedValueProvider>
      );
      expect(screen.getByTestId('has-context')).toHaveTextContent('true');
    });

    it('should provide control functions', () => {
      render(
        <FeedValueProvider widgetId="test-widget-123">
          <OptionalConsumer />
        </FeedValueProvider>
      );

      expect(screen.getByTestId('has-open-fn')).toHaveTextContent('true');
      expect(screen.getByTestId('has-close-fn')).toHaveTextContent('true');
      expect(screen.getByTestId('has-submit-fn')).toHaveTextContent('true');
    });

    it('should provide initial state values', () => {
      render(
        <FeedValueProvider widgetId="test-widget-123">
          <OptionalConsumer />
        </FeedValueProvider>
      );

      // Initially not ready (async init hasn't completed)
      expect(screen.getByTestId('is-ready')).toHaveTextContent('false');
    });
  });

  describe('useFeedValue', () => {
    it('should throw when used outside provider', () => {
      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<RequiredConsumer />);
      }).toThrow('useFeedValue must be used within a FeedValueProvider');

      consoleSpy.mockRestore();
    });

    it('should not throw when used inside provider', () => {
      expect(() => {
        render(
          <FeedValueProvider widgetId="test-widget-123">
            <RequiredConsumer />
          </FeedValueProvider>
        );
      }).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should handle unmount gracefully', () => {
      const { unmount } = render(
        <FeedValueProvider widgetId="test-widget-123">
          <div>Content</div>
        </FeedValueProvider>
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('props', () => {
    it('should accept optional config prop', () => {
      expect(() => {
        render(
          <FeedValueProvider
            widgetId="test-widget-123"
            config={{ theme: 'dark', debug: true }}
          >
            <div>Content</div>
          </FeedValueProvider>
        );
      }).not.toThrow();
    });

    it('should accept optional apiBaseUrl prop', () => {
      expect(() => {
        render(
          <FeedValueProvider
            widgetId="test-widget-123"
            apiBaseUrl="https://custom.api.com"
          >
            <div>Content</div>
          </FeedValueProvider>
        );
      }).not.toThrow();
    });

    it('should accept callback props', () => {
      const callbacks = {
        onReady: vi.fn(),
        onOpen: vi.fn(),
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        onError: vi.fn(),
      };

      expect(() => {
        render(
          <FeedValueProvider widgetId="test-widget-123" {...callbacks}>
            <div>Content</div>
          </FeedValueProvider>
        );
      }).not.toThrow();
    });
  });
});
