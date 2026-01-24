# @feedvalue/react

React SDK for FeedValue feedback widget. Provides Provider and Hooks for React 18+.

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

### Headless Mode

For complete UI control, use headless mode. The SDK fetches config and provides all API methods but renders no trigger button or modal:

```tsx
// app/layout.tsx
import { FeedValueProvider } from '@feedvalue/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FeedValueProvider widgetId="your-widget-id" headless>
          {children}
        </FeedValueProvider>
      </body>
    </html>
  );
}
```

```tsx
// components/custom-feedback.tsx
'use client';

import { useState } from 'react';
import { useFeedValue } from '@feedvalue/react';

export function CustomFeedback() {
  const { isReady, isOpen, open, close, submit, isSubmitting, isHeadless } = useFeedValue();
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    await submit({ message });
    setMessage('');
    close();
  };

  if (!isReady) return null;

  return (
    <>
      <button onClick={open}>Feedback</button>

      {isOpen && (
        <dialog open className="feedback-modal">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your feedback..."
          />
          <div>
            <button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Submit'}
            </button>
            <button onClick={close}>Cancel</button>
          </div>
        </dialog>
      )}
    </>
  );
}
```

### Programmatic Submission

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

### Custom Fields

Custom fields allow you to collect structured data beyond the main feedback message. **Custom fields must be defined in your widget configuration on the FeedValue dashboard before use.**

1. Go to your widget settings in the FeedValue dashboard
2. Add custom fields with types: `text`, `email`, or `emoji`
3. Use `customFieldValues` when submitting:

```tsx
'use client';

import { useFeedValue } from '@feedvalue/react';

export function DetailedFeedback() {
  const { submit, isReady } = useFeedValue();

  const handleSubmit = async () => {
    await submit({
      message: 'Detailed feedback',
      customFieldValues: {
        // Field IDs must match those defined in your widget configuration
        name: 'John Doe',
        category: 'feature',
      },
    });
  };

  return (
    <button onClick={handleSubmit} disabled={!isReady}>
      Submit Feedback
    </button>
  );
}
```

> **Important**: The field IDs in `customFieldValues` must match the field IDs defined in your widget configuration on the dashboard.

### User Identification

Attach user context to feedback submissions. This data is **not shown in the widget UI** but is stored with the submission and visible in your FeedValue dashboard:

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

> **User Data vs Custom Fields**
> - **User data** (`identify`/`setData`): Hidden from users, automatically attached to submissions. Use for internal context like user IDs, subscription plans, etc.
> - **Custom fields** (`customFieldValues`): Shown as form inputs in the widget. Users fill these in themselves. Must be defined in widget configuration first.

## API Reference

### `<FeedValueProvider>`

Provider component for FeedValue context.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `widgetId` | `string` | Yes | - | Widget ID from FeedValue dashboard |
| `apiBaseUrl` | `string` | No | Production URL | Custom API URL (for self-hosted) |
| `config` | `Partial<FeedValueConfig>` | No | - | Configuration overrides |
| `headless` | `boolean` | No | `false` | Disable all DOM rendering |
| `onReady` | `() => void` | No | - | Called when widget is ready |
| `onOpen` | `() => void` | No | - | Called when modal opens |
| `onClose` | `() => void` | No | - | Called when modal closes |
| `onSubmit` | `(feedback: FeedbackData) => void` | No | - | Called when feedback is submitted |
| `onError` | `(error: Error) => void` | No | - | Called on errors |

### `useFeedValue()`

Hook to access FeedValue context. Must be used within `<FeedValueProvider>`.

Returns:

| Property | Type | Description |
|----------|------|-------------|
| `instance` | `FeedValue \| null` | Raw FeedValue instance (advanced usage) |
| `isReady` | `boolean` | Widget is initialized |
| `isOpen` | `boolean` | Modal is open |
| `isVisible` | `boolean` | Trigger button is visible |
| `error` | `Error \| null` | Current error |
| `isSubmitting` | `boolean` | Submission in progress |
| `isHeadless` | `boolean` | Running in headless mode |
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

## Default vs Headless Mode

| Feature | Default Mode | Headless Mode |
|---------|--------------|---------------|
| Trigger button | Dashboard-styled | You build it |
| Modal | Dashboard-styled | You build it |
| API methods | Available | Available |
| User tracking | Available | Available |
| Dashboard config | Fetched | Fetched |

Use `headless={true}` when you want complete control over the UI.

## Requirements

- React 18.0.0 or higher
- React DOM 18.0.0 or higher

## License

MIT
