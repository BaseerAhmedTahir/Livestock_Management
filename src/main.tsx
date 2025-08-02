import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import App from './App.tsx';
import './index.css';

// Create a persister for localStorage
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'LIVESTOCK_PRO_CACHE',
  serialize: JSON.stringify,
  deserialize: (value: string) => {
    return JSON.parse(value, (key, val) => {
      // Check if the value is a string that looks like an ISO date
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(val)) {
        return new Date(val);
      }
      return val;
    });
  },
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes (increased for better caching)
      gcTime: 24 * 60 * 60 * 1000, // 24 hours (keep data longer)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Persist the query client
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  hydrateOptions: {
    // Only restore successful queries
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000,
      },
    },
  },
  dehydrateOptions: {
    // Don't persist error states or loading states
    shouldDehydrateQuery: (query) => {
      return query.state.status === 'success';
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
