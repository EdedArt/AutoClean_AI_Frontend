import { z } from 'zod';

import { apiClient } from './client';
import { serviceOrderSchema, washPhaseEnum } from './orders';
import { getToken } from '@/lib/session';

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
    source: z.enum(['rules', 'model']),
    reason: z.string().nullable().optional(),
  }),
  dirtLevel: z.string().nullable().optional(),
  notes: z.string().optional(),
  evidenceId: z.number().int().nullable().optional(),
  order: serviceOrderSchema,
});

export type AiStatus = z.infer<typeof aiStatusSchema>;
export type AiAnalysisResponse = z.infer<typeof aiAnalysisResponseSchema>;

export interface UploadableImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

const AI_ANALYZE_TIMEOUT_MS = 65000;

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
  const token = await getToken();

  const mimeType =
    asset.mimeType && asset.mimeType.startsWith('image/') ? asset.mimeType : 'image/jpeg';
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const name = asset.fileName || `frame-${orderId}-${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append('image', {
    uri: asset.uri,
    name,
    type: mimeType,
  } as unknown as Blob);

  const raw = await apiClient.post<unknown>(`/api/orders/${orderId}/analyze`, formData, {
    token: token ?? undefined,
    timeoutMs: AI_ANALYZE_TIMEOUT_MS,
    signal,
  });

  return aiAnalysisResponseSchema.parse(raw);
}
