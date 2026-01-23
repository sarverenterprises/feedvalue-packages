/**
 * @feedvalue/core - Type-Safe Event Emitter
 *
 * A minimal, type-safe event emitter for FeedValue events.
 * Provides compile-time type checking for event names and handlers.
 */

import type { FeedValueEvents, EventHandler } from './types';

/**
 * Type-safe event emitter for FeedValue events
 *
 * @example
 * ```ts
 * const emitter = new TypedEventEmitter();
 *
 * emitter.on('ready', () => console.log('Ready!'));
 * emitter.on('submit', (feedback) => console.log('Submitted:', feedback));
 *
 * emitter.emit('ready');
 * emitter.emit('submit', { message: 'Great app!' });
 * ```
 */
export class TypedEventEmitter {
  // Using a Map with proper typing - the inner Function type is acceptable here
  // because we handle type safety at the public API level (on/off/emit methods)
  private listeners = new Map<keyof FeedValueEvents, Set<(...args: unknown[]) => void>>();

  /**
   * Subscribe to an event
   *
   * @param event - Event name
   * @param handler - Event handler function
   */
  on<K extends keyof FeedValueEvents>(event: K, handler: EventHandler<K>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as (...args: unknown[]) => void);
  }

  /**
   * Subscribe to an event for a single emission.
   * The handler will be automatically removed after the first call.
   *
   * @param event - Event name
   * @param handler - Event handler function
   */
  once<K extends keyof FeedValueEvents>(event: K, handler: EventHandler<K>): void {
    const wrappedHandler = ((...args: unknown[]) => {
      this.off(event, wrappedHandler as EventHandler<K>);
      (handler as (...args: unknown[]) => void)(...args);
    }) as EventHandler<K>;

    this.on(event, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   *
   * @param event - Event name
   * @param handler - Optional handler to remove (removes all if not provided)
   */
  off<K extends keyof FeedValueEvents>(event: K, handler?: EventHandler<K>): void {
    if (!handler) {
      // Remove all handlers for this event
      this.listeners.delete(event);
      return;
    }

    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as (...args: unknown[]) => void);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   *
   * @param event - Event name
   * @param args - Arguments to pass to handlers
   */
  emit<K extends keyof FeedValueEvents>(
    event: K,
    ...args: Parameters<EventHandler<K>>
  ): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch (error) {
          // Prevent one handler's error from breaking others
          console.error(`[FeedValue] Error in ${event} handler:`, error);
        }
      }
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
