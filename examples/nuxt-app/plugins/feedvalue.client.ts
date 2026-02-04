import { createFeedValue } from '@feedvalue/vue';

export default defineNuxtPlugin((nuxtApp) => {
  // API base URL can be overridden via NUXT_PUBLIC_FEEDVALUE_API_URL env var
  // Default: https://api.feedvalue.com (set in @feedvalue/core)
  const runtimeConfig = useRuntimeConfig();
  const apiBaseUrl = runtimeConfig.public.feedvalueApiUrl as string | undefined;

  console.log('[FeedValue Plugin] runtimeConfig.public:', runtimeConfig.public);
  console.log('[FeedValue Plugin] apiBaseUrl:', apiBaseUrl, '| truthy:', !!apiBaseUrl);

  nuxtApp.vueApp.use(
    createFeedValue({
      widgetId: 'e2462c5d-5698-4c0b-ba0f-fc7013dca22c',
      // Only pass apiBaseUrl if explicitly set (non-empty), otherwise use SDK default
      ...(apiBaseUrl ? { apiBaseUrl } : {}),
      config: {
        theme: 'auto',
        debug: true,
      },
    })
  );
});
