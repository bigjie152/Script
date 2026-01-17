import { useCallback, useEffect, useMemo, useState } from "react";
import { lockTruth, unlockTruth, updateTruth } from "../services/truthApi";
import { useProject } from "./useProject";
import {
  EditorDocument,
  fromTruthContent,
  toTruthContent
} from "../lib/editorDocument";

type SaveState = "idle" | "saving" | "success" | "error";

export function useTruthDocument(projectId: string) {
  const { project, truth, latestSnapshotId, loading, error, refresh } =
    useProject(projectId);
  const [document, setDocument] = useState<EditorDocument>({ text: "" });
  const [baselineText, setBaselineText] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(truth?.status === "LOCKED");
  }, [truth?.status]);

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

  const lock = useCallback(async () => {
    const result = await lockTruth(projectId);
    setLocked(result.status === "LOCKED");
    refresh();
    return result;
  }, [projectId, refresh]);

  const unlock = useCallback(async () => {
    const result = await unlockTruth(projectId);
    setLocked(result.status === "LOCKED");
    refresh();
    return result;
  }, [projectId, refresh]);

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
