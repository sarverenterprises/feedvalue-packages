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
  private listeners = new Map<keyof FeedValueEvents, Set<Function>>();

  /**
   * Subscribe to an event
   *
   * @param event - Event name
   * @param handler - Event handler function
   */
  on<K extends keyof FeedValueEvents>(event: K, handler: EventHandler<K>): void {
    const handlers = this.listeners.get(event) ?? new Set();
    handlers.add(handler);
    this.listeners.set(event, handlers);
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
      handlers.delete(handler);
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
   * Check if there are any listeners for an event
   *
   * @param event - Event name
   * @returns True if there are listeners
   */
  hasListeners<K extends keyof FeedValueEvents>(event: K): boolean {
    const handlers = this.listeners.get(event);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * Get the number of listeners for an event
   *
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount<K extends keyof FeedValueEvents>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
