# @feedvalue/vue

Vue SDK for FeedValue feedback widget. Provides Plugin and Composables for Vue 3+.

## Installation

```bash
npm install @feedvalue/vue
# or
pnpm add @feedvalue/vue
# or
yarn add @feedvalue/vue
```

## Usage

### Setup with Plugin

```typescript
// main.ts
import { createApp } from 'vue';
import { createFeedValue } from '@feedvalue/vue';
import App from './App.vue';

const app = createApp(App);

app.use(createFeedValue({
  widgetId: 'your-widget-id',
  config: {
    theme: 'auto',
  },
}));

app.mount('#app');
```

### Using the Composable

```vue
<script setup>
import { useFeedValue } from '@feedvalue/vue';

const { open, isReady, isOpen } = useFeedValue();
</script>

<template>
  <button @click="open" :disabled="!isReady">
    {{ isOpen ? 'Close' : 'Give Feedback' }}
  </button>
</template>
```

### Standalone Usage (No Plugin)

```vue
<script setup>
import { useFeedValue } from '@feedvalue/vue';

// Pass widgetId directly when not using plugin
const { open, isReady } = useFeedValue('your-widget-id');
</script>

<template>
  <button @click="open" :disabled="!isReady">
    Feedback
  </button>
</template>
```

### Programmatic Submission

```vue
<script setup>
import { ref } from 'vue';
import { useFeedValue } from '@feedvalue/vue';

const { submit, isSubmitting, error } = useFeedValue();
const message = ref('');

async function handleSubmit() {
  try {
    await submit({ message: message.value });
    message.value = '';
    console.log('Feedback submitted!');
  } catch (err) {
    console.error('Failed:', err);
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <textarea v-model="message" placeholder="Your feedback..." />
    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Submitting...' : 'Submit' }}
    </button>
    <p v-if="error" class="error">{{ error.message }}</p>
  </form>
</template>
```

### User Identification

```vue
<script setup>
import { watch } from 'vue';
import { useFeedValue } from '@feedvalue/vue';

const props = defineProps<{ user: User | null }>();
const { identify, setData, reset } = useFeedValue();

watch(() => props.user, (user) => {
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
}, { immediate: true });
</script>
```

### Options API Support

```vue
<script>
export default {
  methods: {
    openFeedback() {
      // Access via global property
      this.$feedvalue?.open();
    },
  },
};
</script>

<template>
  <button @click="openFeedback">Feedback</button>
</template>
```

## API Reference

### `createFeedValue(options)`

Creates a Vue plugin for FeedValue.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `widgetId` | `string` | Yes | Widget ID from FeedValue dashboard |
| `apiBaseUrl` | `string` | No | Custom API URL (for self-hosted) |
| `config` | `Partial<FeedValueConfig>` | No | Configuration overrides |

### `useFeedValue(widgetId?, config?)`

Composable to access FeedValue functionality.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `widgetId` | `string` | Optional widget ID (not needed if plugin is installed) |
| `config` | `Partial<FeedValueConfig>` | Optional config overrides |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `instance` | `Readonly<ShallowRef<FeedValueInstance \| null>>` | Raw instance |
| `isReady` | `Readonly<Ref<boolean>>` | Widget initialized |
| `isOpen` | `Readonly<Ref<boolean>>` | Modal is open |
| `isVisible` | `Readonly<Ref<boolean>>` | Trigger is visible |
| `error` | `Readonly<Ref<Error \| null>>` | Current error |
| `isSubmitting` | `Readonly<Ref<boolean>>` | Submission in progress |
| `open` | `() => void` | Open modal |
| `close` | `() => void` | Close modal |
| `toggle` | `() => void` | Toggle modal |
| `show` | `() => void` | Show trigger |
| `hide` | `() => void` | Hide trigger |
| `submit` | `(feedback) => Promise<void>` | Submit feedback |
| `identify` | `(userId, traits?) => void` | Identify user |
| `setData` | `(data) => void` | Set user data |
| `reset` | `() => void` | Reset user data |

### Injection Keys

For advanced usage with `inject()`:

```typescript
import { inject } from 'vue';
import { FEEDVALUE_KEY, FEEDVALUE_OPTIONS_KEY } from '@feedvalue/vue';

// Get raw FeedValue instance
const instance = inject(FEEDVALUE_KEY);

// Get plugin options
const options = inject(FEEDVALUE_OPTIONS_KEY);
```

## Nuxt 3 Integration

Create a plugin file:

```typescript
// plugins/feedvalue.client.ts
import { createFeedValue } from '@feedvalue/vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createFeedValue({
    widgetId: 'your-widget-id',
  }));
});
```

The `.client.ts` suffix ensures the plugin only runs on the client side.

## SSR Support

The SDK handles SSR automatically:
- Plugin only initializes on client side
- Composable returns safe defaults during SSR
- No hydration mismatches

```vue
<script setup>
import { useFeedValue } from '@feedvalue/vue';

const { isReady } = useFeedValue();
// isReady.value is false during SSR
</script>

<template>
  <!-- Safe to use in SSR context -->
  <button :disabled="!isReady">Feedback</button>
</template>
```

## Requirements

- Vue 3.3.0 or higher

## License

MIT
