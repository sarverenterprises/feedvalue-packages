'use client';

/**
 * @feedvalue/react - Provider
 *
 * FeedValueProvider component for React applications.
 * Uses useSyncExternalStore for React 18+ concurrent mode compatibility.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  useMemo,
  type ReactNode,
} from 'react';
import {
  FeedValue,
  type FeedValueConfig,
  type FeedValueState,
  type FeedbackData,
  type UserTraits,
} from '@feedvalue/core';

/**
 * Context value provided by FeedValueProvider
 */
export interface FeedValueContextValue {
  /** FeedValue instance (for advanced usage) */
  instance: FeedValue | null;
  /** Widget is ready (config loaded) */
  isReady: boolean;
  /** Modal is open */
  isOpen: boolean;
  /** Widget is visible */
  isVisible: boolean;
  /** Current error (if any) */
  error: Error | null;
  /** Submission in progress */
  isSubmitting: boolean;
  /** Running in headless mode (no default UI rendered) */
  isHeadless: boolean;
  /** Open the feedback modal */
  open: () => void;
  /** Close the feedback modal */
  close: () => void;
  /** Toggle the feedback modal */
  toggle: () => void;
  /** Show the trigger button */
  show: () => void;
  /** Hide the trigger button */
  hide: () => void;
  /** Submit feedback programmatically */
  submit: (feedback: Partial<FeedbackData>) => Promise<void>;
  /** Identify user */
  identify: (userId: string, traits?: UserTraits) => void;
  /** Set user data */
  setData: (data: Record<string, string>) => void;
  /** Reset user data */
  reset: () => void;
}

/**
 * FeedValue context (internal)
 */
const FeedValueContext = createContext<FeedValueContextValue | null>(null);

/**
 * Props for FeedValueProvider
 */
export interface FeedValueProviderProps {
  /** Widget ID from FeedValue dashboard */
  widgetId: string;
  /** API base URL (for self-hosted) */
  apiBaseUrl?: string;
  /** Configuration overrides */
  config?: Partial<FeedValueConfig>;
  /**
   * Headless mode - disables all DOM rendering.
   * Use this when you want full control over the UI.
   * The SDK will still fetch config and provide all API methods
   * but won't render any trigger button or modal.
   *
   * @default false
   */
  headless?: boolean;
  /** Children */
  children: ReactNode;
  /** Callback when widget is ready */
  onReady?: () => void;
  /** Callback when modal opens */
  onOpen?: () => void;
  /** Callback when modal closes */
  onClose?: () => void;
  /** Callback when feedback is submitted */
  onSubmit?: (feedback: FeedbackData) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Server snapshot for SSR - always returns initial state
 * This prevents hydration mismatches
 */
const getServerSnapshot = (): FeedValueState => ({
  isReady: false,
  isOpen: false,
  isVisible: false,
  error: null,
  isSubmitting: false,
});

/**
 * FeedValueProvider component
 *
 * Provides FeedValue context to child components.
 *
 * @example
 * ```tsx
 * // app/layout.tsx (Next.js App Router)
 * import { FeedValueProvider } from '@feedvalue/react';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <FeedValueProvider
 *           widgetId="your-widget-id"
 *           onSubmit={(feedback) => console.log('Submitted:', feedback)}
 *         >
 *           {children}
 *         </FeedValueProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function FeedValueProvider({
  widgetId,
  apiBaseUrl,
  config,
  headless,
  children,
  onReady,
  onOpen,
  onClose,
  onSubmit,
  onError,
}: FeedValueProviderProps): React.ReactElement {
  const instanceRef = useRef<FeedValue | null>(null);
  const callbacksRef = useRef({ onReady, onOpen, onClose, onSubmit, onError });

  // Keep callbacks ref updated
  callbacksRef.current = { onReady, onOpen, onClose, onSubmit, onError };

  // Initialize on mount
  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return;

    const instance = FeedValue.init({
      widgetId,
      apiBaseUrl,
      config,
      headless,
    });
    instanceRef.current = instance;

    // Subscribe to events
    const handleReady = () => callbacksRef.current.onReady?.();
    const handleOpen = () => callbacksRef.current.onOpen?.();
    const handleClose = () => callbacksRef.current.onClose?.();
    const handleSubmit = (feedback: FeedbackData) => callbacksRef.current.onSubmit?.(feedback);
    const handleError = (error: Error) => callbacksRef.current.onError?.(error);

    instance.on('ready', handleReady);
    instance.on('open', handleOpen);
    instance.on('close', handleClose);
    instance.on('submit', handleSubmit);
    instance.on('error', handleError);

    return () => {
      instance.off('ready', handleReady);
      instance.off('open', handleOpen);
      instance.off('close', handleClose);
      instance.off('submit', handleSubmit);
      instance.off('error', handleError);
      instance.destroy();
      instanceRef.current = null;
    };
  }, [widgetId, apiBaseUrl, headless]); // Re-init if widgetId, apiBaseUrl, or headless changes

  // Use useSyncExternalStore for concurrent mode compatibility
  const state = useSyncExternalStore(
    // Subscribe function
    (callback) => {
      const instance = instanceRef.current;
      if (!instance) return () => {};
      return instance.subscribe(callback);
    },
    // getSnapshot - client
    () => instanceRef.current?.getSnapshot() ?? getServerSnapshot(),
    // getServerSnapshot - SSR
    getServerSnapshot
  );

  // Stable callback references to prevent recreation on every state change
  const open = useCallback(() => instanceRef.current?.open(), []);
  const close = useCallback(() => instanceRef.current?.close(), []);
  const toggle = useCallback(() => instanceRef.current?.toggle(), []);
  const show = useCallback(() => instanceRef.current?.show(), []);
  const hide = useCallback(() => instanceRef.current?.hide(), []);
  const submit = useCallback(
    (feedback: Partial<FeedbackData>) =>
      instanceRef.current?.submit(feedback) ?? Promise.reject(new Error('Not initialized')),
    []
  );
  const identify = useCallback(
    (userId: string, traits?: UserTraits) => instanceRef.current?.identify(userId, traits),
    []
  );
  const setData = useCallback(
    (data: Record<string, string>) => instanceRef.current?.setData(data),
    []
  );
  const reset = useCallback(() => instanceRef.current?.reset(), []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<FeedValueContextValue>(
    () => ({
      instance: instanceRef.current,
      isReady: state.isReady,
      isOpen: state.isOpen,
      isVisible: state.isVisible,
      error: state.error,
      isSubmitting: state.isSubmitting,
      isHeadless: headless ?? false,
      open,
      close,
      toggle,
      show,
      hide,
      submit,
      identify,
      setData,
      reset,
    }),
    [state, headless, open, close, toggle, show, hide, submit, identify, setData, reset]
  );

  return (
    <FeedValueContext.Provider value={value}>
      {children}
    </FeedValueContext.Provider>
  );
}

/**
 * Hook to access FeedValue context
 *
 * Must be used within a FeedValueProvider.
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useFeedValue } from '@feedvalue/react';
 *
 * export function FeedbackButton() {
 *   const { open, isReady } = useFeedValue();
 *
 *   return (
 *     <button onClick={open} disabled={!isReady}>
 *       Give Feedback
 *     </button>
 *   );
 * }
 * ```
 */
export function useFeedValue(): FeedValueContextValue {
  const context = useContext(FeedValueContext);

  if (!context) {
    throw new Error(
      'useFeedValue must be used within a FeedValueProvider. ' +
        'Make sure to wrap your app with <FeedValueProvider widgetId="...">.'
    );
  }

  return context;
}

/**
 * Hook to check if inside FeedValueProvider
 * Returns null if outside provider, context value if inside
 */
export function useFeedValueOptional(): FeedValueContextValue | null {
  return useContext(FeedValueContext);
}
