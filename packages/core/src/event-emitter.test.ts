import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TypedEventEmitter } from './event-emitter';

describe('TypedEventEmitter', () => {
  let emitter: TypedEventEmitter;

  beforeEach(() => {
    emitter = new TypedEventEmitter();
  });

  describe('on()', () => {
    it('should register an event handler', () => {
      const handler = vi.fn();
      emitter.on('ready', handler);
      emitter.emit('ready');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should register multiple handlers for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('ready', handler1);
      emitter.on('ready', handler2);
      emitter.emit('ready');
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('once()', () => {
    it('should call handler only once', () => {
      const handler = vi.fn();
      emitter.once('ready', handler);
      emitter.emit('ready');
      emitter.emit('ready');
      emitter.emit('ready');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the handler', () => {
      const handler = vi.fn();
      emitter.once('error', handler);
      const error = new Error('Test error');
      emitter.emit('error', error);
      expect(handler).toHaveBeenCalledWith(error);
    });

    it('should work alongside regular on() handlers', () => {
      const onceHandler = vi.fn();
      const onHandler = vi.fn();
      emitter.once('ready', onceHandler);
      emitter.on('ready', onHandler);

      emitter.emit('ready');
      expect(onceHandler).toHaveBeenCalledTimes(1);
      expect(onHandler).toHaveBeenCalledTimes(1);

      emitter.emit('ready');
      expect(onceHandler).toHaveBeenCalledTimes(1); // Still 1
      expect(onHandler).toHaveBeenCalledTimes(2);   // Incremented
    });

    it('should handle multiple once() handlers for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.once('ready', handler1);
      emitter.once('ready', handler2);

      emitter.emit('ready');
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      emitter.emit('ready');
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should pass event data for submit event', () => {
      const handler = vi.fn();
      emitter.once('submit', handler);

      const feedbackData = {
        message: 'Great product!',
        sentiment: 'excited' as const,
      };
      emitter.emit('submit', feedbackData);

      expect(handler).toHaveBeenCalledWith(feedbackData);
    });
  });

  describe('off()', () => {
    it('should remove a specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('ready', handler1);
      emitter.on('ready', handler2);
      emitter.off('ready', handler1);
      emitter.emit('ready');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should remove all handlers when no handler specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('ready', handler1);
      emitter.on('ready', handler2);
      emitter.off('ready');
      emitter.emit('ready');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent handler gracefully', () => {
      const handler = vi.fn();
      expect(() => emitter.off('ready', handler)).not.toThrow();
    });

    it('should clean up event key when last handler removed', () => {
      const handler = vi.fn();
      emitter.on('ready', handler);
      emitter.off('ready', handler);
      emitter.emit('ready');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('emit()', () => {
    it('should call handler when event is emitted', () => {
      const handler = vi.fn();
      emitter.on('ready', handler);
      emitter.emit('ready');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should call all handlers for an event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('ready', handler1);
      emitter.on('ready', handler2);
      emitter.emit('ready');
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to handlers', () => {
      const handler = vi.fn();
      emitter.on('error', handler);
      const error = new Error('Test error');
      emitter.emit('error', error);
      expect(handler).toHaveBeenCalledWith(error);
    });

    it('should not throw if no handlers registered', () => {
      expect(() => emitter.emit('ready')).not.toThrow();
    });

    it('should continue calling handlers even if one throws', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const handler1 = vi.fn(() => {
        throw new Error('Handler error');
      });
      const handler2 = vi.fn();

      emitter.on('ready', handler1);
      emitter.on('ready', handler2);
      emitter.emit('ready');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe('removeAllListeners()', () => {
    it('should remove all listeners for all events', () => {
      const readyHandler = vi.fn();
      const openHandler = vi.fn();
      const closeHandler = vi.fn();
      emitter.on('ready', readyHandler);
      emitter.on('open', openHandler);
      emitter.on('close', closeHandler);
      emitter.removeAllListeners();
      emitter.emit('ready');
      emitter.emit('open');
      emitter.emit('close');
      expect(readyHandler).not.toHaveBeenCalled();
      expect(openHandler).not.toHaveBeenCalled();
      expect(closeHandler).not.toHaveBeenCalled();
    });
  });
});
