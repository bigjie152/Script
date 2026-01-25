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
