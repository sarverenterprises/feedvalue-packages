# Next.js FeedValue Example

This example demonstrates how to integrate `@feedvalue/react` with a Next.js 15 App Router application.

## Features

- **FeedValueProvider** setup in App Router layout
- **useFeedValue** hook for modal control
- **Headless mode** with completely custom UI
- **User identification** with `identify()` and `setData()`
- **SSR-safe** implementation

## Getting Started

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Files

- `src/components/providers.tsx` - FeedValueProvider setup as a client component
- `src/components/feedback-button.tsx` - Simple button using useFeedValue hook
- `src/components/headless-demo.tsx` - Custom UI using headless mode
- `src/app/layout.tsx` - Root layout wrapping children with providers

## Code Highlights

### Provider Setup (App Router)

```tsx
// src/components/providers.tsx
'use client';

import { FeedValueProvider } from '@feedvalue/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedValueProvider
      widgetId="your-widget-id"
      onReady={() => console.log('Ready!')}
    >
      {children}
    </FeedValueProvider>
  );
}
```

### Using the Hook

```tsx
// src/components/feedback-button.tsx
'use client';

import { useFeedValue } from '@feedvalue/react';

export function FeedbackButton() {
  const { open, isReady, isOpen } = useFeedValue();

  return (
    <button onClick={open} disabled={!isReady}>
      {isOpen ? 'Close' : 'Feedback'}
    </button>
  );
}
```

### Headless Mode

```tsx
const { submit, isSubmitting, identify, setData } = useFeedValue();

// Identify user
identify('user-123', { name: 'John', email: 'john@example.com' });

// Set additional data
setData({ plan: 'pro', source: 'web' });

// Submit feedback programmatically
await submit({ message: 'Great product!' });
```

## Learn More

- [FeedValue React Documentation](https://docs.feedvalue.com/react)
- [Next.js App Router](https://nextjs.org/docs/app)
