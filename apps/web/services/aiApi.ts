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
