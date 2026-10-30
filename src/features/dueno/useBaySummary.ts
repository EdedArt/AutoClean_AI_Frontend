import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import { getBaySummary, type BaySummary } from '@/api/bays';
import { ApiError } from '@/api/client';
import { useAuth } from '@/features/auth';

export const BAY_SUMMARY_QUERY_KEY = ['owner-bay-summary'] as const;

export function useBaySummary() {
  const { user } = useAuth();
  const isScreenFocused = useIsFocused();
  const [appState, setAppState] = useState<AppStateStatus>(
    () => (AppState.currentState as AppStateStatus) || 'active',
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isOperator = user?.role === 'OPERARIO';
  const isScreenActive = isScreenFocused && appState === 'active';

  return useQuery<BaySummary, Error>({
    queryKey: BAY_SUMMARY_QUERY_KEY,
    queryFn: () => getBaySummary(),
    enabled: isOperator,
    refetchInterval: (q) => {
      if (!isScreenActive) {
        return false;
      }
      const err = q.state.error;
      if (err instanceof ApiError && (err.status === 429 || err.code === 'RATE_LIMITED')) {
        return 30000;
      }
      return 9000;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
