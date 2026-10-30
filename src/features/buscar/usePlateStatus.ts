import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import { MY_PLATES_QUERY_KEY } from './useMyPlates';
import { ApiError } from '@/api/client';
import { getPlateStatus, type PlateStatus } from '@/api/plates';
import { useAuth } from '@/features/auth';
import { isValidPlate } from '@/lib/plate';

export const PLATE_STATUS_QUERY_KEY = 'plate-status';

export function usePlateStatus(placa: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isScreenFocused = useIsFocused();
  const lastInvalidatedRef = useRef<string | null>(null);
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

  const isAppActive = appState === 'active';
  const isScreenActive = isScreenFocused && isAppActive;
  const isPlateValid = isValidPlate(placa);

  const query = useQuery<PlateStatus, Error>({
    queryKey: [PLATE_STATUS_QUERY_KEY, placa],
    queryFn: () => getPlateStatus(placa),
    enabled: isPlateValid,
    refetchInterval: (q) => {
      // Pause polling when app is in background or screen is not focused
      if (!isScreenActive) {
        return false;
      }

      const err = q.state.error;
      if (err instanceof ApiError) {
        // Stop polling completely after 404
        if (err.status === 404 || err.code === 'NOT_FOUND') {
          return false;
        }

        // Back off to 30s after 429 rate limit
        if (err.status === 429 || err.code === 'RATE_LIMITED') {
          return 30000;
        }
      }

      // Normal polling interval ~9000ms
      return 9000;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const error = query.error;
  const apiError = error instanceof ApiError ? error : null;

  const isNotFound = apiError?.status === 404 || apiError?.code === 'NOT_FOUND';
  const isRateLimited = apiError?.status === 429 || apiError?.code === 'RATE_LIMITED';
  const isNetworkError = apiError?.code === 'NETWORK_ERROR';

  useEffect(() => {
    if (!isPlateValid) {
      lastInvalidatedRef.current = null;
      return;
    }

    if (
      user?.role === 'CLIENTE' &&
      query.isSuccess &&
      query.data &&
      !query.isError &&
      query.fetchStatus === 'idle'
    ) {
      const key = `${placa}:${query.dataUpdatedAt}`;
      if (lastInvalidatedRef.current !== key) {
        lastInvalidatedRef.current = key;
        void queryClient.invalidateQueries({ queryKey: MY_PLATES_QUERY_KEY });
      }
    }
  }, [
    isPlateValid,
    placa,
    user?.role,
    query.isSuccess,
    query.data,
    query.isError,
    query.fetchStatus,
    query.dataUpdatedAt,
    queryClient,
  ]);

  return {
    ...query,
    apiError,
    isNotFound,
    isRateLimited,
    isNetworkError,
    isScreenActive,
  };
}
