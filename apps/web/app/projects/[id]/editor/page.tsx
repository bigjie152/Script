"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../../components/common/Button";
import { EmptyState } from "../../../../components/common/EmptyState";
import { ErrorBanner } from "../../../../components/common/ErrorBanner";
import { useProject } from "../../../../hooks/useProject";
import { updateTruth } from "../../../../services/truthApi";

function extractPlainText(content: unknown) {
  if (!content || typeof content !== "object") return "";
  const node = content as {
    type?: string;
    content?: Array<{ type?: string; content?: unknown; text?: string }>;
  };
  if (!Array.isArray(node.content)) return "";
  const texts: string[] = [];
  for (const child of node.content) {
    if (child?.type === "paragraph" && Array.isArray(child.content)) {
      for (const inline of child.content) {
        if (inline?.type === "text" && typeof inline.text === "string") {
          texts.push(inline.text);
        }
      }
    }
  }
  return texts.join("\n");
}

function wrapPlainText(text: string) {
  if (!text.trim()) {
    return { type: "doc", content: [] };
  }
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }]
      }
    ]
  };
}

export const runtime = "edge";

export default function EditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = typeof params?.id === "string" ? params.id : "";
  const { project, truth, loading, error, refresh } = useProject(projectId);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (truth?.content) {
      setDraft(extractPlainText(truth.content));
    }
  }, [truth?.content]);

  const handleSave = async () => {
    setSaveError(null);
    setSavedAt(null);
    setSaving(true);
    try {
      const content = wrapPlainText(draft);
      await updateTruth(projectId, content as Record<string, unknown>);
      refresh();
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 lg:px-8">
        <EmptyState title="加载中..." description="正在读取项目数据" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-6 lg:px-8">
        <ErrorBanner message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">
              {project?.name || "未命名项目"}
            </div>
            <div className="mt-1 text-sm text-muted">
              Truth ID：{truth?.id || "-"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/workspace")}>
              返回 Workspace
            </Button>
            <Button onClick={handleSave} loading={saving}>
              保存
            </Button>
          </div>
        </div>

        {saveError ? <ErrorBanner message={saveError} /> : null}
        {savedAt ? (
          <div className="text-xs text-muted">已保存：{savedAt}</div>
        ) : null}

        <div className="glass-panel-strong p-4">
          <label className="text-xs text-muted">Truth 内容（可编辑）</label>
          <textarea
            className="mt-2 h-[360px] w-full rounded-lg border border-white/60 bg-white/70 p-3 text-sm text-ink outline-none focus:border-ink/40"
            placeholder="在此输入剧情内容..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
