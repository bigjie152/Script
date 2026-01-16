import { useCallback, useEffect, useMemo, useState } from "react";
import { updateTruth } from "../services/truthApi";
import { useProject } from "./useProject";
import {
  EditorDocument,
  fromTruthContent,
  toTruthContent
} from "../lib/editorDocument";

type SaveState = "idle" | "saving" | "success" | "error";

const LOCK_STORAGE_PREFIX = "script-truth-lock:";

export function useTruthDocument(projectId: string) {
  const { project, truth, latestSnapshotId, loading, error, refresh } =
    useProject(projectId);
  const [document, setDocument] = useState<EditorDocument>({ text: "" });
  const [baselineText, setBaselineText] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [lockReady, setLockReady] = useState(false);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    const key = `${LOCK_STORAGE_PREFIX}${projectId}`;
    const stored = window.localStorage.getItem(key);
    if (stored === "LOCKED" || stored === "DRAFT") {
      setLocked(stored === "LOCKED");
    } else if (truth?.status) {
      setLocked(truth.status === "LOCKED");
    }
    setLockReady(true);
  }, [projectId, truth?.status]);

  useEffect(() => {
    if (!lockReady || !projectId || typeof window === "undefined") return;
    const key = `${LOCK_STORAGE_PREFIX}${projectId}`;
    window.localStorage.setItem(key, locked ? "LOCKED" : "DRAFT");
  }, [lockReady, locked, projectId]);

  useEffect(() => {
    const nextDoc = fromTruthContent(truth?.content);
    setDocument(nextDoc);
    setBaselineText(nextDoc.text);
    setSaveState("idle");
    setSaveError(null);
  }, [truth?.id, truth?.content]);

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
    if (locked) {
      setSaveState("error");
      setSaveError("当前真相已锁定，无法保存");
      return false;
    }

    setSaveState("saving");
    setSaveError(null);

    try {
      await updateTruth(projectId, toTruthContent(document));
      setBaselineText(document.text);
      setSaveState("success");
      refresh();
      return true;
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "保存失败，请重试");
      return false;
    }
  }, [locked, projectId, refresh, document]);

  const lock = useCallback(() => setLocked(true), []);
  const unlock = useCallback(() => setLocked(false), []);

  return {
    project,
    truth,
    latestSnapshotId,
    loading,
    error,
    document,
    text: document.text,
    setText: updateText,
    save,
    saveState,
    saveError,
    hasUnsaved,
    locked,
    lock,
    unlock,
    refresh
  };
}
