// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-12-01',
  devtools: { enabled: true },
  typescript: {
    strict: true,
  },
  app: {
    head: {
      title: 'FeedValue Nuxt Example',
      meta: [
        { name: 'description', content: 'Example Nuxt app using @feedvalue/vue' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // API base URL for FeedValue backend
      // Set via NUXT_PUBLIC_FEEDVALUE_API_URL environment variable
      // Default: undefined (uses SDK default: https://api.feedvalue.com)
      feedvalueApiUrl: '',
    },
  },
});
