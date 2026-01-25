"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProject";
import { useModuleDocument } from "@/hooks/useModuleDocument";
import { extractTextFromContent } from "@/editors/adapters/plainTextAdapter";
import { publishProject, unpublishProject } from "@/services/projectApi";

export const runtime = "edge";

export default function ProjectPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { project, truth, loading, error, refresh } = useProject(projectId);
  const overviewDoc = useModuleDocument(projectId, "overview");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const overviewText = useMemo(() => {
    if (overviewDoc.document?.content) {
      const text = extractTextFromContent(overviewDoc.document.content);
      if (text.trim()) return text;
    }
    return project?.description?.trim() || "暂无简介";
  }, [overviewDoc.document, project?.description]);

  const isOwner = Boolean(user && project && user.id === project.ownerId);
  const isPublic = project?.isPublic === 1 || project?.isPublic === true;

  const handlePublishToggle = async () => {
    if (!projectId) return;
    setPublishing(true);
    setPublishError(null);
    try {
      if (isPublic) {
        await unpublishProject(projectId);
      } else {
        await publishProject(projectId);
      }
      refresh();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-gray-900">项目预览</div>
          <div className="mt-1 text-sm text-gray-500">
            只读预览模式，内容不可编辑。
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:border-gray-300"
            type="button"
            onClick={() => router.push("/workspace")}
          >
            返回 Workspace
          </button>
          {isOwner ? (
            <button
              className="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
              type="button"
              onClick={() => router.push(`/projects/${projectId}/editor/overview`)}
            >
              进入编辑器
            </button>
          ) : null}
          {isOwner ? (
            <button
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100"
              type="button"
              onClick={handlePublishToggle}
              disabled={publishing}
            >
              {publishing ? "处理中..." : isPublic ? "撤回发布" : "发布到社区"}
            </button>
          ) : null}
        </div>
      </div>

      {loading || overviewDoc.loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
          正在加载项目信息...
        </div>
      ) : error || overviewDoc.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error || overviewDoc.error || "加载失败，请稍后重试"}
        </div>
      ) : !project ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
          项目不存在或无权访问。
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="text-xl font-semibold text-gray-900">
              {project.name}
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
              {overviewText}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
              <div>更新于：{project.updatedAt || "-"}</div>
              <div>
                Truth 状态：
                {truth?.status === "LOCKED" ? "已锁定" : "草稿"}
              </div>
              <div>社区状态：{isPublic ? "已发布" : "未发布"}</div>
            </div>
            {publishError ? (
              <div className="mt-2 text-xs text-rose-500">
                {publishError}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
