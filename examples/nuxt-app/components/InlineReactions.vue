<script setup lang="ts">
import { ReactionButtons } from '@feedvalue/vue';

const handleReact = (value: string, followUp?: string) => {
  console.log('[FeedValue Reaction] Reacted:', value, followUp);
};
</script>

<template>
  <ClientOnly>
    <ReactionButtons
      widget-id="fb06a5f9-52bc-4a49-90fe-deccef8503bd"
      @react="handleReact"
    />
  </ClientOnly>
</template>
