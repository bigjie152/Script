import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DocumentModuleKey } from "../types/editorDocument";
import {
  getModuleDocument,
  updateModuleDocument
} from "../services/moduleApi";
import {
  ModuleCollection,
  ModuleEntry,
  normalizeModuleCollection,
  serializeModuleCollection,
  updateEntryContent,
  updateEntryMeta,
  updateEntryData,
  getActiveEntry,
  ensureEntry,
  toEditorDocument
} from "../editors/adapters/moduleCollection";
import { normalizeContent, updateDocumentText } from "../editors/adapters/plainTextAdapter";

type SaveState = "idle" | "saving" | "success" | "error";

export function useModuleCollection(
  projectId: string,
  moduleKey: DocumentModuleKey,
  defaultName: string
) {
  const [collection, setCollection] = useState<ModuleCollection>(() => ({
    kind: "collection",
    entries: [],
    activeId: null
  }));
  const collectionRef = useRef<ModuleCollection>({
    kind: "collection",
    entries: [],
    activeId: null
  });
  const [document, setDocument] = useState(() =>
    toEditorDocument(
      {
        id: "",
        name: defaultName,
        content: { type: "doc", content: [] }
      },
      { projectId, module: moduleKey }
    )
  );
  const [baselineSnapshot, setBaselineSnapshot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const seed = useMemo(
    () => ({ projectId, module: moduleKey, defaultName }),
    [projectId, moduleKey, defaultName]
  );

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!projectId) {
        if (alive) setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getModuleDocument(projectId, moduleKey);
        if (!alive) return;
        const next = normalizeModuleCollection(data.content, seed);
        const ensured = ensureEntry(next, seed);
        setCollection(ensured);
        collectionRef.current = ensured;
        const active = getActiveEntry(ensured);
        if (active) {
          setDocument(toEditorDocument(active, { projectId, module: moduleKey }));
        }
        setBaselineSnapshot(JSON.stringify(ensured));
        setSaveState("idle");
        setSaveError(null);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "加载失败，请重试");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [projectId, moduleKey, seed, version]);

  useEffect(() => {
    if (saveState !== "success") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 1200);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const entries = collection.entries;
  const activeEntry = useMemo(
    () => getActiveEntry(collection),
    [collection]
  );
  const activeEntryId = activeEntry?.id ?? null;

  const setActiveEntry = useCallback(
    (entryId: string) => {
      setCollection((prev) => {
        if (prev.activeId === entryId) return prev;
        const next = { ...prev, activeId: entryId };
        collectionRef.current = next;
        return next;
      });
      const nextEntry = entries.find((entry) => entry.id === entryId);
      if (nextEntry) {
        setDocument(toEditorDocument(nextEntry, { projectId, module: moduleKey }));
      }
    },
    [entries, projectId, moduleKey]
  );

  const updateDocument = useCallback(
    (nextDoc: typeof document) => {
      setDocument(nextDoc);
      if (!activeEntryId) return;
      setCollection((prev) => {
        const next = updateEntryContent(prev, activeEntryId, nextDoc.content);
        collectionRef.current = next;
        return next;
      });
      if (saveState === "error") {
        setSaveState("idle");
        setSaveError(null);
      }
    },
    [activeEntryId, saveState]
  );

  const updateText = useCallback(
    (nextText: string) => {
      updateDocument(updateDocumentText(document, nextText));
    },
    [document, updateDocument]
  );

  const createEntry = useCallback(() => {
    const id = crypto.randomUUID();
    const name = `${defaultName} ${entries.length + 1}`;
    const nextEntry: ModuleEntry = {
      id,
      name,
      content: { type: "doc", content: [] },
      meta: {},
      data: {},
      placeholderId: id,
      updatedAt: null
    };
    setCollection((prev) => {
      const next = {
        ...prev,
        entries: [...prev.entries, nextEntry],
        activeId: nextEntry.id
      };
      collectionRef.current = next;
      return next;
    });
    setDocument(toEditorDocument(nextEntry, { projectId, module: moduleKey }));
    return id;
  }, [defaultName, entries.length, projectId, moduleKey]);

  const renameEntry = useCallback((entryId: string, name: string) => {
    setCollection((prev) => {
      const next = {
        ...prev,
        entries: prev.entries.map((entry) =>
          entry.id === entryId ? { ...entry, name } : entry
        )
      };
      collectionRef.current = next;
      return next;
    });
  }, []);

  const removeEntry = useCallback(
    (entryId: string) => {
      setCollection((prev) => {
        const filtered = prev.entries.filter((entry) => entry.id !== entryId);
        const nextEntries =
          filtered.length > 0
            ? filtered
            : (() => {
                const fallbackId = crypto.randomUUID();
                return [
                  {
                    id: fallbackId,
                    name: defaultName,
                    content: { type: "doc", content: [] },
                    meta: {},
                    data: {},
                    placeholderId: fallbackId,
                    updatedAt: null
                  }
                ];
              })();
        const nextActiveId =
          prev.activeId === entryId ? nextEntries[0].id : prev.activeId;
        const nextActive =
          nextEntries.find((entry) => entry.id === nextActiveId) ??
          nextEntries[0];
        if (nextActive) {
          setDocument(toEditorDocument(nextActive, { projectId, module: moduleKey }));
        }
        const next = {
          ...prev,
          entries: nextEntries,
          activeId: nextActiveId
        };
        collectionRef.current = next;
        return next;
      });
    },
    [defaultName, projectId, moduleKey]
  );

  const updateMeta = useCallback(
    (entryId: string, meta: Record<string, unknown>) => {
      setCollection((prev) => {
        const next = updateEntryMeta(prev, entryId, meta);
        collectionRef.current = next;
        return next;
      });
    },
    []
  );

  const updateData = useCallback(
    (entryId: string, data: Record<string, unknown>) => {
      setCollection((prev) => {
        const next = updateEntryData(prev, entryId, data);
        collectionRef.current = next;
        return next;
      });
    },
    []
  );

  const applyEntries = useCallback(
    (items: Array<{ title: string; content: Record<string, unknown> }>, mode: "append" | "replace") => {
      if (!items.length) return;
      const now = new Date().toISOString();
      const normalizeName = (value: string) => value.trim().toLowerCase();
      const mergeDoc = (base: Record<string, unknown>, incoming: Record<string, unknown>) => {
        const baseDoc = normalizeContent(base);
        const incomingDoc = normalizeContent(incoming);
        const baseNodes = Array.isArray((baseDoc as any).content) ? (baseDoc as any).content : [];
        const incomingNodes = Array.isArray((incomingDoc as any).content) ? (incomingDoc as any).content : [];
        return {
          type: "doc",
          content: [...baseNodes, ...incomingNodes]
        } as Record<string, unknown>;
      };

      const prev = collectionRef.current;
      const nextEntries = [...prev.entries];
      const indexByName = new Map(
        nextEntries.map((entry, index) => [normalizeName(entry.name), index])
      );
      for (const item of items) {
        const title = item.title?.trim();
        if (!title) continue;
        const key = normalizeName(title);
        const matchIndex = indexByName.get(key);
        const incoming = normalizeContent(item.content);
        if (matchIndex !== undefined) {
          const existing = nextEntries[matchIndex];
          const nextContent = mode === "append" ? mergeDoc(existing.content, incoming) : incoming;
          nextEntries[matchIndex] = {
            ...existing,
            content: nextContent,
            updatedAt: now
          };
        } else {
          const id = crypto.randomUUID();
          nextEntries.push({
            id,
            name: title,
            content: incoming,
            meta: {},
            data: {},
            placeholderId: id,
            updatedAt: now
          });
          indexByName.set(key, nextEntries.length - 1);
        }
      }
      const next = {
        ...prev,
        entries: nextEntries
      };
      collectionRef.current = next;
      setCollection(next);
      const active = getActiveEntry(next);
      if (active) {
        setDocument(toEditorDocument(active, { projectId, module: moduleKey }));
      }
      if (saveState === "error") {
        setSaveState("idle");
        setSaveError(null);
      }
    },
    [projectId, moduleKey, saveState]
  );

  const hasUnsaved = useMemo(() => {
    const snapshot = JSON.stringify(collection);
    return snapshot !== baselineSnapshot;
  }, [collection, baselineSnapshot]);

  const save = useCallback(async () => {
    if (!projectId) return false;
    const snapshot = collectionRef.current;
    const placeholderIds = snapshot.entries
      .map((entry) => entry.placeholderId ?? entry.id)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    const uniqueIds = new Set(placeholderIds);
    if (placeholderIds.length !== uniqueIds.size) {
      setSaveState("error");
      setSaveError("存在重复的占位符 ID，请先调整后再保存。");
      return false;
    }
    setSaveState("saving");
    setSaveError(null);
    try {
      await updateModuleDocument(
        projectId,
        moduleKey,
        serializeModuleCollection(snapshot)
      );
      setBaselineSnapshot(JSON.stringify(snapshot));
      setSaveState("success");
      refresh();
      return true;
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "保存失败，请重试");
      return false;
    }
  }, [projectId, moduleKey, refresh]);

  return {
    entries,
    activeEntryId,
    activeEntry,
    document,
    setDocument: updateDocument,
    text: document.text,
    setText: updateText,
    loading,
    error,
    save,
    saveState,
    saveError,
    hasUnsaved,
    createEntry,
    renameEntry,
    removeEntry,
    setActiveEntry,
    updateMeta,
    updateData,
    applyEntries,
    refresh
  };
}
