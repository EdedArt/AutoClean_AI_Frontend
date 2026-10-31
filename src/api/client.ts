import { config } from '@/lib/config';

export interface BackendErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  timeoutMs?: number;
  body?: unknown;
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

const DEFAULT_TIMEOUT_MS = 10000;

interface RawHttpResult {
  ok: boolean;
  status: number;
  statusText: string;
  contentType: string;
  rawText: string;
}

function isLocalClientOrFileError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }
  const lower = message.toLowerCase();
  return (
    lower.includes('formdata') ||
    lower.includes('bodyinit') ||
    lower.includes('could not retrieve file') ||
    lower.includes('file for uri') ||
    lower.includes('contenturi') ||
    lower.includes('filenotfound') ||
    lower.includes('eacces') ||
    lower.includes('enoent') ||
    lower.includes('invalid media type') ||
    lower.includes('unrecognized headers')
  );
}

function sendFormDataWithXhr(
  url: string,
  method: string,
  requestHeaders: Record<string, string>,
  formData: FormData,
  timeoutMs: number,
  externalSignal?: AbortSignal | null,
): Promise<RawHttpResult> {
  return new Promise<RawHttpResult>((resolve, reject) => {
    if (externalSignal?.aborted) {
      reject(new ApiError('Análisis cancelado por el usuario.', 'REQUEST_CANCELLED'));
      return;
    }

    const xhr = new XMLHttpRequest();
    let settled = false;

    const cleanupExternalAbort = () => {
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    };

    const onExternalAbort = () => {
      xhr.abort();
    };

    if (externalSignal) {
      externalSignal.addEventListener('abort', onExternalAbort);
    }

    xhr.open(method.toUpperCase(), url, true);
    xhr.timeout = timeoutMs;

    for (const [key, value] of Object.entries(requestHeaders)) {
      if (key.toLowerCase() === 'content-type') {
        continue;
      }
      xhr.setRequestHeader(key, value);
    }

    xhr.onload = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanupExternalAbort();

      const contentType = xhr.getResponseHeader('content-type') ?? '';
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText ?? '',
        contentType,
        rawText: typeof xhr.responseText === 'string' ? xhr.responseText : '',
      });
    };

    xhr.onabort = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanupExternalAbort();
      reject(new ApiError('Análisis cancelado por el usuario.', 'REQUEST_CANCELLED'));
    };

    xhr.ontimeout = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanupExternalAbort();
      reject(
        new ApiError(
          'El servidor tardó demasiado en responder (tiempo de espera agotado).',
          'REQUEST_TIMEOUT',
        ),
      );
    };

    xhr.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanupExternalAbort();

      const nativeDetail =
        typeof xhr.responseText === 'string' && xhr.responseText.trim().length > 0
          ? xhr.responseText.trim()
          : undefined;

      if (isLocalClientOrFileError(nativeDetail)) {
        reject(
          new ApiError(
            'No se pudo leer o preparar el archivo de imagen seleccionado en el dispositivo.',
            'FILE_READ_ERROR',
            undefined,
            nativeDetail,
          ),
        );
        return;
      }

      reject(
        new ApiError(
          'Sin conexión con el servidor. Verifica que el backend esté activo y alcanzable.',
          'NETWORK_ERROR',
          undefined,
          nativeDetail,
        ),
      );
    };

    try {
      xhr.send(formData);
    } catch (sendErr: unknown) {
      if (settled) {
        return;
      }
      settled = true;
      cleanupExternalAbort();
      const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      reject(
        new ApiError(
          'No se pudo preparar el envío de la fotografía desde el dispositivo.',
          'CLIENT_REQUEST_ERROR',
          undefined,
          errMsg,
        ),
      );
    }
  });
}

function parseAndHandleResult<T>(
  result: RawHttpResult,
  token: string | undefined,
  authHeader: string | undefined,
): T {
  let data: unknown = null;
  if (result.contentType.includes('application/json')) {
    try {
      data = result.rawText ? JSON.parse(result.rawText) : null;
    } catch {
      data = null;
    }
  } else {
    data = result.rawText;
  }

  if (!result.ok) {
    if (result.status === 401 && (token || authHeader)) {
      unauthorizedHandler?.();
    }

    const errorPayload = data as BackendErrorPayload | null;
    const backendError = errorPayload?.error;

    if (backendError && typeof backendError === 'object') {
      throw new ApiError(
        backendError.message || `Error del servidor (${result.status})`,
        backendError.code || 'API_ERROR',
        result.status,
        backendError.details,
      );
    }

    throw new ApiError(
      typeof data === 'string' && data.length > 0
        ? data
        : `Error en la petición: ${result.statusText || result.status}`,
      `HTTP_${result.status}`,
      result.status,
    );
  }

  return data as T;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, timeoutMs = DEFAULT_TIMEOUT_MS, headers, body, ...customOptions } = options;

  const url =
    endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${config.apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body instanceof FormData && typeof XMLHttpRequest !== 'undefined') {
    const xhrResult = await sendFormDataWithXhr(
      url,
      customOptions.method ?? 'POST',
      requestHeaders,
      body,
      timeoutMs,
      customOptions.signal,
    );
    return parseAndHandleResult<T>(xhrResult, token, requestHeaders.Authorization);
  }

  let serializedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (typeof body === 'string' || body instanceof FormData) {
      serializedBody = body;
    } else {
      serializedBody = JSON.stringify(body);
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }
    }
  }

  let didTimeout = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  const externalSignal = customOptions.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customOptions,
      headers: requestHeaders,
      body: serializedBody,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error as { name?: string; message?: string };
    if (didTimeout) {
      throw new ApiError(
        'El servidor tardó demasiado en responder (tiempo de espera agotado).',
        'REQUEST_TIMEOUT',
      );
    }
    if (externalSignal?.aborted || controller.signal.aborted || err?.name === 'AbortError') {
      throw new ApiError('Análisis cancelado por el usuario.', 'REQUEST_CANCELLED');
    }
    if (isLocalClientOrFileError(err?.message)) {
      throw new ApiError(
        'No se pudo preparar el archivo para el envío desde el dispositivo.',
        'CLIENT_REQUEST_ERROR',
        undefined,
        err?.message,
      );
    }
    throw new ApiError(
      'Sin conexión con el servidor. Verifica que el backend esté activo y alcanzable.',
      'NETWORK_ERROR',
      undefined,
      err?.message,
    );
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }

  let rawText = '';
  try {
    rawText = await response.text();
  } catch {
    rawText = '';
  }

  return parseAndHandleResult<T>(
    {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type') ?? '',
      rawText,
    },
    token,
    requestHeaders.Authorization,
  );
}

export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
