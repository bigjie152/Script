import { useCallback, useEffect, useMemo, useState } from "react";
import { lockTruth, unlockTruth, updateTruth } from "../services/truthApi";
import { useProject } from "./useProject";
import { EditorDocument } from "../types/editorDocument";
import {
  createEmptyDocument,
  deserializeDocument,
  serializeDocument,
  updateDocumentText
} from "../editors/adapters/plainTextAdapter";

type SaveState = "idle" | "saving" | "success" | "error";

export function useTruthDocument(projectId: string) {
  const { project, truth, latestSnapshotId, loading, error, refresh } =
    useProject(projectId);
  const [document, setDocument] = useState<EditorDocument>(() =>
    createEmptyDocument(projectId, "truth")
  );
  const [baselineText, setBaselineText] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const locked = useMemo(() => truth?.status === "LOCKED", [truth?.status]);

  useEffect(() => {
    const nextDoc = deserializeDocument(truth?.content, {
      projectId,
      module: "truth",
      updatedAt: truth?.updatedAt ?? null
    });
    setDocument(nextDoc);
    setBaselineText(nextDoc.text);
    setSaveState("idle");
    setSaveError(null);
  }, [projectId, truth?.id, truth?.content, truth?.updatedAt]);

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
    if (locked) {
      setSaveState("error");
      setSaveError("当前真相已锁定，无法保存");
      return false;
    }

    setSaveState("saving");
    setSaveError(null);

    try {
      await updateTruth(projectId, serializeDocument(document));
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
    refresh();
    return result;
  }, [projectId, refresh]);

  const unlock = useCallback(async () => {
    const reason = window.prompt("请输入解锁原因");
    if (!reason || !reason.trim()) {
      return { cancelled: true };
    }
    const result = await unlockTruth(projectId, reason.trim());
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
    setDocument: updateDocument,
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
