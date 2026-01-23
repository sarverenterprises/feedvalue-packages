# FeedValue SDK Packages

Official SDK packages for integrating FeedValue feedback widgets into your applications.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@feedvalue/core](./packages/core) | [![npm](https://img.shields.io/npm/v/@feedvalue/core)](https://www.npmjs.com/package/@feedvalue/core) | Core functionality and vanilla JS integration |
| [@feedvalue/react](./packages/react) | [![npm](https://img.shields.io/npm/v/@feedvalue/react)](https://www.npmjs.com/package/@feedvalue/react) | React hooks and components |
| [@feedvalue/vue](./packages/vue) | [![npm](https://img.shields.io/npm/v/@feedvalue/vue)](https://www.npmjs.com/package/@feedvalue/vue) | Vue composables and plugin |

## Quick Start

### React

```bash
npm install @feedvalue/react
```

```tsx
import { FeedValueProvider, useFeedValue } from '@feedvalue/react';

function App() {
  return (
    <FeedValueProvider widgetId="your-widget-id">
      <FeedbackButton />
    </FeedValueProvider>
  );
}

function FeedbackButton() {
  const { open, isReady } = useFeedValue();
  return <button onClick={open} disabled={!isReady}>Give Feedback</button>;
}
```

### Vue

```bash
npm install @feedvalue/vue
```

```typescript
// main.ts - Install the plugin
import { createFeedValue } from '@feedvalue/vue';

app.use(createFeedValue({ widgetId: 'your-widget-id' }));
```

```vue
<script setup>
import { useFeedValue } from '@feedvalue/vue';

const { open, isReady } = useFeedValue();
</script>

<template>
  <button @click="open" :disabled="!isReady">Give Feedback</button>
</template>
```

### Vanilla JavaScript

```bash
npm install @feedvalue/core
```

```javascript
import { FeedValue } from '@feedvalue/core';

// Initialize (auto-inits and renders)
const feedvalue = FeedValue.init({ widgetId: 'your-widget-id' });

// Open programmatically
document.getElementById('feedback-btn').addEventListener('click', () => {
  feedvalue.open();
});
```

## Examples

- [Next.js Example](./examples/nextjs)
- [Nuxt Example](./examples/nuxt)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Create a changeset
pnpm changeset
```

## License

MIT
