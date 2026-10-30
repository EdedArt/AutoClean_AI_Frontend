import { z } from 'zod';

import { apiClient } from './client';
import { getToken } from '@/lib/session';

export const baySchema = z.object({
  id: z.number().int(),
  numero: z.number().int(),
  ocupada: z.boolean(),
});

export const bayListSchema = z.array(baySchema);

export const baySummarySchema = z.object({
  total: z.number().int(),
  occupied: z.number().int(),
  free: z.number().int(),
});

export type Bay = z.infer<typeof baySchema>;
export type BaySummary = z.infer<typeof baySummarySchema>;

export async function getBays(): Promise<Bay[]> {
  const token = await getToken();
  const raw = await apiClient.get<unknown>('/api/bays', {
    token: token ?? undefined,
  });

  return bayListSchema.parse(raw);
}

export async function getBaySummary(): Promise<BaySummary> {
  const token = await getToken();
  const raw = await apiClient.get<unknown>('/api/bays/summary', {
    token: token ?? undefined,
  });

  return baySummarySchema.parse(raw);
}
