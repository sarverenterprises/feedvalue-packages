'use client';

import { FeedValueProvider } from '@feedvalue/react';

// API base URL for FeedValue backend
// For local development: http://localhost:3001
// For production: https://api.feedvalue.com (default)
const API_BASE_URL = process.env.NEXT_PUBLIC_FEEDVALUE_API_URL;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeedValueProvider
      widgetId="e2462c5d-5698-4c0b-ba0f-fc7013dca22c"
      apiBaseUrl={API_BASE_URL}
      config={{ debug: true }}
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
