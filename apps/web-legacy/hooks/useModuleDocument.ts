import { useCallback, useEffect, useMemo, useState } from "react";
import { DocumentModuleKey, EditorDocument } from "../types/editorDocument";
import {
  getModuleDocument,
  updateModuleDocument
} from "../services/moduleApi";
import {
  createEmptyDocument,
  deserializeDocument,
  serializeDocument,
  updateDocumentText
} from "../editors/adapters/plainTextAdapter";

type SaveState = "idle" | "saving" | "success" | "error";

export function useModuleDocument(
  projectId: string,
  moduleKey?: DocumentModuleKey | null
) {
  const [document, setDocument] = useState<EditorDocument>(() =>
    createEmptyDocument(projectId, moduleKey ?? "overview")
  );
  const [baselineText, setBaselineText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!moduleKey) return;
    setDocument(createEmptyDocument(projectId, moduleKey));
    setBaselineText("");
    setSaveState("idle");
    setSaveError(null);
  }, [projectId, moduleKey]);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!projectId || !moduleKey) return;
    const activeModule: DocumentModuleKey = moduleKey;
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getModuleDocument(projectId, activeModule);
        if (!alive) return;
        const nextDoc = deserializeDocument(data.content, {
          projectId,
          module: activeModule
        });
        setDocument(nextDoc);
        setBaselineText(nextDoc.text);
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
  }, [projectId, moduleKey, version]);

  useEffect(() => {
    if (saveState !== "success") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 1200);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const updateText = useCallback(
    (next: string) => {
      setDocument((prev) => updateDocumentText(prev, next));
      if (saveState === "error") {
        setSaveState("idle");
        setSaveError(null);
      }
    },
    [saveState]
  );

  const updateDocument = useCallback(
    (next: EditorDocument) => {
      setDocument(next);
      if (saveState === "error") {
        setSaveState("idle");
        setSaveError(null);
      }
    },
    [saveState]
  );

  const hasUnsaved = useMemo(
    () => document.text !== baselineText,
    [document.text, baselineText]
  );

  const save = useCallback(async () => {
    if (!projectId || !moduleKey) return false;
    const activeModule: DocumentModuleKey = moduleKey;
    setSaveState("saving");
    setSaveError(null);

    try {
      await updateModuleDocument(
        projectId,
        activeModule,
        serializeDocument(document)
      );
      setBaselineText(document.text);
      setSaveState("success");
      refresh();
      return true;
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "保存失败，请重试");
      return false;
    }
  }, [projectId, moduleKey, document, refresh]);

  return {
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
    refresh
  };
}
