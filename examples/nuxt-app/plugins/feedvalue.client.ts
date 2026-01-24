import { createFeedValue } from '@feedvalue/vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(
    createFeedValue({
      widgetId: 'demo-widget-id',
      config: {
        theme: 'auto',
      },
    })
  );
});
