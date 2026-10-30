import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

import { ApiError } from '@/api/client';
import { getMyPlates, type SearchedPlateEntry } from '@/api/plates';
import { useAuth } from '@/features/auth';

export const MY_PLATES_QUERY_KEY = ['my-plates'] as const;

export function useMyPlates() {
  const { user } = useAuth();
  const isScreenFocused = useIsFocused();
  const wasFocusedRef = useRef(isScreenFocused);

  const isClient = user?.role === 'CLIENTE';

  const query = useQuery<SearchedPlateEntry[], Error>({
    queryKey: MY_PLATES_QUERY_KEY,
    queryFn: () => getMyPlates(),
    enabled: isClient,
    staleTime: 60000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const error = query.error;
  const apiError = error instanceof ApiError ? error : null;
  const isRateLimited = apiError?.status === 429 || apiError?.code === 'RATE_LIMITED';
  const isNetworkError = apiError?.code === 'NETWORK_ERROR';

  useEffect(() => {
    if (isScreenFocused && !wasFocusedRef.current && isClient && !isRateLimited) {
      void query.refetch();
    }
    wasFocusedRef.current = isScreenFocused;
  }, [isScreenFocused, isClient, isRateLimited, query]);

  return {
    ...query,
    apiError,
    isRateLimited,
    isNetworkError,
  };
}
