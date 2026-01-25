import {
  createEmptyDocument,
  normalizeContent,
  deserializeDocument
} from "./plainTextAdapter";
import { EditorDocument, DocumentModuleKey } from "../../types/editorDocument";

export type ModuleEntry = {
  id: string;
  name: string;
  content: Record<string, unknown>;
  meta?: Record<string, unknown>;
  data?: Record<string, unknown>;
  updatedAt?: string | null;
};

export type ModuleCollection = {
  kind: "collection";
  entries: ModuleEntry[];
  activeId?: string | null;
};

type CollectionSeed = {
  projectId: string;
  module: DocumentModuleKey;
  defaultName: string;
};

function isCollection(value: unknown): value is ModuleCollection {
  if (!value || typeof value !== "object") return false;
  const maybe = value as ModuleCollection;
  return maybe.kind === "collection" && Array.isArray(maybe.entries);
}

function createEntry(
  seed: CollectionSeed,
  name: string,
  content?: Record<string, unknown>
): ModuleEntry {
  const emptyDoc = createEmptyDocument(seed.projectId, seed.module).content;
  return {
    id: crypto.randomUUID(),
    name,
    content: normalizeContent(content ?? emptyDoc),
    meta: {},
    data: {},
    updatedAt: null
  };
}

export function normalizeModuleCollection(
  raw: unknown,
  seed: CollectionSeed
): ModuleCollection {
  if (isCollection(raw)) {
    return {
      kind: "collection",
      entries: raw.entries.map((entry) => ({
        id: entry.id || crypto.randomUUID(),
        name: entry.name || seed.defaultName,
        content: normalizeContent(entry.content),
        meta: entry.meta && typeof entry.meta === "object" ? entry.meta : {},
        data: entry.data && typeof entry.data === "object" ? entry.data : {},
        updatedAt: entry.updatedAt ?? null
      })),
      activeId: raw.activeId ?? raw.entries[0]?.id ?? null
    };
  }

  const fallback = createEntry(seed, seed.defaultName, normalizeContent(raw));
  return {
    kind: "collection",
    entries: [fallback],
    activeId: fallback.id
  };
}

export function serializeModuleCollection(
  collection: ModuleCollection
): Record<string, unknown> {
  return {
    kind: "collection",
    activeId: collection.activeId ?? null,
    entries: collection.entries.map((entry) => ({
      ...entry,
      content: normalizeContent(entry.content),
      meta: entry.meta && typeof entry.meta === "object" ? entry.meta : {},
      data: entry.data && typeof entry.data === "object" ? entry.data : {}
    }))
  };
}

export function getActiveEntry(
  collection: ModuleCollection
): ModuleEntry | null {
  if (!collection.entries.length) return null;
  const activeId = collection.activeId;
  if (!activeId) return collection.entries[0];
  return (
    collection.entries.find((entry) => entry.id === activeId) ??
    collection.entries[0]
  );
}

export function updateEntryContent(
  collection: ModuleCollection,
  entryId: string,
  content: Record<string, unknown>
): ModuleCollection {
  return {
    ...collection,
    entries: collection.entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            content: normalizeContent(content),
            updatedAt: new Date().toISOString()
          }
        : entry
    )
  };
}

export function updateEntryMeta(
  collection: ModuleCollection,
  entryId: string,
  nextMeta: Record<string, unknown>
): ModuleCollection {
  return {
    ...collection,
    entries: collection.entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            meta: nextMeta,
            updatedAt: new Date().toISOString()
          }
        : entry
    )
  };
}

export function updateEntryData(
  collection: ModuleCollection,
  entryId: string,
  nextData: Record<string, unknown>
): ModuleCollection {
  return {
    ...collection,
    entries: collection.entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            data: nextData,
            updatedAt: new Date().toISOString()
          }
        : entry
    )
  };
}

export function ensureEntry(
  collection: ModuleCollection,
  seed: CollectionSeed
): ModuleCollection {
  if (collection.entries.length) return collection;
  const entry = createEntry(seed, seed.defaultName);
  return { ...collection, entries: [entry], activeId: entry.id };
}

export function toEditorDocument(
  entry: ModuleEntry,
  meta: { projectId: string; module: DocumentModuleKey }
): EditorDocument {
  return deserializeDocument(entry.content, {
    projectId: meta.projectId,
    module: meta.module,
    updatedAt: entry.updatedAt ?? null
  });
}
