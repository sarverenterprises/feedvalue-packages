import { FeedbackButton } from '@/components/feedback-button';
import { HeadlessDemo } from '@/components/headless-demo';
import styles from './page.module.css';

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
