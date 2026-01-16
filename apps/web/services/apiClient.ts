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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
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
        "请求失败，请稍后重试";
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new ApiError("请求超时，请稍后重试", 0);
    }
    throw new ApiError(
      error instanceof Error ? error.message : "网络异常，请稍后重试",
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
