import type { ApiEnvelope } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = "HTTP_ERROR",
    readonly details?: unknown,
  ) {
    super(message);
  }
}

type TokenRefresher = () => Promise<string | null>;

let refresher: TokenRefresher | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function registerTokenRefresher(handler: TokenRefresher | null) {
  refresher = handler;
}

function refreshAccessToken(): Promise<string | null> {
  if (!refresher) return Promise.resolve(null);
  refreshInFlight ??= refresher().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  return apiFetchInner<T>(path, init, accessToken, false);
}

async function apiFetchInner<T>(
  path: string,
  init: RequestInit,
  accessToken: string | undefined | null,
  retried: boolean,
): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | {
        message?: string;
        error?: { code?: string; message?: string; details?: unknown };
      }
    | null;

  if (!response.ok) {
    const failure = payload && "error" in payload ? payload.error : undefined;
    const error = new ApiError(
      failure?.message ?? payload?.message ?? "Something went wrong",
      response.status,
      failure?.code,
      failure?.details,
    );
    if (error.status === 401 && accessToken && !retried) {
      const freshToken = await refreshAccessToken();
      if (freshToken) {
        return apiFetchInner(path, init, freshToken, true);
      }
    }
    throw error;
  }

  return (payload as ApiEnvelope<T>).data;
}

export async function apiFetchBlob(
  path: string,
  accessToken?: string | null,
): Promise<Blob> {
  return apiFetchBlobInner(path, accessToken, false);
}

async function apiFetchBlobInner(
  path: string,
  accessToken: string | undefined | null,
  retried: boolean,
): Promise<Blob> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      error?: { code?: string; message?: string; details?: unknown };
    } | null;
    const error = new ApiError(
      payload?.error?.message ?? payload?.message ?? "Unable to download file",
      response.status,
      payload?.error?.code,
      payload?.error?.details,
    );
    if (error.status === 401 && accessToken && !retried) {
      const freshToken = await refreshAccessToken();
      if (freshToken) {
        return apiFetchBlobInner(path, freshToken, true);
      }
    }
    throw error;
  }
  return response.blob();
}

export function money(value: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

export function minorMoney(value: number, _currency?: string): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(value / 100);
}
