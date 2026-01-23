"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../../components/common/Button";
import { EmptyState } from "../../../../components/common/EmptyState";
import { ErrorBanner } from "../../../../components/common/ErrorBanner";
import { Sidebar } from "../../../../components/layout/Sidebar";
import { useAuth } from "../../../../hooks/useAuth";
import { useProject } from "../../../../hooks/useProject";
import { useModuleDocument } from "../../../../hooks/useModuleDocument";
import { DocumentEditor } from "../../../../editors/DocumentEditor";
import { createEmptyDocument } from "../../../../editors/adapters/plainTextAdapter";
import { publishProject, unpublishProject } from "../../../../services/projectApi";

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

  const document = useMemo(() => {
    if (!projectId) {
      return createEmptyDocument("", "overview");
    }
    return overviewDoc.document;
  }, [projectId, overviewDoc.document]);

  const overviewText = useMemo(() => {
    const text = overviewDoc.document.text?.trim();
    if (text) return text;
    return project?.description?.trim() || "暂无简介";
  }, [overviewDoc.document.text, project?.description]);

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
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="projects" />
        <main className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-semibold">项目预览</div>
              <div className="mt-1 text-sm text-muted">
                只读预览模式，内容不可编辑。
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => router.push("/workspace")}>
                返回 Workspace
              </Button>
              {isOwner ? (
                <Button onClick={() => router.push(`/projects/${projectId}/editor/overview`)}>
                  进入编辑器
                </Button>
              ) : null}
              {isOwner ? (
                <Button variant="ghost" loading={publishing} onClick={handlePublishToggle}>
                  {isPublic ? "撤回发布" : "发布到社区"}
                </Button>
              ) : null}
            </div>
          </div>

          {loading || overviewDoc.loading ? (
            <EmptyState title="加载中…" description="正在读取项目信息" />
          ) : error || overviewDoc.error ? (
            <ErrorBanner message={error || overviewDoc.error || "加载失败"} />
          ) : !project ? (
            <EmptyState title="项目不存在" description="请返回工作台重新选择" />
          ) : (
            <div className="space-y-4">
              <div className="glass-panel-strong px-6 py-5">
                <div className="text-xl font-semibold">{project.name}</div>
                <div className="mt-2 text-sm text-muted">
                  {overviewText}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
                  <div>更新于：{project.updatedAt || "-"}</div>
                  <div>Truth 状态：{truth?.status === "LOCKED" ? "已锁定" : "草稿"}</div>
                  <div>社区状态：{isPublic ? "已发布" : "未发布"}</div>
                </div>
                {publishError ? (
                  <div className="mt-2 text-xs text-rose-500">{publishError}</div>
                ) : null}
              </div>
              <DocumentEditor value={document} onChange={() => {}} readonly />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
