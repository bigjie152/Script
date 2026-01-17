import { apiRequest } from "./apiClient";

export type Project = {
  id: string;
  name: string;
  description?: string | null;
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

export async function createProject(payload: CreateProjectPayload) {
  return apiRequest<CreateProjectResponse>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getProject(projectId: string) {
  return apiRequest<ProjectDetail>(`/api/projects/${projectId}`);
}
