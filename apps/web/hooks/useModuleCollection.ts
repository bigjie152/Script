import { useCallback, useEffect, useMemo, useState } from "react";
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
import { updateDocumentText } from "../editors/adapters/plainTextAdapter";

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
        return { ...prev, activeId: entryId };
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
      setCollection((prev) =>
        updateEntryContent(prev, activeEntryId, nextDoc.content)
      );
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
      updatedAt: null
    };
    setCollection((prev) => ({
      ...prev,
      entries: [...prev.entries, nextEntry],
      activeId: nextEntry.id
    }));
    setDocument(toEditorDocument(nextEntry, { projectId, module: moduleKey }));
    return id;
  }, [defaultName, entries.length, projectId, moduleKey]);

  const renameEntry = useCallback((entryId: string, name: string) => {
    setCollection((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.id === entryId ? { ...entry, name } : entry
      )
    }));
  }, []);

  const removeEntry = useCallback(
    (entryId: string) => {
      setCollection((prev) => {
        const filtered = prev.entries.filter((entry) => entry.id !== entryId);
        const nextEntries =
          filtered.length > 0
            ? filtered
            : [
                {
                  id: crypto.randomUUID(),
                  name: defaultName,
                  content: { type: "doc", content: [] },
                  meta: {},
                  data: {},
                  updatedAt: null
                }
              ];
        const nextActiveId =
          prev.activeId === entryId ? nextEntries[0].id : prev.activeId;
        const nextActive =
          nextEntries.find((entry) => entry.id === nextActiveId) ??
          nextEntries[0];
        if (nextActive) {
          setDocument(toEditorDocument(nextActive, { projectId, module: moduleKey }));
        }
        return {
          ...prev,
          entries: nextEntries,
          activeId: nextActiveId
        };
      });
    },
    [defaultName, projectId, moduleKey]
  );

  const updateMeta = useCallback(
    (entryId: string, meta: Record<string, unknown>) => {
      setCollection((prev) => updateEntryMeta(prev, entryId, meta));
    },
    []
  );

  const updateData = useCallback(
    (entryId: string, data: Record<string, unknown>) => {
      setCollection((prev) => updateEntryData(prev, entryId, data));
    },
    []
  );

  const hasUnsaved = useMemo(() => {
    const snapshot = JSON.stringify(collection);
    return snapshot !== baselineSnapshot;
  }, [collection, baselineSnapshot]);

  const save = useCallback(async () => {
    if (!projectId) return false;
    setSaveState("saving");
    setSaveError(null);
    try {
      await updateModuleDocument(
        projectId,
        moduleKey,
        serializeModuleCollection(collection)
      );
      setBaselineSnapshot(JSON.stringify(collection));
      setSaveState("success");
      refresh();
      return true;
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "保存失败，请重试");
      return false;
    }
  }, [projectId, moduleKey, collection, refresh]);

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
    updateData
  };
}
