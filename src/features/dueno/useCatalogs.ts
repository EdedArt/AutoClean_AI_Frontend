import { useQuery } from '@tanstack/react-query';

import { getAiStatus, type AiStatus } from '@/api/ai';
import { getBays, type Bay } from '@/api/bays';
import { getPackages, type WashPackage } from '@/api/packages';
import { useAuth } from '@/features/auth';

export const BAYS_QUERY_KEY = ['owner-bays'] as const;
export const PACKAGES_QUERY_KEY = ['owner-packages'] as const;
export const AI_STATUS_QUERY_KEY = ['owner-ai-status'] as const;

export function useBays() {
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERARIO';

  return useQuery<Bay[], Error>({
    queryKey: BAYS_QUERY_KEY,
    queryFn: () => getBays(),
    enabled: isOperator,
  });
}

export function usePackages() {
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERARIO';

  return useQuery<WashPackage[], Error>({
    queryKey: PACKAGES_QUERY_KEY,
    queryFn: () => getPackages(),
    enabled: isOperator,
  });
}

export function useAiStatus() {
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERARIO';

  return useQuery<AiStatus, Error>({
    queryKey: AI_STATUS_QUERY_KEY,
    queryFn: () => getAiStatus(),
    enabled: isOperator,
    staleTime: 30000,
  });
}
