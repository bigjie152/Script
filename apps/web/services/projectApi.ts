import { apiRequest } from "./apiClient";

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  meta?: Record<string, unknown> | null;
  ownerId?: string | null;
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
  }
) {
  return apiRequest<{ project: Project }>(`/api/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function listProjects(params: {
  scope?: "mine";
  sort?: "updatedAt";
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params.scope) search.set("scope", params.scope);
  if (params.sort) search.set("sort", params.sort);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  const path = query ? `/api/projects?${query}` : "/api/projects";
  return apiRequest<ProjectListResponse>(path);
}
