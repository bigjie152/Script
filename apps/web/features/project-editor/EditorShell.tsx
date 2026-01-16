"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorSurface } from "../../components/editor/EditorSurface";
import { Button } from "../../components/common/Button";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { EmptyState } from "../../components/common/EmptyState";
import { TabGroup } from "../../components/common/TabGroup";
import { useProject } from "../../hooks/useProject";
import { deriveRoles, checkConsistency } from "../../services/aiApi";
import { lockTruth, updateTruth } from "../../services/truthApi";
import { AIPanel } from "../ai-panel/AIPanel";
import { IssuePanel } from "../issue-panel/IssuePanel";

const MODULES = [
  { key: "overview", label: "概览" },
  { key: "truth", label: "真相" },
  { key: "roles", label: "角色" },
  { key: "clues", label: "线索" },
  { key: "timeline", label: "时间线" },
  { key: "dm", label: "DM 手册" }
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

type EditorShellProps = {
  projectId: string;
  module: ModuleKey;
};

export function EditorShell({ projectId, module }: EditorShellProps) {
  const router = useRouter();
  const { project, truth, latestSnapshotId, loading, error, refresh } =
    useProject(projectId);
  const [tab, setTab] = useState("ai");
  const [content, setContent] = useState<Record<string, unknown>>({
    type: "doc",
    content: []
  });
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [truthStatus, setTruthStatus] = useState<string>("DRAFT");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState({
    save: false,
    lock: false,
    derive: false,
    check: false
  });
  const [issueRefresh, setIssueRefresh] = useState(0);

  useEffect(() => {
    if (truth?.content) {
      setContent(truth.content as Record<string, unknown>);
    }
    if (truth?.status) {
      setTruthStatus(truth.status);
    }
    if (latestSnapshotId) {
      setSnapshotId(latestSnapshotId);
    }
  }, [truth, latestSnapshotId]);

  const moduleLabel = useMemo(() => {
    return MODULES.find((item) => item.key === module)?.label || "概览";
  }, [module]);

  const handleSave = async () => {
    setActionError(null);
    setBusy((s) => ({ ...s, save: true }));
    try {
      const result = await updateTruth(projectId, content);
      setTruthStatus(result.status);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "保存失败，请重试");
    } finally {
      setBusy((s) => ({ ...s, save: false }));
    }
  };

  const handleLock = async () => {
    setActionError(null);
    setBusy((s) => ({ ...s, lock: true }));
    try {
      const result = await lockTruth(projectId);
      setSnapshotId(result.truthSnapshotId);
      setTruthStatus(result.status);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "锁定失败，请重试");
    } finally {
      setBusy((s) => ({ ...s, lock: false }));
    }
  };

  const handleDeriveRoles = async () => {
    setActionError(null);
    if (!snapshotId) {
      setActionError("请先锁定真相再生成角色。");
      return;
    }
    setBusy((s) => ({ ...s, derive: true }));
    try {
      await deriveRoles(projectId, snapshotId);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "生成角色失败，请重试"
      );
    } finally {
      setBusy((s) => ({ ...s, derive: false }));
    }
  };

  const handleCheckConsistency = async () => {
    setActionError(null);
    if (!snapshotId) {
      setActionError("请先锁定真相再进行一致性检查。");
      return;
    }
    setBusy((s) => ({ ...s, check: true }));
    try {
      await checkConsistency(projectId, snapshotId);
      setIssueRefresh((v) => v + 1);
      setTab("issues");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "一致性检查失败，请重试"
      );
    } finally {
      setBusy((s) => ({ ...s, check: false }));
    }
  };

  const handleNav = (next: ModuleKey) => {
    router.push(`/projects/${projectId}/editor/${next}`);
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="glass-panel-strong h-fit p-4">
          <div className="text-xs text-muted">核心模块</div>
          <div className="mt-4 space-y-1">
            {MODULES.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  item.key === module
                    ? "bg-white text-ink shadow-soft"
                    : "text-muted hover:bg-white/50 hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-6 text-xs text-muted">
            项目：{project?.name || "加载中..."}
          </div>
        </aside>

        <main className="space-y-4">
          <div className="glass-panel-strong flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div>
              <div className="text-lg font-semibold">{moduleLabel}</div>
              <div className="text-xs text-muted">项目编辑区</div>
            </div>
            {module === "truth" ? (
              <Button onClick={handleSave} loading={busy.save}>
                保存真相
              </Button>
            ) : null}
          </div>

          {loading ? (
            <EmptyState title="加载中..." description="正在读取项目数据" />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : module === "overview" ? (
            <div className="glass-panel-strong px-8 py-6">
              <div className="text-xl font-semibold">
                {project?.name || "未命名项目"}
              </div>
              <div className="mt-2 text-sm text-muted">
                {project?.description || "暂无描述"}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-muted">
                <div>
                  <div className="text-xs">创建时间</div>
                  <div className="mt-1 text-ink">
                    {project?.createdAt || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs">更新时间</div>
                  <div className="mt-1 text-ink">
                    {project?.updatedAt || "-"}
                  </div>
                </div>
              </div>
            </div>
          ) : module === "truth" ? (
            <EditorSurface content={content} onChange={setContent} />
          ) : (
            <EmptyState
              title="该模块暂未开放"
              description="V0.1 版本仅提供 Truth 的完整编辑能力。"
            />
          )}
        </main>

        <aside className="space-y-4">
          <TabGroup
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "ai", label: "AI 面板" },
              { key: "issues", label: "问题列表" }
            ]}
          />
          {actionError ? <ErrorBanner message={actionError} /> : null}
          {tab === "ai" ? (
            <AIPanel
              truthStatus={truthStatus}
              onLock={handleLock}
              onDeriveRoles={handleDeriveRoles}
              onCheckConsistency={handleCheckConsistency}
              loading={{
                lock: busy.lock,
                derive: busy.derive,
                check: busy.check
              }}
            />
          ) : (
            <IssuePanel
              projectId={projectId}
              truthSnapshotId={snapshotId}
              refreshToken={issueRefresh}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
