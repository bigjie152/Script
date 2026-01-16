import { useCallback, useEffect, useMemo, useState } from "react";
import { updateTruth } from "../services/truthApi";
import { useProject } from "./useProject";

type SaveState = "idle" | "saving" | "success" | "error";

const LOCK_STORAGE_PREFIX = "script-truth-lock:";

function collectText(node: any): string {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(collectText).join("");
  }
  return "";
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!content || typeof content !== "object") return "";

  const node = content as { type?: string; content?: unknown; text?: unknown };

  if (typeof node.text === "string") return node.text;

  if (node.type === "doc" && Array.isArray(node.content)) {
    const paragraphs = node.content
      .map((child) => collectText(child))
      .filter((item) => item.trim().length > 0);
    if (paragraphs.length) return paragraphs.join("\n\n");
  }

  if (Array.isArray(node.content)) {
    const pieces = node.content
      .map((child) => collectText(child))
      .filter((item) => item.trim().length > 0);
    if (pieces.length) return pieces.join("\n\n");
  }

  return "";
}

function buildDocFromText(text: string): Record<string, unknown> {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { type: "doc", content: [] };
  }

  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line }]
    }))
  };
}

export function useTruthDocument(projectId: string) {
  const { project, truth, latestSnapshotId, loading, error, refresh } =
    useProject(projectId);
  const [text, setText] = useState("");
  const [baseline, setBaseline] = useState("");
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
    const nextText = extractText(truth?.content);
    setText(nextText);
    setBaseline(nextText);
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
      setText(next);
      if (saveState === "error") {
        setSaveState("idle");
        setSaveError(null);
      }
    },
    [saveState]
  );

  const hasUnsaved = useMemo(() => text !== baseline, [text, baseline]);

  const save = useCallback(async () => {
    if (locked) {
      setSaveState("error");
      setSaveError("当前真相已锁定，无法保存");
      return false;
    }

    setSaveState("saving");
    setSaveError(null);

    try {
      await updateTruth(projectId, buildDocFromText(text));
      setBaseline(text);
      setSaveState("success");
      refresh();
      return true;
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "保存失败，请重试");
      return false;
    }
  }, [locked, projectId, refresh, text]);

  const lock = useCallback(() => setLocked(true), []);
  const unlock = useCallback(() => setLocked(false), []);

  return {
    project,
    truth,
    latestSnapshotId,
    loading,
    error,
    text,
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
