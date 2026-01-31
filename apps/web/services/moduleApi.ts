import { apiRequest } from "./apiClient";
import { DocumentModuleKey } from "../types/editorDocument";
import { getModuleApiEndpoint } from "../modules/modules.config";

export type ModuleDocumentResponse = {
  module: DocumentModuleKey;
  documentId: string | null;
  content: Record<string, unknown>;
  needsReview?: number;
};

export type ModuleUpdateResponse = {
  module: DocumentModuleKey;
  documentId: string | null;
  status: string;
};

export async function getModuleDocument(
  projectId: string,
  module: DocumentModuleKey
) {
  return apiRequest<ModuleDocumentResponse>(
    getModuleApiEndpoint(projectId, module)
  );
}

export async function updateModuleDocument(
  projectId: string,
  module: DocumentModuleKey,
  content: Record<string, unknown>
) {
  return apiRequest<ModuleUpdateResponse>(
    getModuleApiEndpoint(projectId, module),
    {
      method: "PUT",
      body: JSON.stringify({ content })
    }
  );
}
