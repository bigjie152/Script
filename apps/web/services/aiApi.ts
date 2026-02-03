import { apiRequest, ApiError, resolveApiUrl } from "./apiClient";

export type DeriveRolesResponse = {
  truthSnapshotId: string;
  roles: Array<{
    name: string;
    summary?: string;
    meta?: unknown;
  }>;
};

export type ConsistencyResponse = {
  truthSnapshotId: string;
  issues: Array<{
    type: string;
    severity: string;
    title: string;
    description?: string;
    refs?: unknown;
  }>;
};

export type DeriveDirectItem = {
  target: string;
  title: string;
  summary?: string | null;
  content: Record<string, unknown>;
  refs?: unknown;
  riskFlags?: string[] | null;
};

export type DeriveDirectResponse = {
  actionType: string;
  provider: string;
  model: string;
  items: DeriveDirectItem[];
};

type AiStreamEvent =
  | { type: "delta"; content: string }
  | { type: "final"; payload: DeriveDirectResponse }
  | { type: "error"; message: string }
  | { type: "ping" }
  | { type: "done" };

export type LogicCheckResponse = {
  truthSnapshotId: string;
  issues: Array<{
    type: string;
    severity: string;
    title: string;
    description?: string;
    refs?: unknown;
  }>;
};

export async function deriveRoles(
  projectId: string,
  truthSnapshotId?: string
) {
  return apiRequest<DeriveRolesResponse>(
    `/api/projects/${projectId}/ai/derive/roles`,
    {
      method: "POST",
      body: JSON.stringify({ truthSnapshotId })
    }
  );
}

export async function checkConsistency(
  projectId: string,
  truthSnapshotId?: string
) {
  return apiRequest<ConsistencyResponse>(
    `/api/projects/${projectId}/ai/check/consistency`,
    {
      method: "POST",
      body: JSON.stringify({ truthSnapshotId })
    }
  );
}

export async function deriveDirectContent(
  projectId: string,
  payload: {
    actionType: string;
    intent?: string;
    truthSnapshotId?: string;
    context?: Record<string, unknown>;
  }
) {
  return apiRequest<DeriveDirectResponse>(
    `/api/projects/${projectId}/ai/derive`,
    {
      method: "POST",
      body: JSON.stringify({ ...payload, mode: "direct" })
    }
  );
}

export async function deriveDirectContentStream(
  projectId: string,
  payload: {
    actionType: string;
    intent?: string;
    truthSnapshotId?: string;
    context?: Record<string, unknown>;
  },
  handlers?: {
    onDelta?: (delta: string) => void;
    onEvent?: (event: AiStreamEvent) => void;
    signal?: AbortSignal;
  }
) {
  const url = resolveApiUrl(`/api/projects/${projectId}/ai/derive`);
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    signal: handlers?.signal,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ...payload, mode: "direct", stream: true })
  });

  if (!response.ok) {
    const text = await response.text();
    let message = "请求失败，请稍后再试";
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      message = parsed?.error?.message || message;
    } catch {
      if (text) message = text;
    }
    throw new ApiError(message, response.status);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    const data = (await response.json()) as DeriveDirectResponse;
    return data;
  }

  if (!response.body) {
    throw new ApiError("响应为空，请稍后再试", 0);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: DeriveDirectResponse | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    if (buffer.includes("\r")) {
      buffer = buffer.replace(/\r/g, "");
    }

    while (true) {
      const boundaryIndex = buffer.indexOf("\n\n");
      if (boundaryIndex === -1) break;
      const chunk = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + 2);

      const lines = chunk.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payloadText = trimmed.slice(5).trim();
        if (!payloadText || payloadText === "[DONE]") continue;
        try {
          const event = JSON.parse(payloadText) as AiStreamEvent;
          handlers?.onEvent?.(event);
          if (event.type === "delta" && event.content) {
            handlers?.onDelta?.(event.content);
          }
          if (event.type === "error") {
            throw new ApiError(event.message || "AI 生成失败，请稍后再试", 500);
          }
          if (event.type === "final") {
            finalPayload = event.payload;
          }
        } catch (err) {
          if (err instanceof ApiError) throw err;
        }
      }
    }
  }

  if (finalPayload) return finalPayload;
  throw new ApiError("AI 返回为空，请稍后再试", 0);
}

export async function runLogicCheck(
  projectId: string,
  truthSnapshotId?: string
) {
  return apiRequest<LogicCheckResponse>(
    `/api/projects/${projectId}/ai/check`,
    {
      method: "POST",
      body: JSON.stringify({ truthSnapshotId })
    }
  );
}
