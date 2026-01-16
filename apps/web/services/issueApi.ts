import { apiRequest } from "./apiClient";

export type IssueItem = {
  id: string;
  severity: string;
  title: string;
  description?: string;
  refs?: unknown;
};

export type IssueListResponse = {
  truthSnapshotId: string;
  issues: IssueItem[];
};

export async function getIssues(
  projectId: string,
  truthSnapshotId?: string
) {
  const query = truthSnapshotId
    ? `?truthSnapshotId=${encodeURIComponent(truthSnapshotId)}`
    : "";
  return apiRequest<IssueListResponse>(
    `/api/projects/${projectId}/issues${query}`
  );
}
