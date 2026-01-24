# @feedvalue/core

Core SDK for FeedValue feedback widget. Provides TypeScript types, initialization, and vanilla JavaScript API.

## Installation

```bash
npm install @feedvalue/core
# or
pnpm add @feedvalue/core
# or
yarn add @feedvalue/core
```

## Usage

### Basic Setup

```typescript
import { FeedValue } from '@feedvalue/core';

// Initialize the widget
const feedvalue = FeedValue.init({
  widgetId: 'your-widget-id',
  config: {
    theme: 'auto', // 'light' | 'dark' | 'auto'
    debug: false,
  },
});

// Open the feedback modal
feedvalue.open();

// Close the modal
feedvalue.close();
```

### Headless Mode

For complete UI control, initialize in headless mode. The SDK fetches config and provides all API methods but renders no DOM elements:

```typescript
const feedvalue = FeedValue.init({
  widgetId: 'your-widget-id',
  headless: true, // No trigger button or modal rendered
});

// Wait until ready
await feedvalue.waitUntilReady();

// Build your own UI, use SDK for submission
await feedvalue.submit({
  message: 'User feedback here',
  sentiment: 'satisfied',
});
```

### User Identification

User data is automatically included with feedback submissions:

```typescript
// Identify the current user
feedvalue.identify('user-123', {
  name: 'John Doe',
  email: 'john@example.com',
  plan: 'pro',
});

// Set additional user data
feedvalue.setData({
  company: 'Acme Inc',
  role: 'Developer',
});

// Reset user data (e.g., on logout)
feedvalue.reset();
```

### Programmatic Submission

```typescript
// Submit feedback programmatically
await feedvalue.submit({
  message: 'Great product!',
  sentiment: 'excited', // 'angry' | 'disappointed' | 'satisfied' | 'excited'
  metadata: {
    page_url: window.location.href,
  },
});
```

### Custom Fields

Custom fields allow you to collect structured data beyond the main feedback message. **Custom fields must be defined in your widget configuration on the FeedValue dashboard before use.**

1. Go to your widget settings in the FeedValue dashboard
2. Add custom fields with types: `text`, `email`, or `emoji`
3. Use `customFieldValues` to submit responses:

```typescript
await feedvalue.submit({
  message: 'Detailed feedback',
  customFieldValues: {
    // Field IDs must match those defined in your widget configuration
    name: 'John Doe',
    category: 'feature',
  },
});
```

> **Important**: The field IDs in `customFieldValues` must match the field IDs defined in your widget configuration on the dashboard.

### Waiting for Ready State

```typescript
// Wait until widget is fully initialized
await feedvalue.waitUntilReady();
console.log('Widget ready, config loaded');

// Or use the event
feedvalue.on('ready', () => {
  console.log('Widget is ready');
});
```

### Event Handling

```typescript
// Listen for widget events
feedvalue.on('ready', () => {
  console.log('Widget is ready');
});

feedvalue.on('open', () => {
  console.log('Modal opened');
});

feedvalue.on('close', () => {
  console.log('Modal closed');
});

feedvalue.on('submit', (feedback) => {
  console.log('Feedback submitted:', feedback);
});

feedvalue.on('error', (error) => {
  console.error('Widget error:', error);
});

// Subscribe to a single event emission
feedvalue.once('ready', () => {
  console.log('First ready event only');
});

// Unsubscribe from events
feedvalue.off('open', handleOpen);
```

### State Subscription (for Framework Integration)

```typescript
// Subscribe to state changes (React useSyncExternalStore compatible)
const unsubscribe = feedvalue.subscribe(() => {
  const state = feedvalue.getSnapshot();
  console.log('State changed:', state);
});

// Get current state snapshot
const state = feedvalue.getSnapshot();
// { isReady, isOpen, isVisible, error, isSubmitting }
```

### Configuration Updates

```typescript
// Update runtime configuration
feedvalue.setConfig({
  theme: 'dark',
  debug: true,
});

// Get current configuration
const config = feedvalue.getConfig();
```

## API Reference

### `FeedValue.init(options)`

Initialize a FeedValue instance.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `widgetId` | `string` | Yes | - | Widget ID from FeedValue dashboard |
| `apiBaseUrl` | `string` | No | Production URL | Custom API URL (for self-hosted) |
| `config` | `Partial<FeedValueConfig>` | No | - | Configuration overrides |
| `headless` | `boolean` | No | `false` | Disable all DOM rendering |
| `debug` | `boolean` | No | `false` | Enable debug logging |

### Instance Methods

| Method | Description |
|--------|-------------|
| `open()` | Open the feedback modal |
| `close()` | Close the feedback modal |
| `toggle()` | Toggle the modal open/closed |
| `show()` | Show the trigger button |
| `hide()` | Hide the trigger button |
| `isOpen()` | Check if modal is open |
| `isVisible()` | Check if trigger is visible |
| `isReady()` | Check if widget is ready |
| `isHeadless()` | Check if running in headless mode |
| `submit(feedback)` | Submit feedback programmatically |
| `identify(userId, traits?)` | Identify the current user |
| `setData(data)` | Set additional user data |
| `reset()` | Reset user data |
| `on(event, handler)` | Subscribe to events |
| `once(event, handler)` | Subscribe to single event |
| `off(event, handler?)` | Unsubscribe from events |
| `waitUntilReady()` | Promise that resolves when ready |
| `subscribe(callback)` | Subscribe to state changes |
| `getSnapshot()` | Get current state |
| `setConfig(config)` | Update runtime configuration |
| `getConfig()` | Get current configuration |
| `destroy()` | Destroy the widget instance |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | - | Widget initialized, config loaded |
| `open` | - | Modal opened |
| `close` | - | Modal closed |
| `submit` | `FeedbackData` | Feedback submitted successfully |
| `error` | `Error` | An error occurred |
| `stateChange` | `FeedValueState` | Any state change |

## Framework Packages

For framework-specific integrations with hooks and components:

- **React/Next.js**: [@feedvalue/react](https://www.npmjs.com/package/@feedvalue/react)
- **Vue/Nuxt**: [@feedvalue/vue](https://www.npmjs.com/package/@feedvalue/vue)

## License

MIT
