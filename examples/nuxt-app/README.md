# Nuxt FeedValue Example

This example demonstrates how to integrate `@feedvalue/vue` with a Nuxt 3 application.

## Features

- **createFeedValue** plugin setup in Nuxt
- **useFeedValue** composable for modal control
- **Headless mode** with completely custom UI
- **User identification** with `identify()` and `setData()`
- **SSR-safe** implementation with `.client.ts` plugin

## Getting Started

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Configure the API URL (optional):

```bash
# Copy the example environment file
cp .env.example .env

# For local development with core-api:
echo "NUXT_PUBLIC_FEEDVALUE_API_URL=http://localhost:3001" >> .env
```

3. Generate types for IDE support (optional):

```bash
pnpm types
```

4. Run the development server:

```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NUXT_PUBLIC_FEEDVALUE_API_URL` | FeedValue API base URL | `https://api.feedvalue.com` |

## Key Files

- `plugins/feedvalue.client.ts` - FeedValue plugin (client-side only)
- `components/FeedbackButton.vue` - Simple button using useFeedValue composable
- `components/HeadlessDemo.vue` - Custom UI using headless mode
- `pages/index.vue` - Main page demonstrating all features

## Code Highlights

### Plugin Setup (Nuxt 3)

```typescript
// plugins/feedvalue.client.ts
import { createFeedValue } from '@feedvalue/vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(
    createFeedValue({
      widgetId: 'your-widget-id',
      config: {
        theme: 'auto',
      },
    })
  );
});
```

The `.client.ts` suffix ensures the plugin only runs on the client side.

### Using the Composable

```vue
<script setup lang="ts">
import { useFeedValue } from '@feedvalue/vue';

const { open, isReady, isOpen } = useFeedValue();
</script>

<template>
  <button @click="open" :disabled="!isReady">
    {{ isOpen ? 'Close' : 'Feedback' }}
  </button>
</template>
```

### Headless Mode

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useFeedValue } from '@feedvalue/vue';

const { submit, isSubmitting, identify, setData } = useFeedValue();
const message = ref('');

// Identify user
identify('user-123', { name: 'John', email: 'john@example.com' });

// Set additional data
setData({ plan: 'pro', source: 'web' });

// Submit feedback programmatically
async function handleSubmit() {
  await submit({ message: message.value });
  message.value = '';
}
</script>
```

## Learn More

- [FeedValue Vue Documentation](https://docs.feedvalue.com/vue)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
