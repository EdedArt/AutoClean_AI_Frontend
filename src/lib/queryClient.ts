import { AppState, type AppStateStatus, Platform } from 'react-native';
import { focusManager, QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (
            error.status === 400 ||
            error.status === 404 ||
            error.status === 429 ||
            error.code === 'VALIDATION_ERROR' ||
            error.code === 'NOT_FOUND' ||
            error.code === 'RATE_LIMITED'
          ) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
  },
});

AppState.addEventListener('change', (status: AppStateStatus) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
});
