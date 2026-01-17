import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ModuleKey,
  getModuleDocument,
  updateModuleDocument
} from "../services/moduleApi";
import { EditorDocument, fromTruthContent, toTruthContent } from "../lib/editorDocument";

type SaveState = "idle" | "saving" | "success" | "error";

export function useModuleDocument(
  projectId: string,
  moduleKey?: ModuleKey | null
) {
  const [document, setDocument] = useState<EditorDocument>({ text: "" });
  const [baselineText, setBaselineText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!projectId || !moduleKey) return;
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getModuleDocument(projectId, moduleKey);
        if (!alive) return;
        const nextDoc = fromTruthContent(data.content);
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
      setDocument({ text: next });
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
    setSaveState("saving");
    setSaveError(null);

    try {
      await updateModuleDocument(projectId, moduleKey, toTruthContent(document));
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
