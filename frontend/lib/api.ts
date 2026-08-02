import type { ApiEnvelope } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
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
    ApiEnvelope<T> | { message?: string } | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? "Something went wrong",
      response.status,
    );
  }

  return (payload as ApiEnvelope<T>).data;
}

export async function apiFetchBlob(
  path: string,
  accessToken?: string | null,
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
    } | null;
    throw new ApiError(
      payload?.message ?? "Unable to download file",
      response.status,
    );
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
