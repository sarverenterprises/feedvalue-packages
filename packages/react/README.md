# @feedvalue/react

React SDK for FeedValue feedback widget. Provides Provider, Hooks, and Components for React 18+.

## Installation

```bash
npm install @feedvalue/react
# or
pnpm add @feedvalue/react
# or
yarn add @feedvalue/react
```

## Usage

### Setup with Provider

```tsx
// app/layout.tsx (Next.js App Router)
import { FeedValueProvider } from '@feedvalue/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FeedValueProvider
          widgetId="your-widget-id"
          onReady={() => console.log('Widget ready')}
          onSubmit={(feedback) => console.log('Submitted:', feedback)}
        >
          {children}
        </FeedValueProvider>
      </body>
    </html>
  );
}
```

### Using the Hook

```tsx
'use client';

import { useFeedValue } from '@feedvalue/react';

export function FeedbackButton() {
  const { open, isReady, isOpen } = useFeedValue();

  return (
    <button onClick={open} disabled={!isReady}>
      {isOpen ? 'Close' : 'Give Feedback'}
    </button>
  );
}
```

### Using the Widget Component

```tsx
'use client';

import { FeedValueWidget } from '@feedvalue/react';

// Standalone widget (no Provider needed)
export function FeedbackWidget() {
  return (
    <FeedValueWidget
      widgetId="your-widget-id"
      onSubmit={(feedback) => console.log('Submitted:', feedback)}
    />
  );
}
```

### Programmatic Control

```tsx
'use client';

import { useFeedValue } from '@feedvalue/react';

export function FeedbackForm() {
  const { submit, isSubmitting, error } = useFeedValue();

  const handleSubmit = async (message: string) => {
    try {
      await submit({ message });
      console.log('Feedback submitted successfully');
    } catch (err) {
      console.error('Failed to submit:', err);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(e.currentTarget.message.value);
    }}>
      <textarea name="message" placeholder="Your feedback..." />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
```

### User Identification

```tsx
'use client';

import { useFeedValue } from '@feedvalue/react';
import { useEffect } from 'react';

export function UserIdentifier({ user }) {
  const { identify, setData, reset } = useFeedValue();

  useEffect(() => {
    if (user) {
      identify(user.id, {
        name: user.name,
        email: user.email,
        plan: user.plan,
      });
      setData({ company: user.company });
    } else {
      reset();
    }
  }, [user, identify, setData, reset]);

  return null;
}
```

## API Reference

### `<FeedValueProvider>`

Provider component for FeedValue context.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `widgetId` | `string` | Yes | Widget ID from FeedValue dashboard |
| `apiBaseUrl` | `string` | No | Custom API URL (for self-hosted) |
| `config` | `Partial<FeedValueConfig>` | No | Configuration overrides |
| `onReady` | `() => void` | No | Called when widget is ready |
| `onOpen` | `() => void` | No | Called when modal opens |
| `onClose` | `() => void` | No | Called when modal closes |
| `onSubmit` | `(feedback: FeedbackData) => void` | No | Called when feedback is submitted |
| `onError` | `(error: Error) => void` | No | Called on errors |

### `useFeedValue()`

Hook to access FeedValue context. Must be used within `<FeedValueProvider>`.

Returns:

| Property | Type | Description |
|----------|------|-------------|
| `isReady` | `boolean` | Widget is initialized |
| `isOpen` | `boolean` | Modal is open |
| `isVisible` | `boolean` | Trigger button is visible |
| `error` | `Error \| null` | Current error |
| `isSubmitting` | `boolean` | Submission in progress |
| `open` | `() => void` | Open the modal |
| `close` | `() => void` | Close the modal |
| `toggle` | `() => void` | Toggle modal |
| `show` | `() => void` | Show trigger |
| `hide` | `() => void` | Hide trigger |
| `submit` | `(feedback) => Promise<void>` | Submit feedback |
| `identify` | `(userId, traits?) => void` | Identify user |
| `setData` | `(data) => void` | Set user data |
| `reset` | `() => void` | Reset user data |

### `useFeedValueOptional()`

Same as `useFeedValue()` but returns `null` if used outside provider instead of throwing.

### `<FeedValueWidget>`

Standalone widget component that doesn't require a provider.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `widgetId` | `string` | Yes | Widget ID from FeedValue dashboard |
| `apiBaseUrl` | `string` | No | Custom API URL |
| `config` | `Partial<FeedValueConfig>` | No | Configuration overrides |
| `onReady` | `() => void` | No | Ready callback |
| `onSubmit` | `(feedback) => void` | No | Submit callback |
| `onError` | `(error) => void` | No | Error callback |

## Server-Side Rendering

The SDK is fully SSR-compatible. It uses `useSyncExternalStore` for concurrent mode support and returns safe default values during server rendering.

```tsx
// Works out of the box with Next.js App Router
'use client';

import { useFeedValue } from '@feedvalue/react';

export function FeedbackButton() {
  const { open, isReady } = useFeedValue();

  // isReady is false during SSR, preventing hydration mismatches
  return (
    <button onClick={open} disabled={!isReady}>
      Feedback
    </button>
  );
}
```

## Requirements

- React 18.0.0 or higher
- React DOM 18.0.0 or higher

## License

MIT
