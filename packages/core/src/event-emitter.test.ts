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
      expect(emitter.hasListeners('ready')).toBe(true);
      expect(emitter.listenerCount('ready')).toBe(1);
    });

    it('should register multiple handlers for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('ready', handler1);
      emitter.on('ready', handler2);
      expect(emitter.listenerCount('ready')).toBe(2);
    });
  });

  describe('off()', () => {
    it('should remove a specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('ready', handler1);
      emitter.on('ready', handler2);
      emitter.off('ready', handler1);
      expect(emitter.listenerCount('ready')).toBe(1);
    });

    it('should remove all handlers when no handler specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('ready', handler1);
      emitter.on('ready', handler2);
      emitter.off('ready');
      expect(emitter.hasListeners('ready')).toBe(false);
    });

    it('should handle removing non-existent handler gracefully', () => {
      const handler = vi.fn();
      expect(() => emitter.off('ready', handler)).not.toThrow();
    });

    it('should clean up event key when last handler removed', () => {
      const handler = vi.fn();
      emitter.on('ready', handler);
      emitter.off('ready', handler);
      expect(emitter.hasListeners('ready')).toBe(false);
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

  describe('hasListeners()', () => {
    it('should return false when no listeners registered', () => {
      expect(emitter.hasListeners('ready')).toBe(false);
    });

    it('should return true when listeners registered', () => {
      emitter.on('ready', vi.fn());
      expect(emitter.hasListeners('ready')).toBe(true);
    });
  });

  describe('listenerCount()', () => {
    it('should return 0 when no listeners registered', () => {
      expect(emitter.listenerCount('ready')).toBe(0);
    });

    it('should return correct count', () => {
      emitter.on('ready', vi.fn());
      emitter.on('ready', vi.fn());
      expect(emitter.listenerCount('ready')).toBe(2);
    });
  });

  describe('removeAllListeners()', () => {
    it('should remove all listeners for all events', () => {
      emitter.on('ready', vi.fn());
      emitter.on('open', vi.fn());
      emitter.on('close', vi.fn());
      emitter.removeAllListeners();
      expect(emitter.hasListeners('ready')).toBe(false);
      expect(emitter.hasListeners('open')).toBe(false);
      expect(emitter.hasListeners('close')).toBe(false);
    });
  });
});
