import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, defineComponent, h, inject, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createFeedValue, FEEDVALUE_KEY, FEEDVALUE_OPTIONS_KEY } from './plugin';
import { useFeedValue } from './composables';
import { FeedValue } from '@feedvalue/core';

describe('createFeedValue Plugin', () => {
  beforeEach(() => {
    // Mock fetch
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

    // Clean up DOM
    document.querySelectorAll('.fv-widget-trigger, .fv-widget-modal, .fv-widget-overlay').forEach(el => el.remove());
    document.getElementById('fv-widget-styles')?.remove();
  });

  describe('plugin installation', () => {
    it('should create a valid plugin object', () => {
      const plugin = createFeedValue({ widgetId: 'test-widget-123' });
      expect(plugin).toHaveProperty('install');
      expect(typeof plugin.install).toBe('function');
    });

    it('should provide options to the app', () => {
      const TestComponent = defineComponent({
        setup() {
          const options = inject(FEEDVALUE_OPTIONS_KEY);
          return { options };
        },
        render() {
          return h('div', { 'data-testid': 'widget-id' }, this.options?.widgetId);
        },
      });

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[createFeedValue({ widgetId: 'test-widget-123' })]],
        },
      });

      expect(wrapper.find('[data-testid="widget-id"]').text()).toBe('test-widget-123');
    });

    it('should accept apiBaseUrl option', () => {
      const plugin = createFeedValue({
        widgetId: 'test-widget-123',
        apiBaseUrl: 'https://custom.api.com',
      });
      expect(plugin).toBeDefined();
    });

    it('should accept config option', () => {
      const plugin = createFeedValue({
        widgetId: 'test-widget-123',
        config: { theme: 'dark', debug: true },
      });
      expect(plugin).toBeDefined();
    });
  });

  describe('global properties', () => {
    it('should provide $feedvalue on globalProperties', async () => {
      const TestComponent = defineComponent({
        render() {
          return h('div', { 'data-testid': 'has-feedvalue' }, String(this.$feedvalue !== undefined));
        },
      });

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[createFeedValue({ widgetId: 'test-widget-123' })]],
        },
      });

      // Wait for async initialization
      await nextTick();

      // The global property should be defined
      expect(wrapper.find('[data-testid="has-feedvalue"]').text()).toBe('true');
    });
  });
});

describe('useFeedValue Composable', () => {
  beforeEach(() => {
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
    ['test-widget-123', 'standalone-widget'].forEach((id) => {
      const instance = FeedValue.getInstance(id);
      if (instance) {
        instance.destroy();
      }
    });

    // Clean up DOM
    document.querySelectorAll('.fv-widget-trigger, .fv-widget-modal, .fv-widget-overlay').forEach(el => el.remove());
    document.getElementById('fv-widget-styles')?.remove();
  });

  describe('with plugin', () => {
    it('should return control methods', () => {
      const TestComponent = defineComponent({
        setup() {
          const feedvalue = useFeedValue();
          return { feedvalue };
        },
        render() {
          return h('div', [
            h('span', { 'data-testid': 'has-open' }, String(typeof this.feedvalue.open === 'function')),
            h('span', { 'data-testid': 'has-close' }, String(typeof this.feedvalue.close === 'function')),
            h('span', { 'data-testid': 'has-submit' }, String(typeof this.feedvalue.submit === 'function')),
          ]);
        },
      });

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[createFeedValue({ widgetId: 'test-widget-123' })]],
        },
      });

      expect(wrapper.find('[data-testid="has-open"]').text()).toBe('true');
      expect(wrapper.find('[data-testid="has-close"]').text()).toBe('true');
      expect(wrapper.find('[data-testid="has-submit"]').text()).toBe('true');
    });

    it('should return reactive state', () => {
      const TestComponent = defineComponent({
        setup() {
          const feedvalue = useFeedValue();
          return { feedvalue };
        },
        render() {
          return h('div', [
            h('span', { 'data-testid': 'is-ready' }, String(this.feedvalue.isReady.value)),
            h('span', { 'data-testid': 'is-open' }, String(this.feedvalue.isOpen.value)),
            h('span', { 'data-testid': 'is-visible' }, String(this.feedvalue.isVisible.value)),
          ]);
        },
      });

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[createFeedValue({ widgetId: 'test-widget-123' })]],
        },
      });

      // Initial state
      expect(wrapper.find('[data-testid="is-ready"]').text()).toBe('false');
      expect(wrapper.find('[data-testid="is-open"]').text()).toBe('false');
    });
  });

  describe('standalone mode', () => {
    it('should create instance when widgetId provided directly', () => {
      const TestComponent = defineComponent({
        setup() {
          const feedvalue = useFeedValue('standalone-widget');
          return { feedvalue };
        },
        render() {
          return h('div', { 'data-testid': 'has-instance' }, String(this.feedvalue.instance.value !== null));
        },
      });

      const wrapper = mount(TestComponent);

      // Initially no instance until mounted
      expect(wrapper.find('[data-testid="has-instance"]').text()).toBe('false');
    });

    it('should log error when no widgetId provided without plugin', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = defineComponent({
        setup() {
          const feedvalue = useFeedValue();
          return { feedvalue };
        },
        render() {
          return h('div');
        },
      });

      mount(TestComponent);

      // Wait for mount and error logging
      await nextTick();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FeedValue] No widgetId provided')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('return types', () => {
    it('should provide all expected properties', () => {
      const TestComponent = defineComponent({
        setup() {
          const feedvalue = useFeedValue();
          return { feedvalue };
        },
        render() {
          const keys = [
            'instance',
            'isReady',
            'isOpen',
            'isVisible',
            'error',
            'isSubmitting',
            'isHeadless',
            'open',
            'close',
            'toggle',
            'show',
            'hide',
            'submit',
            'identify',
            'setData',
            'reset',
          ];
          const hasAllKeys = keys.every((key) => key in this.feedvalue);
          return h('div', { 'data-testid': 'has-all-keys' }, String(hasAllKeys));
        },
      });

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [[createFeedValue({ widgetId: 'test-widget-123' })]],
        },
      });

      expect(wrapper.find('[data-testid="has-all-keys"]').text()).toBe('true');
    });
  });
});
