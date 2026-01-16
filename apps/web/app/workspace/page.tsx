"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopNav } from "../../components/layout/TopNav";
import { createProject } from "../../services/projectApi";

const MOCK_PROJECTS = [
  {
    id: "demo-1",
    name: "静谧回响",
    description: "发生在未来东京的悬疑探秘故事。"
  },
  {
    id: "demo-2",
    name: "代号：联合体",
    description: "涉及基因拼接与政治阴谋的 RPG 战役设定。"
  },
  {
    id: "demo-3",
    name: "午夜快车",
    description: "一场在列车上展开的密室推理。"
  }
];

export default function WorkspacePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<
    Array<{ id: string; name: string; description?: string | null }>
  >([]);

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      const result = await createProject({
        name: "未命名剧本",
        description: "新建项目"
      });
      const projectId = result.projectId || result.project?.id;
      if (!projectId) {
        throw new Error("创建失败，请重试");
      }
      setRecent((prev) => [
        {
          id: projectId,
          name: result.project?.name || "未命名剧本",
          description: result.project?.description || "新建项目"
        },
        ...prev
      ]);
      router.push(`/projects/${projectId}/editor/overview`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="workspace" />
        <main className="space-y-6">
          <TopNav onCreate={handleCreate} creating={creating} />
          {error ? <ErrorBanner message={error} /> : null}

          <section className="space-y-4">
            <div className="text-lg font-semibold">最近编辑</div>
            {recent.length === 0 ? (
              <EmptyState title="暂无项目" description="点击右上角新建项目。" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {recent.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      router.push(`/projects/${item.id}/editor/overview`)
                    }
                    className="glass-panel-strong px-5 py-4 text-left transition hover:-translate-y-1"
                  >
                    <div className="text-sm text-muted">剧本</div>
                    <div className="mt-2 text-lg font-semibold">
                      {item.name}
                    </div>
                    <div className="mt-2 text-sm text-muted">
                      {item.description || "暂无描述"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="text-lg font-semibold">项目卡片</div>
            <div className="grid gap-4 lg:grid-cols-3">
              {MOCK_PROJECTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    router.push(`/projects/${item.id}/editor/overview`)
                  }
                  className="glass-panel-strong px-5 py-4 text-left transition hover:-translate-y-1"
                >
                  <div className="text-sm text-muted">示例项目</div>
                  <div className="mt-2 text-lg font-semibold">{item.name}</div>
                  <div className="mt-2 text-sm text-muted">
                    {item.description}
                  </div>
                </button>
              ))}
              <button
                onClick={handleCreate}
                className="glass-panel flex items-center justify-center border border-dashed border-white/60 px-5 py-4 text-sm text-muted"
              >
                + 创建新项目
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
