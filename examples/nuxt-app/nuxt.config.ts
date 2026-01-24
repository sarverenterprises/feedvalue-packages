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
});
