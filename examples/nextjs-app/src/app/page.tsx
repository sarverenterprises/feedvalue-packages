'use client';
import { FeedbackButton } from '@/components/feedback-button';
import { HeadlessDemo } from '@/components/headless-demo';
import styles from './page.module.css';
import { FeedValueProvider, ReactionButtons } from '@feedvalue/react';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>FeedValue React Example</h1>
        <p className={styles.description}>
          This example demonstrates how to use <code>@feedvalue/react</code> with Next.js App Router.
        </p>

        <section className={styles.section}>
          <h2>Default Mode</h2>
          <p>
            The widget is initialized via <code>FeedValueProvider</code> in the layout.
            Click the button below to open the feedback modal.
          </p>
          <FeedbackButton />
        </section>

        <section className={styles.section}>
          <h2>Inline Reactions</h2>
          <p>
            Use <code>ReactionButtons</code> for inline feedback like "Was this helpful?".
            Each reaction widget needs its own <code>FeedValueProvider</code> with a reaction-type widget ID.
          </p>
          <FeedValueProvider
            widgetId="442399c8-10e6-4207-a160-0566229ad173"
            apiBaseUrl={process.env.NEXT_PUBLIC_FEEDVALUE_API_URL}
            config={{ debug: true }}
            headless
            onReady={() => console.log('[FeedValue Reaction] Widget ready')}
            onError={(error) => console.error('[FeedValue Reaction] Error:', error)}
          >
            <ReactionButtons
              onReact={(value) => console.log('[FeedValue Reaction] Reacted:', value)}
              onError={(error) => console.error('[FeedValue Reaction] Submit error:', error)}
            />
          </FeedValueProvider>
        </section>

        <section className={styles.section}>
          <h2>Headless Mode</h2>
          <p>
            For complete UI control, use headless mode. The SDK provides all API methods
            but renders no DOM elements — you build your own UI.
          </p>
          <HeadlessDemo />
        </section>

        <section className={styles.section}>
          <h2>Features Demonstrated</h2>
          <ul className={styles.list}>
            <li>FeedValueProvider setup in App Router layout</li>
            <li>useFeedValue hook for modal control</li>
            <li>Inline ReactionButtons for quick feedback</li>
            <li>Headless mode with custom UI</li>
            <li>User identification with identify()</li>
            <li>Programmatic submission with submit()</li>
            <li>SSR-safe implementation</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
