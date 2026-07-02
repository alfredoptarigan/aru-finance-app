import type { ApiResponse } from '@/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi kamu.', 'NETWORK_ERROR');
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

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

  return (json as { data: T } | null)?.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
