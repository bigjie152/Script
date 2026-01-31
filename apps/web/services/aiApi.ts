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
