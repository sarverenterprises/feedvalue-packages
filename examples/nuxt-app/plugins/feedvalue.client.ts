import { createFeedValue } from '@feedvalue/vue';

export default defineNuxtPlugin((nuxtApp) => {
  // API base URL can be overridden via NUXT_PUBLIC_FEEDVALUE_API_URL env var
  // Default: https://api.feedvalue.com (set in @feedvalue/core)
  const runtimeConfig = useRuntimeConfig();
  const apiBaseUrl = runtimeConfig.public.feedvalueApiUrl as string | undefined;

  nuxtApp.vueApp.use(
    createFeedValue({
      widgetId: '267c0c5d-4730-4e81-97dc-d3540fceb2e4',
      // Only pass apiBaseUrl if explicitly set (non-empty), otherwise use SDK default
      ...(apiBaseUrl ? { apiBaseUrl } : {}),
      config: {
        theme: 'auto',
        debug: true,
      },
    })
  );
});
