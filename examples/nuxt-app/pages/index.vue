<script setup lang="ts">
import FeedbackButton from '~/components/FeedbackButton.vue';
import HeadlessDemo from '~/components/HeadlessDemo.vue';
</script>

<template>
  <main class="main">
    <div class="container">
      <h1 class="title">FeedValue Vue Example</h1>
      <p class="description">
        This example demonstrates how to use <code>@feedvalue/vue</code> with Nuxt 3.
      </p>

      <section class="section">
        <h2>Default Mode</h2>
        <p>
          The widget is initialized via the FeedValue plugin.
          Click the button below to open the feedback modal.
        </p>
        <FeedbackButton />
      </section>

      <section class="section">
        <h2>Headless Mode</h2>
        <p>
          For complete UI control, use headless mode. The SDK provides all API methods
          but renders no DOM elements — you build your own UI.
        </p>
        <HeadlessDemo />
      </section>

      <section class="section">
        <h2>Features Demonstrated</h2>
        <ul class="list">
          <li>createFeedValue plugin setup in Nuxt</li>
          <li>useFeedValue composable for modal control</li>
          <li>Headless mode with custom UI</li>
          <li>User identification with identify()</li>
          <li>Programmatic submission with submit()</li>
          <li>SSR-safe implementation (.client.ts plugin)</li>
        </ul>
      </section>
    </div>
  </main>
</template>

<style scoped>
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
}

.container {
  max-width: 800px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.description {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.description code {
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Fira Code', 'Monaco', monospace;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.section h2 {
  font-size: 1.5rem;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.section p {
  color: #555;
  margin-bottom: 1rem;
}

.section code {
  background: #e9ecef;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.9em;
}

.list {
  list-style: none;
  padding: 0;
}

.list li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #444;
}

.list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #42d392;
  font-weight: bold;
}
</style>
