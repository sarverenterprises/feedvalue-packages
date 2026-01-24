'use client';

import { FeedValueProvider } from '@feedvalue/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedValueProvider
      widgetId="demo-widget-id"
      onReady={() => console.log('[FeedValue] Widget ready')}
      onOpen={() => console.log('[FeedValue] Modal opened')}
      onClose={() => console.log('[FeedValue] Modal closed')}
      onSubmit={(feedback) => console.log('[FeedValue] Submitted:', feedback)}
      onError={(error) => console.error('[FeedValue] Error:', error)}
    >
      {children}
    </FeedValueProvider>
  );
}
