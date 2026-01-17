import { apiRequest } from "./apiClient";

export const MODULE_KEYS = ["overview", "roles", "clues", "timeline", "dm"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ModuleDocumentResponse = {
  module: ModuleKey;
  documentId: string | null;
  content: Record<string, unknown>;
};

export type ModuleUpdateResponse = {
  module: ModuleKey;
  documentId: string | null;
  status: string;
};

export async function getModuleDocument(projectId: string, module: ModuleKey) {
  return apiRequest<ModuleDocumentResponse>(
    `/api/projects/${projectId}/modules/${module}`
  );
}

export async function updateModuleDocument(
  projectId: string,
  module: ModuleKey,
  content: Record<string, unknown>
) {
  return apiRequest<ModuleUpdateResponse>(
    `/api/projects/${projectId}/modules/${module}`,
    {
      method: "PUT",
      body: JSON.stringify({ content })
    }
  );
}
