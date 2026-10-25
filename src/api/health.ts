import { apiClient } from '@/api/client';

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

export async function getHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/api/health');
}
