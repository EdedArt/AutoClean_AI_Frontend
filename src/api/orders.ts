import { z } from 'zod';

import { baySchema } from './bays';
import { apiClient } from './client';
import { washPackageSchema } from './packages';
import { vehicleSchema } from './vehicles';
import { getToken } from '@/lib/session';
import { WashPhaseCode } from '@/theme/tokens';

export const washPhaseEnum = z.enum([
  'PENDIENTE',
  'REMOJO',
  'LAVADO',
  'SECADO',
  'LISTO',
]) satisfies z.ZodType<WashPhaseCode>;

export const serviceOrderSchema = z.object({
  id: z.number().int(),
  vehicleId: z.number().int(),
  packageId: z.number().int().nullable().optional(),
  bayId: z.number().int().nullable().optional(),
  faseActual: washPhaseEnum,
  porcentajeProgreso: z.number().int(),
  listoParaLavar: z.boolean().optional().default(false),
  readyAt: z.string().nullable().optional(),
  horaEstimadaEntrega: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  etaMinutes: z.number().int().nullable().optional(),
  etaLabel: z.string().optional(),
  estimatedReadyAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  vehicle: vehicleSchema.optional(),
  package: washPackageSchema.nullable().optional(),
  bay: baySchema.nullable().optional(),
});

export const orderListResponseSchema = z.object({
  data: z.array(serviceOrderSchema),
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type ServiceOrder = z.infer<typeof serviceOrderSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;

export interface CreateOrderInput {
  vehicleId: number;
  packageId?: number | null;
  bayId?: number | null;
}

export async function getActiveOrders(): Promise<OrderListResponse> {
  const token = await getToken();
  const raw = await apiClient.get<unknown>('/api/orders?active=true&limit=50', {
    token: token ?? undefined,
  });

  return orderListResponseSchema.parse(raw);
}

export async function createOrder(input: CreateOrderInput): Promise<ServiceOrder> {
  const token = await getToken();
  const raw = await apiClient.post<unknown>('/api/orders', input, {
    token: token ?? undefined,
  });

  return serviceOrderSchema.parse(raw);
}

export async function markOrderReady(orderId: number): Promise<ServiceOrder> {
  const token = await getToken();
  const raw = await apiClient.post<unknown>(`/api/orders/${orderId}/ready`, undefined, {
    token: token ?? undefined,
  });

  return serviceOrderSchema.parse(raw);
}

export async function updateOrderPhase(
  orderId: number,
  faseActual: WashPhaseCode,
): Promise<ServiceOrder> {
  const token = await getToken();
  const raw = await apiClient.patch<unknown>(
    `/api/orders/${orderId}/phase`,
    { faseActual },
    {
      token: token ?? undefined,
    },
  );

  return serviceOrderSchema.parse(raw);
}

export async function deliverOrder(orderId: number): Promise<ServiceOrder> {
  const token = await getToken();
  const raw = await apiClient.post<unknown>(`/api/orders/${orderId}/deliver`, undefined, {
    token: token ?? undefined,
  });

  return serviceOrderSchema.parse(raw);
}
