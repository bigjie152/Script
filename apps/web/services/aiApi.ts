import { apiRequest } from "./apiClient";

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

export type CandidateItem = {
  id: string;
  target: string;
  title: string;
  summary?: string | null;
  content?: Record<string, unknown> | null;
  refs?: unknown;
  riskFlags?: string[] | null;
  status?: string;
};

export type DeriveCandidatesResponse = {
  actionType: string;
  provider: string;
  model: string;
  candidates: CandidateItem[];
};

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

export type CandidateListResponse = {
  candidates: CandidateItem[];
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

export async function deriveCandidates(
  projectId: string,
  payload: {
    actionType: string;
    intent?: string;
    truthSnapshotId?: string;
    context?: Record<string, unknown>;
  }
) {
  return apiRequest<DeriveCandidatesResponse>(
    `/api/projects/${projectId}/ai/derive`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function deriveCandidatesStream(
  projectId: string,
  payload: {
    actionType: string;
    intent?: string;
    truthSnapshotId?: string;
    context?: Record<string, unknown>;
  },
  handlers: {
    onDelta: (delta: string) => void;
    onDone: (result: DeriveCandidatesResponse) => void;
    onError: (message: string) => void;
    signal: AbortSignal;
  }
) {
  const response = await fetch(`/api/projects/${projectId}/ai/derive/stream`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json"
    },
    signal: handlers.signal,
    credentials: "include"
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "流式请求失败");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processChunk = (chunk: string) => {
    const lines = chunk.split("\n").map((line) => line.trim());
    const eventLine = lines.find((line) => line.startsWith("event:"));
    const event = eventLine ? eventLine.replace(/^event:\s*/, "") : "message";
    const dataLines = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s*/, ""));
    if (!dataLines.length) return;
    const data = dataLines.join("\n");
    if (event === "delta") {
      try {
        const parsed = JSON.parse(data) as { content?: string };
        if (parsed?.content) handlers.onDelta(parsed.content);
      } catch {
        if (data) handlers.onDelta(data);
      }
    } else if (event === "done") {
      try {
        const parsed = JSON.parse(data) as DeriveCandidatesResponse;
        handlers.onDone(parsed);
      } catch (err) {
        handlers.onError(
          err instanceof Error ? err.message : "解析结果失败"
        );
      }
    } else if (event === "error") {
      try {
        const parsed = JSON.parse(data) as { message?: string };
        handlers.onError(parsed?.message || "AI 生成失败");
      } catch {
        handlers.onError("AI 生成失败");
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const normalized = buffer.replace(/\r\n/g, "\n");
    const parts = normalized.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      processChunk(part);
    }
  }

  if (buffer.trim()) {
    processChunk(buffer.replace(/\r\n/g, "\n"));
  }
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

export async function listAiCandidates(
  projectId: string,
  status = "pending"
) {
  return apiRequest<CandidateListResponse>(
    `/api/projects/${projectId}/ai/candidates?status=${encodeURIComponent(status)}`
  );
}

export async function acceptAiCandidate(
  projectId: string,
  candidateId: string,
  entryId?: string
) {
  return apiRequest<{ status: string }>(
    `/api/projects/${projectId}/ai/candidates/${candidateId}/accept`,
    {
      method: "POST",
      body: entryId ? JSON.stringify({ entryId }) : undefined
    }
  );
}

export async function rejectAiCandidate(projectId: string, candidateId: string) {
  return apiRequest<{ status: string }>(
    `/api/projects/${projectId}/ai/candidates/${candidateId}/reject`,
    {
      method: "POST"
    }
  );
}
