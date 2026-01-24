import { createFeedValue } from '@feedvalue/vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(
    createFeedValue({
      widgetId: '267c0c5d-4730-4e81-97dc-d3540fceb2e4',
      config: {
        theme: 'auto',
      },
    })
  );
});
