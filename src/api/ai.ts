import { z } from 'zod';

import { apiClient, ApiError } from './client';
import { serviceOrderSchema, washPhaseEnum } from './orders';
import { getToken } from '@/lib/session';

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const AI_ANALYZE_TIMEOUT_MS = 90000;

export const aiStatusSchema = z.object({
  mode: z.enum(['auto', 'gemini', 'simulated']),
  effectiveProvider: z.enum(['gemini', 'simulated']),
  model: z.string(),
  keyConfigured: z.boolean(),
  fallbackEnabled: z.boolean(),
  minConfidence: z.number(),
});

export const aiAnalysisResponseSchema = z.object({
  provider: z.string(),
  model: z.string(),
  fallbackUsed: z.boolean(),
  plate: z.object({
    detected: z.string().nullable(),
    expected: z.string(),
    matched: z.boolean(),
    confidence: z.number(),
  }),
  phase: z.object({
    previous: washPhaseEnum,
    detected: washPhaseEnum,
    current: washPhaseEnum,
    changed: z.boolean(),
    regression: z.boolean(),
    confidence: z.number(),
    source: z.string(),
    reason: z.string().nullable().optional(),
  }),
  observations: z.record(z.string(), z.unknown()).nullable().optional(),
  phaseSource: z.string().nullable().optional(),
  phaseReason: z.string().nullable().optional(),
  dirtLevel: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  evidenceId: z.number().int().nullable().optional(),
  order: serviceOrderSchema,
});

export type AiStatus = z.infer<typeof aiStatusSchema>;
export type AiAnalysisResponse = z.infer<typeof aiAnalysisResponseSchema>;

export interface UploadableImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  base64?: string | null;
  type?: string | null;
}

export function normalizeUploadableUri(rawUri: string | null | undefined): string {
  if (!rawUri || typeof rawUri !== 'string') {
    throw new ApiError(
      'No se pudo obtener la ruta del archivo de imagen seleccionado en el dispositivo.',
      'FILE_READ_ERROR',
      400,
    );
  }

  const trimmed = rawUri.trim();
  if (!trimmed) {
    throw new ApiError(
      'La ruta del archivo de imagen seleccionado está vacía.',
      'FILE_READ_ERROR',
      400,
    );
  }

  if (trimmed.startsWith('/')) {
    return `file://${trimmed}`;
  }

  if (trimmed.startsWith('file://') || trimmed.startsWith('content://')) {
    return trimmed;
  }

  throw new ApiError(
    'El archivo seleccionado no tiene una ruta local válida en el dispositivo.',
    'FILE_READ_ERROR',
    400,
    trimmed.slice(0, 32),
  );
}

export function normalizeJpegFileName(rawName: string | null | undefined, orderId: number): string {
  const fallback = `frame-${orderId}-${Date.now()}.jpg`;
  if (!rawName || typeof rawName !== 'string') {
    return fallback;
  }

  const sanitized = rawName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.[^.]+$/, '');

  if (!sanitized) {
    return fallback;
  }

  return `${sanitized}.jpg`;
}

export async function getAiStatus(): Promise<AiStatus> {
  const token = await getToken();
  const raw = await apiClient.get<unknown>('/api/ai/status', {
    token: token ?? undefined,
  });

  return aiStatusSchema.parse(raw);
}

export async function analyzeOrderImage(
  orderId: number,
  asset: UploadableImageAsset,
  signal?: AbortSignal,
): Promise<AiAnalysisResponse> {
  if (asset.type && asset.type !== 'image' && asset.type !== 'livePhoto') {
    throw new ApiError(
      'Formato de archivo no compatible. Selecciona una fotografía en formato JPEG, PNG o WEBP.',
      'INVALID_FILE_TYPE',
      400,
    );
  }

  const uploadUri = normalizeUploadableUri(asset.uri);
  const token = await getToken();
  const name = normalizeJpegFileName(asset.fileName, orderId);

  const formData = new FormData();
  formData.append('image', {
    uri: uploadUri,
    name,
    type: 'image/jpeg',
  } as unknown as Blob);

  const raw = await apiClient.post<unknown>(`/api/orders/${orderId}/analyze`, formData, {
    token: token ?? undefined,
    timeoutMs: AI_ANALYZE_TIMEOUT_MS,
    signal,
  });

  return aiAnalysisResponseSchema.parse(raw);
}
