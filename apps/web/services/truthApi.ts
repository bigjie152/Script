import { apiRequest } from "./apiClient";

export type UpdateTruthResponse = {
  truthId: string;
  status: string;
};

export type LockTruthResponse = {
  truthSnapshotId: string;
  version: number;
  status: string;
};

export type UnlockTruthResponse = {
  truthId: string;
  status: string;
  impactReportId?: string;
  affectedItems?: Record<string, unknown>;
};

export async function updateTruth(
  projectId: string,
  content: Record<string, unknown>
) {
  return apiRequest<UpdateTruthResponse>(`/api/projects/${projectId}/truth`, {
    method: "PUT",
    body: JSON.stringify({ content })
  });
}

export async function lockTruth(projectId: string) {
  return apiRequest<LockTruthResponse>(`/api/projects/${projectId}/truth/lock`, {
    method: "POST"
  });
}

export async function unlockTruth(projectId: string, reason: string) {
  return apiRequest<UnlockTruthResponse>(
    `/api/projects/${projectId}/truth/unlock`,
    {
      method: "POST",
      body: JSON.stringify({ reason })
    }
  );
}
