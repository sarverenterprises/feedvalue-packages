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

### User Identification

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
  sentiment: '😊',
  metadata: {
    page_url: window.location.href,
    custom_field: 'value',
  },
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

## API Reference

### `FeedValue.init(options)`

Initialize a FeedValue instance.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `widgetId` | `string` | Yes | Widget ID from FeedValue dashboard |
| `apiBaseUrl` | `string` | No | Custom API URL (for self-hosted) |
| `config` | `Partial<FeedValueConfig>` | No | Configuration overrides |

### Instance Methods

| Method | Description |
|--------|-------------|
| `open()` | Open the feedback modal |
| `close()` | Close the feedback modal |
| `toggle()` | Toggle the modal open/closed |
| `show()` | Show the trigger button |
| `hide()` | Hide the trigger button |
| `submit(feedback)` | Submit feedback programmatically |
| `identify(userId, traits?)` | Identify the current user |
| `setData(data)` | Set additional user data |
| `reset()` | Reset user data |
| `on(event, handler)` | Subscribe to events |
| `off(event, handler?)` | Unsubscribe from events |
| `subscribe(callback)` | Subscribe to state changes |
| `getSnapshot()` | Get current state |
| `getConfig()` | Get current configuration |
| `destroy()` | Destroy the widget instance |

## Framework Packages

For framework-specific integrations:

- **React**: [@feedvalue/react](https://www.npmjs.com/package/@feedvalue/react)
- **Vue**: [@feedvalue/vue](https://www.npmjs.com/package/@feedvalue/vue)

## License

MIT
