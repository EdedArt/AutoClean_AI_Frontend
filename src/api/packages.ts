import { z } from 'zod';

import { apiClient } from './client';
import { getToken } from '@/lib/session';

export const washPackageSchema = z.object({
  id: z.number().int(),
  nombre: z.string(),
  descripcion: z.string(),
  precio: z.number().nullable().optional(),
});

export const washPackageListSchema = z.array(washPackageSchema);

export type WashPackage = z.infer<typeof washPackageSchema>;

export async function getPackages(): Promise<WashPackage[]> {
  const token = await getToken();
  const raw = await apiClient.get<unknown>('/api/packages', {
    token: token ?? undefined,
  });

  return washPackageListSchema.parse(raw);
}
