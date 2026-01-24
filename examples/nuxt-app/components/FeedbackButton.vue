<script setup lang="ts">
import { useFeedValue } from '@feedvalue/vue';

const { open, isReady, isOpen } = useFeedValue();
</script>

<template>
  <button class="button" :disabled="!isReady" @click="open">
    {{ !isReady ? 'Loading...' : isOpen ? 'Close Feedback' : 'Give Feedback' }}
  </button>
</template>

<style scoped>
.button {
  background: linear-gradient(135deg, #42d392 0%, #3eaf7c 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 211, 146, 0.4);
}

.button:active:not(:disabled) {
  transform: translateY(0);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
