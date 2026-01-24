<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFeedValue } from '@feedvalue/vue';

const {
  isReady,
  submit,
  isSubmitting,
  identify,
  setData,
  error,
} = useFeedValue();

const message = ref('');
const showModal = ref(false);
const submitted = ref(false);

// Simulate user identification on mount
onMounted(() => {
  if (isReady.value) {
    identify('demo-user-123', {
      name: 'Demo User',
      email: 'demo@example.com',
      plan: 'pro',
    });
    setData({ source: 'nuxt-example' });
  }
});

function handleOpen() {
  showModal.value = true;
}

function handleClose() {
  showModal.value = false;
  message.value = '';
}

async function handleSubmit() {
  if (!message.value.trim()) return;

  try {
    await submit({ message: message.value.trim() });
    submitted.value = true;
    setTimeout(() => {
      handleClose();
      submitted.value = false;
    }, 2000);
  } catch (err) {
    console.error('Submission failed:', err);
  }
}
</script>

<template>
  <div class="container">
    <div v-if="!isReady" class="loading">Loading headless demo...</div>
    <template v-else>
      <button class="trigger" @click="handleOpen">
        Open Custom Feedback Modal
      </button>

      <Teleport to="body">
        <div v-if="showModal" class="overlay" @click="handleClose">
          <div class="modal" @click.stop>
            <div v-if="submitted" class="success">
              <span class="checkmark">✓</span>
              <p>Thank you for your feedback!</p>
            </div>
            <template v-else>
              <h3 class="modal-title">Custom Feedback Form</h3>
              <p class="modal-description">
                This is a completely custom UI using headless mode.
              </p>
              <form @submit.prevent="handleSubmit">
                <textarea
                  v-model="message"
                  class="textarea"
                  placeholder="What's on your mind?"
                  rows="4"
                  :disabled="isSubmitting"
                />
                <p v-if="error" class="error">{{ error.message }}</p>
                <div class="actions">
                  <button
                    type="button"
                    class="cancel-button"
                    :disabled="isSubmitting"
                    @click="handleClose"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="submit-button"
                    :disabled="isSubmitting || !message.trim()"
                  >
                    {{ isSubmitting ? 'Sending...' : 'Submit' }}
                  </button>
                </div>
              </form>
            </template>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
.container {
  margin-top: 1rem;
}

.loading {
  color: #666;
  font-style: italic;
}

.trigger {
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.trigger:hover {
  background: #333;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-title {
  font-size: 1.5rem;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.modal-description {
  color: #666;
  margin-bottom: 1.5rem;
}

.textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.textarea:focus {
  outline: none;
  border-color: #42d392;
}

.textarea:disabled {
  background: #f5f5f5;
}

.error {
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.cancel-button {
  padding: 0.6rem 1.25rem;
  border: 2px solid #e5e7eb;
  background: white;
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.cancel-button:hover:not(:disabled) {
  border-color: #ccc;
  color: #333;
}

.cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-button {
  padding: 0.6rem 1.25rem;
  border: none;
  background: linear-gradient(135deg, #42d392 0%, #3eaf7c 100%);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 211, 146, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.success {
  text-align: center;
  padding: 2rem;
}

.checkmark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #42d392 0%, #3eaf7c 100%);
  color: white;
  font-size: 2rem;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.success p {
  font-size: 1.25rem;
  color: #1a1a1a;
  font-weight: 500;
}
</style>
