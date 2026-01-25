export type ApiErrorPayload = {
  error?: {
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT = 12000;

export function getApiBase() {
  const envBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (envBase) {
    return envBase;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "/api";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT
): Promise<T> {
  const baseUrl = getApiBase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = resolveUrl(baseUrl, path);
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    const data = text ? (safeJsonParse(text) as T | ApiErrorPayload) : null;

    if (!response.ok) {
      const message =
        (data as ApiErrorPayload)?.error?.message ||
        "请求失败，请稍后再试";
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new ApiError("请求超时，请稍后再试", 0);
    }
    throw new ApiError(
      error instanceof Error ? error.message : "网络异常，请稍后再试",
      0
    );
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function resolveUrl(base: string, path: string) {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!normalizedBase) return normalizedPath;
  if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }
  if (normalizedBase.startsWith("/")) {
    return `${normalizedBase}${normalizedPath}`;
  }
  try {
    return new URL(normalizedPath, normalizedBase).toString();
  } catch {
    return `${normalizedBase}${normalizedPath}`;
  }
}
