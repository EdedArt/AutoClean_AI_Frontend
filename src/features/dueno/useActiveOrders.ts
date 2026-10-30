import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import { ApiError } from '@/api/client';
import { getActiveOrders, type OrderListResponse, type ServiceOrder } from '@/api/orders';
import { useAuth } from '@/features/auth';

export const ACTIVE_ORDERS_QUERY_KEY = ['owner-active-orders'] as const;

export interface UseActiveOrdersOptions {
  pausePolling?: boolean;
}

export function useActiveOrders(options?: UseActiveOrdersOptions) {
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
  const isAppActive = appState === 'active';
  const isScreenActive = isScreenFocused && isAppActive;
  const pausePolling = Boolean(options?.pausePolling);

  const query = useQuery<OrderListResponse, Error>({
    queryKey: ACTIVE_ORDERS_QUERY_KEY,
    queryFn: () => getActiveOrders(),
    enabled: isOperator,
    refetchInterval: (q) => {
      if (!isScreenActive || pausePolling) {
        return false;
      }

      const err = q.state.error;
      if (err instanceof ApiError) {
        if (err.status === 429 || err.code === 'RATE_LIMITED') {
          return 30000;
        }
      }

      return 9000;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const error = query.error;
  const apiError = error instanceof ApiError ? error : null;
  const isRateLimited = apiError?.status === 429 || apiError?.code === 'RATE_LIMITED';
  const isNetworkError = apiError?.code === 'NETWORK_ERROR';

  const orders: ServiceOrder[] = query.data?.data ?? [];

  return {
    ...query,
    orders,
    meta: query.data?.meta,
    apiError,
    isRateLimited,
    isNetworkError,
    isScreenActive,
  };
}
