import { z } from 'zod';

import { apiClient } from './client';
import { getToken } from '@/lib/session';

export const DIRT_LEVELS = ['Leve', 'Moderado', 'Severo'] as const;

export const dirtLevelEnum = z.enum(DIRT_LEVELS);

export type DirtLevel = z.infer<typeof dirtLevelEnum>;

export const vehicleSchema = z.object({
  id: z.number().int(),
  placa: z.string(),
  marca: z.string(),
  modelo: z.string(),
  color: z.string(),
  ownerName: z.string(),
  ownerId: z.number().int().nullable().optional(),
  nivelSuciedad: dirtLevelEnum.nullable().optional(),
  createdAt: z.string(),
});

export const vehicleListResponseSchema = z.object({
  data: z.array(vehicleSchema),
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export interface CreateVehicleInput {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  ownerName: string;
  ownerEmail?: string;
  nivelSuciedad?: DirtLevel;
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const token = await getToken();
  const payload: CreateVehicleInput = {
    placa: input.placa,
    marca: input.marca.trim(),
    modelo: input.modelo.trim(),
    color: input.color.trim(),
    ownerName: input.ownerName.trim(),
    ...(input.ownerEmail && input.ownerEmail.trim() !== ''
      ? { ownerEmail: input.ownerEmail.trim() }
      : {}),
    ...(input.nivelSuciedad ? { nivelSuciedad: input.nivelSuciedad } : {}),
  };

  const raw = await apiClient.post<unknown>('/api/vehicles', payload, {
    token: token ?? undefined,
  });

  return vehicleSchema.parse(raw);
}

export async function findVehicleByPlate(placa: string): Promise<Vehicle | null> {
  const token = await getToken();
  const normalized = placa.trim().toUpperCase();
  const raw = await apiClient.get<unknown>(
    `/api/vehicles?search=${encodeURIComponent(normalized)}&limit=10`,
    {
      token: token ?? undefined,
    },
  );

  const parsed = vehicleListResponseSchema.parse(raw);
  const match = parsed.data.find((v) => v.placa.toUpperCase() === normalized);
  return match ?? null;
}
