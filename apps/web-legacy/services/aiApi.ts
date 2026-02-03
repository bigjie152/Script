import { apiRequest } from "./apiClient";

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
