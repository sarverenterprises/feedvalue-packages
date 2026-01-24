'use client';

import { FeedValueProvider } from '@feedvalue/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedValueProvider
      widgetId="267c0c5d-4730-4e81-97dc-d3540fceb2e4"
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
