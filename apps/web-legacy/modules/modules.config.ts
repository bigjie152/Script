import { EditorModuleKey, DocumentModuleKey } from "../types/editorDocument";

export type ModuleEntryMode = "single" | "collection";

export type ModuleConfig = {
  key: EditorModuleKey;
  label: string;
  apiEndpoint: (projectId: string) => string;
  requiresTruthLocked: boolean;
  editorType: "truth" | "document";
  entryMode?: ModuleEntryMode;
};

export const MODULE_CONFIGS: ModuleConfig[] = [
  {
    key: "overview",
    label: "概览",
    apiEndpoint: (projectId) => `/api/projects/${projectId}/modules/overview`,
    requiresTruthLocked: false,
    editorType: "document",
    entryMode: "single"
  },
  {
    key: "truth",
    label: "真相",
    apiEndpoint: (projectId) => `/api/projects/${projectId}/truth`,
    requiresTruthLocked: false,
    editorType: "truth"
  },
  {
    key: "roles",
    label: "角色",
    apiEndpoint: (projectId) => `/api/projects/${projectId}/modules/roles`,
    requiresTruthLocked: true,
    editorType: "document",
    entryMode: "collection"
  },
  {
    key: "clues",
    label: "线索",
    apiEndpoint: (projectId) => `/api/projects/${projectId}/modules/clues`,
    requiresTruthLocked: true,
    editorType: "document",
    entryMode: "collection"
  },
  {
    key: "timeline",
    label: "时间线",
    apiEndpoint: (projectId) => `/api/projects/${projectId}/modules/timeline`,
    requiresTruthLocked: true,
    editorType: "document",
    entryMode: "collection"
  },
  {
    key: "dm",
    label: "DM 手册",
    apiEndpoint: (projectId) => `/api/projects/${projectId}/modules/dm`,
    requiresTruthLocked: true,
    editorType: "document",
    entryMode: "collection"
  }
];

export const MODULE_CONFIG_MAP = MODULE_CONFIGS.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<EditorModuleKey, ModuleConfig>
);

export const MODULE_KEYS = MODULE_CONFIGS.map((item) => item.key);
export const DOCUMENT_MODULE_KEYS = MODULE_CONFIGS.filter(
  (item) => item.key !== "truth"
).map((item) => item.key as DocumentModuleKey);

export function resolveModuleKey(
  value: string | null | undefined
): EditorModuleKey {
  if (!value) return "overview";
  if ((MODULE_KEYS as string[]).includes(value)) {
    return value as EditorModuleKey;
  }
  return "overview";
}

export function isDocumentModuleKey(
  key: EditorModuleKey
): key is DocumentModuleKey {
  return key !== "truth";
}

export function getModuleApiEndpoint(
  projectId: string,
  module: DocumentModuleKey
) {
  return `/api/projects/${projectId}/modules/${module}`;
}
