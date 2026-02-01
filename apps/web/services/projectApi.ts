import { apiRequest } from "./apiClient";

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  meta?: Record<string, unknown> | null;
  cover?: string | null;
  tags?: string[] | null;
  genre?: string | null;
  players?: string | null;
  duration?: string | null;
  difficulty?: string | null;
  ownerId?: string | null;
  isPublic?: boolean | number;
  publishedAt?: string | null;
  communitySummary?: Record<string, unknown> | null;
  aiStatus?: Record<string, unknown> | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Truth = {
  id: string;
  projectId: string;
  status: string;
  content: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectDetail = {
  project: Project;
  truth: Truth | null;
  latestSnapshotId: string | null;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
  content?: Record<string, unknown>;
};

export type CreateProjectResponse = {
  projectId: string;
  truthId: string;
  status: string;
  project?: Project;
  truth?: { id: string; status: string };
};

export type ProjectListItem = {
  id: string;
  name: string;
  description?: string;
  updatedAt?: string;
  status?: string;
  truthStatus?: string;
};

export type ProjectListResponse = {
  projects: ProjectListItem[];
};

export type StructureStatusResponse = {
  ready: boolean;
  healthy: boolean;
  missingModules: string[];
  needsReviewModules: string[];
  p0IssueCount: number;
};

export type ImpactReportItem = {
  id: string;
  truthSnapshotId: string | null;
  affectedItems: Record<string, unknown>;
  createdAt: string;
};

export type ImpactReportResponse = {
  reports: ImpactReportItem[];
};

export type IssueItem = {
  id: string;
  source?: string | null;
  type: string;
  severity: string;
  title: string;
  description?: string | null;
  refs?: unknown;
  createdAt?: string;
};

export type IssuesResponse = {
  truthSnapshotId: string | null;
  issues: IssueItem[];
};

export async function createProject(payload: CreateProjectPayload) {
  return apiRequest<CreateProjectResponse>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getProject(projectId: string) {
  return apiRequest<ProjectDetail>(`/api/projects/${projectId}`);
}

export async function updateProject(
  projectId: string,
  payload: {
    name?: string;
    description?: string;
    meta?: Record<string, unknown>;
    cover?: string;
    tags?: string[];
    genre?: string;
    players?: string;
    duration?: string;
    difficulty?: string;
    status?: string;
  }
) {
  return apiRequest<{ project: Project }>(`/api/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function publishProject(projectId: string) {
  return apiRequest<{ published: boolean; publishedAt?: string }>(
    `/api/projects/${projectId}/publish`,
    { method: "POST" }
  );
}

export async function unpublishProject(projectId: string) {
  return apiRequest<{ published: boolean }>(
    `/api/projects/${projectId}/unpublish`,
    { method: "POST" }
  );
}

export async function listProjects(params: {
  scope?: "mine";
  sort?: "updatedAt" | "status" | "truthStatus" | "progress";
  q?: string;
  status?: string;
  truthStatus?: string;
}) {
  const search = new URLSearchParams();
  if (params.scope) search.set("scope", params.scope);
  if (params.sort) search.set("sort", params.sort);
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.truthStatus) search.set("truthStatus", params.truthStatus);
  const query = search.toString();
  const path = query ? `/api/projects?${query}` : "/api/projects";
  return apiRequest<ProjectListResponse>(path);
}

export async function updateProjectStatus(
  projectId: string,
  nextStatus: string
) {
  return apiRequest<{ status: string }>(`/api/projects/${projectId}/status`, {
    method: "POST",
    body: JSON.stringify({ nextStatus })
  });
}

export async function deleteProject(projectId: string) {
  return apiRequest<{ status: string }>(`/api/projects/${projectId}`, {
    method: "DELETE"
  });
}

export async function getStructureStatus(projectId: string) {
  return apiRequest<StructureStatusResponse>(
    `/api/projects/${projectId}/structure-status`
  );
}

export async function listImpactReports(projectId: string) {
  return apiRequest<ImpactReportResponse>(
    `/api/projects/${projectId}/impact-reports`
  );
}

export async function listIssues(projectId: string, truthSnapshotId?: string) {
  const query = truthSnapshotId ? `?truthSnapshotId=${truthSnapshotId}` : "";
  return apiRequest<IssuesResponse>(`/api/projects/${projectId}/issues${query}`);
}
