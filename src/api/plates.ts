import { z } from 'zod';

import { apiClient } from './client';
import { washPackageSchema } from './packages';
import { getToken } from '@/lib/session';
import { WashPhaseCode } from '@/theme/tokens';

const washPhaseEnum = z.enum([
  'PENDIENTE',
  'REMOJO',
  'LAVADO',
  'SECADO',
  'POLICHADO',
  'LISTO',
]) satisfies z.ZodType<WashPhaseCode>;

export const VEHICLE_BODY_TYPES = ['SEDAN', 'HATCHBACK', 'SUV', 'PICKUP', 'VAN'] as const;
export type VehicleBodyType = (typeof VEHICLE_BODY_TYPES)[number];

export const plateStatusSchema = z.object({
  placa: z.string(),
  marca: z.string(),
  modelo: z.string(),
  color: z.string(),
  // Optional so the app keeps working against a backend deployed before these fields existed;
  // an unexpected value degrades to null (default car) instead of failing the whole response.
  bodyType: z.enum(VEHICLE_BODY_TYPES).nullable().optional().catch(null),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional()
    .catch(null),
  fase: washPhaseEnum,
  porcentajeProgreso: z.number().int(),
  listoParaLavar: z.boolean(),
  startedAt: z.string().nullable(),
  receivedAt: z.string().nullable(),
  etaMinutes: z.number().int().nullable().optional(),
  etaLabel: z.string(),
  estimatedReadyAt: z.string().nullable(),
  incluyePolichado: z.boolean().optional(),
  package: washPackageSchema.nullable().optional(),
  paquete: washPackageSchema.nullable().optional(),
});

export type PlateStatus = z.infer<typeof plateStatusSchema>;

export const searchedPlateEntrySchema = z.object({
  placa: z.string(),
  lastSearchedAt: z.string(),
  status: plateStatusSchema.nullable(),
  message: z.string().optional(),
});

export const myPlatesResponseSchema = z.object({
  data: z.array(searchedPlateEntrySchema),
});

export type SearchedPlateEntry = z.infer<typeof searchedPlateEntrySchema>;
export type MyPlatesResponse = z.infer<typeof myPlatesResponseSchema>;

/**
 * Consulta el estado actual de lavado de un vehículo por su placa.
 * Utiliza el cliente API centralizado e inyecta el token de sesión si está disponible.
 */
export async function getPlateStatus(placa: string): Promise<PlateStatus> {
  const token = await getToken();
  const raw = await apiClient.get<unknown>(`/api/plates/${encodeURIComponent(placa)}/status`, {
    token: token ?? undefined,
  });

  return plateStatusSchema.parse(raw);
}

/**
 * Obtiene el historial reciente de placas consultadas por el cliente autenticado (máximo 10).
 */
export async function getMyPlates(): Promise<SearchedPlateEntry[]> {
  const token = await getToken();
  const raw = await apiClient.get<unknown>('/api/me/plates', {
    token: token ?? undefined,
  });

  const parsed = myPlatesResponseSchema.parse(raw);
  return parsed.data;
}

/**
 * Elimina una placa del historial de búsquedas del cliente autenticado.
 */
export async function deleteMyPlate(placa: string): Promise<void> {
  const token = await getToken();
  await apiClient.delete<void>(`/api/me/plates/${encodeURIComponent(placa)}`, {
    token: token ?? undefined,
  });
}
