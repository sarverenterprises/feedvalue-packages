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

### Headless Mode

For complete UI control, use headless mode. The SDK fetches config and provides all API methods but renders no DOM elements:

```typescript
// main.ts
app.use(createFeedValue({
  widgetId: 'your-widget-id',
  headless: true, // No trigger button or modal rendered
}));
```

```vue
<script setup>
import { ref } from 'vue';
import { useFeedValue } from '@feedvalue/vue';

const { isReady, isOpen, open, close, submit, isSubmitting, isHeadless } = useFeedValue();
const message = ref('');

async function handleSubmit() {
  await submit({ message: message.value });
  message.value = '';
  close();
}
</script>

<template>
  <button @click="open" :disabled="!isReady">
    Feedback
  </button>

  <div v-if="isOpen" class="my-modal">
    <textarea v-model="message" placeholder="Your feedback..." />
    <button @click="handleSubmit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Sending...' : 'Submit' }}
    </button>
    <button @click="close">Cancel</button>
  </div>
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

### Custom Fields

Custom fields allow you to collect structured data beyond the main feedback message. **Custom fields must be defined in your widget configuration on the FeedValue dashboard before use.**

1. Go to your widget settings in the FeedValue dashboard
2. Add custom fields with types: `text`, `email`, or `emoji`
3. Use `customFieldValues` when submitting:

```vue
<script setup>
import { ref } from 'vue';
import { useFeedValue } from '@feedvalue/vue';

const { submit, isReady } = useFeedValue();
const name = ref('');
const category = ref('feature');

async function handleSubmit() {
  await submit({
    message: 'Detailed feedback',
    customFieldValues: {
      // Field IDs must match those defined in your widget configuration
      name: name.value,
      category: category.value,
    },
  });
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="name" placeholder="Your name" />
    <select v-model="category">
      <option value="bug">Bug Report</option>
      <option value="feature">Feature Request</option>
    </select>
    <button type="submit" :disabled="!isReady">Submit</button>
  </form>
</template>
```

> **Important**: The field IDs in `customFieldValues` must match the field IDs defined in your widget configuration on the dashboard.

### User Identification

Attach user context to feedback submissions. This data is **not shown in the widget UI** but is stored with the submission and visible in your FeedValue dashboard:

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

> **User Data vs Custom Fields**
> - **User data** (`identify`/`setData`): Hidden from users, automatically attached to submissions. Use for internal context like user IDs, subscription plans, etc.
> - **Custom fields** (`customFieldValues`): Shown as form inputs in the widget. Users fill these in themselves. Must be defined in widget configuration first.

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

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `widgetId` | `string` | Yes | - | Widget ID from FeedValue dashboard |
| `apiBaseUrl` | `string` | No | Production URL | Custom API URL (for self-hosted) |
| `config` | `Partial<FeedValueConfig>` | No | - | Configuration overrides |
| `headless` | `boolean` | No | `false` | Disable all DOM rendering |

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
| `isHeadless` | `Readonly<Ref<boolean>>` | Running in headless mode |
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

## Nuxt Integration

Works with Nuxt 3 and Nuxt 4. Create a plugin file:

```typescript
// plugins/feedvalue.client.ts
import { createFeedValue } from '@feedvalue/vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createFeedValue({
    widgetId: 'your-widget-id',
  }));
});
```

For headless mode in Nuxt:

```typescript
// plugins/feedvalue.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createFeedValue({
    widgetId: 'your-widget-id',
    headless: true, // Build your own UI
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

## Default vs Headless Mode

| Feature | Default Mode | Headless Mode |
|---------|--------------|---------------|
| Trigger button | Dashboard-styled | You build it |
| Modal | Dashboard-styled | You build it |
| API methods | Available | Available |
| User tracking | Available | Available |
| Dashboard config | Fetched | Fetched |

Use `headless: true` when you want complete control over the UI.

## Requirements

- Vue 3.3.0 or higher

## License

MIT
