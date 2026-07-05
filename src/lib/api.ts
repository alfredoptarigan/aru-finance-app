import type { ApiResponse, AvatarUploadResponse } from '@/types';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';


const SENSITIVE_KEYS = new Set(['authorization', 'access_token', 'refresh_token', 'password']);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase()) ? '[redacted]' : redact(item),
    ]),
  );
}

function parseBody(body: BodyInit | null | undefined) {
  if (typeof body !== 'string') return undefined;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}


function redactPath(path: string) {
  const [pathname, query] = path.split('?');
  if (!query) return path;
  const params = new URLSearchParams(query);
  params.forEach((_value, key) => {
    if (SENSITIVE_KEYS.has(key.toLowerCase()) || key.toLowerCase().includes('token')) {
      params.set(key, '[redacted]');
    }
  });
  const safeQuery = params.toString();
  return safeQuery ? `${pathname}?${safeQuery}` : pathname;
}

function pretty(value: unknown) {
  const text = JSON.stringify(redact(value), null, 2);
  return text.length > 4000 ? `${text.slice(0, 4000)}\n... [truncated]` : text;
}

function logHttp(method: string, path: string, status: number | 'NETWORK_ERROR', body: unknown, json: unknown) {
  if (!__DEV__) return;
  console.log(`[API] ${method} ${redactPath(path)} ${status}`);
  if (body !== undefined) console.log('Request\n', pretty(body));
  if (json !== undefined) console.log('Response\n', pretty(json));
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number | 'NETWORK_ERROR' = 0,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ponytail: module-level token, hydrated from SecureStore by the auth store at boot
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? 'GET';
  const requestBody = parseBody(init.body);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    logHttp(method, path, 'NETWORK_ERROR', requestBody, undefined);
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi kamu.', 'NETWORK_ERROR');
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  logHttp(method, path, res.status, requestBody, json);

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError('Sesi kamu berakhir. Silakan login kembali.', 401);
  }

  if (!res.ok || json?.success === false) {
    const message =
      json && 'error' in json && typeof json.error === 'string'
        ? json.error
        : `Terjadi kesalahan (${res.status})`;
    const details = json && 'details' in json ? json.details : undefined;
    throw new ApiError(message, res.status, details);
  }

  if (json?.success !== true || !('data' in json)) {
    throw new ApiError(`Format response tidak valid (${res.status})`, res.status);
  }

  return json.data;
}


async function uploadAvatar(formData: FormData): Promise<AvatarUploadResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/me/avatar`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: formData,
    });
  } catch {
    logHttp('POST', '/me/avatar', 'NETWORK_ERROR', '[multipart avatar]', undefined);
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi kamu.', 'NETWORK_ERROR');
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<AvatarUploadResponse> | null;
  logHttp('POST', '/me/avatar', res.status, '[multipart avatar]', json);

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError('Sesi kamu berakhir. Silakan login kembali.', 401);
  }

  if (!res.ok || json?.success === false) {
    const message =
      json && 'error' in json && typeof json.error === 'string'
        ? json.error
        : `Terjadi kesalahan (${res.status})`;
    const details = json && 'details' in json ? json.details : undefined;
    throw new ApiError(message, res.status, details);
  }

  if (json?.success !== true || !('data' in json)) {
    throw new ApiError(`Format response tidak valid (${res.status})`, res.status);
  }

  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  uploadAvatar,
};
