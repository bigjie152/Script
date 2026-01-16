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
