import type { ApiResponse, AvatarUploadResponse, Session } from '@/types';

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

// ponytail: module-level tokens, hydrated from SecureStore by the auth store at boot.
let authToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;
let onSessionRefreshed: ((session: Session) => Promise<void>) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setAuthTokens(accessToken: string | null, nextRefreshToken: string | null) {
  authToken = accessToken;
  refreshToken = nextRefreshToken;
}

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

export function setOnSessionRefreshed(handler: (session: Session) => Promise<void>) {
  onSessionRefreshed = handler;
}

async function refreshSession() {
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const json = (await res.json().catch(() => null)) as ApiResponse<{ session: Session }> | null;
    logHttp('POST', '/auth/refresh', res.status, { refresh_token: refreshToken }, json);

    if (!res.ok || json?.success !== true || !('data' in json)) return null;

    const { session } = json.data;
    setAuthTokens(session.access_token, session.refresh_token);
    await onSessionRefreshed?.(session);
    return session.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
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
    if (!retried && path !== '/auth/refresh' && (await refreshSession())) {
      return request<T>(path, init, true);
    }
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


async function uploadAvatar(formData: FormData, retried = false): Promise<AvatarUploadResponse> {
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
    if (!retried && (await refreshSession())) return uploadAvatar(formData, true);
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
