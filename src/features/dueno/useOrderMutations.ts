import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ACTIVE_ORDERS_QUERY_KEY } from './useActiveOrders';
import { BAY_SUMMARY_QUERY_KEY } from './useBaySummary';
import { BAYS_QUERY_KEY } from './useCatalogs';
import { analyzeOrderImage, type AiAnalysisResponse, type UploadableImageAsset } from '@/api/ai';
import { ApiError } from '@/api/client';
import {
  createOrder,
  deliverOrder,
  markOrderReady,
  type OrderListResponse,
  type ServiceOrder,
  updateOrderPhase,
} from '@/api/orders';
import {
  createVehicle,
  type CreateVehicleInput,
  findVehicleByPlate,
  type Vehicle,
} from '@/api/vehicles';
import { WashPhaseCode } from '@/theme/tokens';

export interface RegisterVehicleAndOrderInput extends CreateVehicleInput {
  packageId: number;
  bayId: number;
}

export interface RegisterVehicleAndOrderResult {
  vehicle: Vehicle;
  order: ServiceOrder;
}

export class PartialRegistrationError extends Error {
  readonly vehicle: Vehicle;
  readonly causeError: Error;
  readonly code: string;

  constructor(vehicle: Vehicle, message: string, code: string, causeError: Error) {
    super(message);
    this.name = 'PartialRegistrationError';
    this.vehicle = vehicle;
    this.code = code;
    this.causeError = causeError;
    Object.setPrototypeOf(this, PartialRegistrationError.prototype);
  }
}

function updateOrderInCache(
  oldData: OrderListResponse | undefined,
  updatedOrder: ServiceOrder,
): OrderListResponse | undefined {
  if (!oldData) {
    return oldData;
  }

  const exists = oldData.data.some((item) => item.id === updatedOrder.id);
  if (!exists) {
    return oldData;
  }

  return {
    ...oldData,
    data: oldData.data.map((item) =>
      item.id === updatedOrder.id
        ? {
            ...item,
            ...updatedOrder,
            etaLabel: updatedOrder.etaLabel ?? item.etaLabel,
            etaMinutes: updatedOrder.etaMinutes ?? item.etaMinutes,
            estimatedReadyAt: updatedOrder.estimatedReadyAt ?? item.estimatedReadyAt,
          }
        : item,
    ),
  };
}

export function useRegisterVehicleAndOrder() {
  const queryClient = useQueryClient();

  return useMutation<RegisterVehicleAndOrderResult, Error, RegisterVehicleAndOrderInput>({
    mutationFn: async (input) => {
      let vehicle: Vehicle;
      let wasNewlyCreated = false;

      try {
        vehicle = await createVehicle({
          placa: input.placa,
          marca: input.marca,
          modelo: input.modelo,
          color: input.color,
          ownerName: input.ownerName,
          ownerEmail: input.ownerEmail,
          nivelSuciedad: input.nivelSuciedad,
        });
        wasNewlyCreated = true;
      } catch (err) {
        if (err instanceof ApiError && err.code === 'DUPLICATE_RESOURCE') {
          const existing = await findVehicleByPlate(input.placa);
          if (!existing) {
            throw err;
          }
          vehicle = existing;
        } else {
          throw err;
        }
      }

      try {
        const order = await createOrder({
          vehicleId: vehicle.id,
          packageId: input.packageId,
          bayId: input.bayId,
        });

        return { vehicle, order };
      } catch (orderErr) {
        if (orderErr instanceof ApiError && orderErr.code === 'ACTIVE_ORDER_EXISTS') {
          throw new ApiError(
            `El vehículo con placa ${vehicle.placa} ya tiene una orden de lavado activa en curso.`,
            'ACTIVE_ORDER_EXISTS',
            409,
            orderErr.details,
          );
        }

        if (wasNewlyCreated && orderErr instanceof Error) {
          const code = orderErr instanceof ApiError ? orderErr.code : 'ORDER_CREATE_FAILED';
          const reason =
            orderErr instanceof ApiError && orderErr.code === 'BAY_OCCUPIED'
              ? 'la bahía seleccionada acaba de ocuparse'
              : orderErr.message;

          throw new PartialRegistrationError(
            vehicle,
            `El vehículo ${vehicle.placa} se registró correctamente, pero falló la creación de la orden porque ${reason}. Selecciona otra bahía o presiona "Registrar vehículo" de nuevo para crear solo la orden.`,
            code,
            orderErr,
          );
        }

        throw orderErr;
      }
    },
    onSuccess: ({ order }) => {
      queryClient.setQueryData<OrderListResponse>(ACTIVE_ORDERS_QUERY_KEY, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          data: [order, ...old.data.filter((o) => o.id !== order.id)],
          meta: {
            ...old.meta,
            total: old.meta.total + 1,
          },
        };
      });
      void queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BAY_SUMMARY_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BAYS_QUERY_KEY });
    },
  });
}

export function useMarkOrderReady() {
  const queryClient = useQueryClient();

  return useMutation<ServiceOrder, Error, number>({
    mutationFn: (orderId) => markOrderReady(orderId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData<OrderListResponse>(ACTIVE_ORDERS_QUERY_KEY, (old) =>
        updateOrderInCache(old, updatedOrder),
      );
      void queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_QUERY_KEY });
    },
  });
}

export function useUpdateOrderPhase() {
  const queryClient = useQueryClient();

  return useMutation<ServiceOrder, Error, { orderId: number; faseActual: WashPhaseCode }>({
    mutationFn: ({ orderId, faseActual }) => updateOrderPhase(orderId, faseActual),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData<OrderListResponse>(ACTIVE_ORDERS_QUERY_KEY, (old) =>
        updateOrderInCache(old, updatedOrder),
      );
      void queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BAY_SUMMARY_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BAYS_QUERY_KEY });
    },
  });
}

export function useDeliverOrder() {
  const queryClient = useQueryClient();

  return useMutation<ServiceOrder, Error, number>({
    mutationFn: (orderId) => deliverOrder(orderId),
    onSuccess: (deliveredOrder) => {
      queryClient.setQueryData<OrderListResponse>(ACTIVE_ORDERS_QUERY_KEY, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          data: old.data.filter((item) => item.id !== deliveredOrder.id),
          meta: {
            ...old.meta,
            total: Math.max(0, old.meta.total - 1),
          },
        };
      });
      void queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BAY_SUMMARY_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BAYS_QUERY_KEY });
    },
  });
}

export interface AnalyzeOrderVariables {
  orderId: number;
  asset: UploadableImageAsset;
  signal?: AbortSignal;
}

export function useAnalyzeOrderImage() {
  const queryClient = useQueryClient();

  return useMutation<AiAnalysisResponse, Error, AnalyzeOrderVariables>({
    mutationFn: ({ orderId, asset, signal }) => analyzeOrderImage(orderId, asset, signal),
    onSuccess: (response) => {
      queryClient.setQueryData<OrderListResponse>(ACTIVE_ORDERS_QUERY_KEY, (old) =>
        updateOrderInCache(old, response.order),
      );
      void queryClient.invalidateQueries({ queryKey: ACTIVE_ORDERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BAY_SUMMARY_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BAYS_QUERY_KEY });
    },
  });
}
