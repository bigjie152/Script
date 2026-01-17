"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../../../components/common/Button";
import { EmptyState } from "../../../../components/common/EmptyState";
import { ErrorBanner } from "../../../../components/common/ErrorBanner";
import { Sidebar } from "../../../../components/layout/Sidebar";
import { useAuth } from "../../../../hooks/useAuth";
import { useProject } from "../../../../hooks/useProject";
import { DocumentEditor } from "../../../../editors/DocumentEditor";
import { deserializeDocument, createEmptyDocument } from "../../../../editors/adapters/plainTextAdapter";

export default function ProjectPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { project, truth, loading, error } = useProject(projectId);

  const document = useMemo(() => {
    if (!projectId) {
      return createEmptyDocument("", "truth");
    }
    return deserializeDocument(truth?.content ?? { type: "doc", content: [] }, {
      projectId,
      module: "truth",
      updatedAt: truth?.updatedAt ?? null
    });
  }, [projectId, truth?.content, truth?.updatedAt]);

  const isOwner = Boolean(user && project && user.id === project.ownerId);

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
            </div>
          </div>

          {loading ? (
            <EmptyState title="加载中…" description="正在读取项目信息" />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : !project ? (
            <EmptyState title="项目不存在" description="请返回工作台重新选择" />
          ) : (
            <div className="space-y-4">
              <div className="glass-panel-strong px-6 py-5">
                <div className="text-xl font-semibold">{project.name}</div>
                <div className="mt-2 text-sm text-muted">
                  {project.description || "暂无简介"}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
                  <div>更新于：{project.updatedAt || "-"}</div>
                  <div>Truth 状态：{truth?.status === "LOCKED" ? "已锁定" : "草稿"}</div>
                </div>
              </div>
              <DocumentEditor value={document} onChange={() => {}} readonly />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
