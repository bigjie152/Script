"use client";

import { useEffect, useState } from "react";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { EmptyState } from "../../components/common/EmptyState";
import { getIssues, IssueItem } from "../../services/issueApi";

type IssuePanelProps = {
  projectId: string;
  truthSnapshotId?: string | null;
  refreshToken?: number;
};

export function IssuePanel({
  projectId,
  truthSnapshotId,
  refreshToken = 0
}: IssuePanelProps) {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getIssues(projectId, truthSnapshotId || undefined);
        if (alive) {
          setIssues(data.issues || []);
          setActiveId(data.issues?.[0]?.id || null);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "加载失败，请重试");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [projectId, truthSnapshotId, refreshToken]);

  if (loading) {
    return <div className="text-sm text-muted">问题列表加载中...</div>;
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (!issues.length) {
    return <EmptyState title="暂无问题" description="当前真相暂无问题条目" />;
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => {
        const active = issue.id === activeId;
        return (
          <button
            key={issue.id}
            onClick={() => setActiveId(issue.id)}
            className={`glass-panel-strong w-full text-left transition ${
              active ? "ring-2 ring-accent/30" : ""
            } px-4 py-3`}
          >
            <div className="text-xs text-muted">
              严重度：{issue.severity || "unknown"}
            </div>
            <div className="mt-1 text-sm font-semibold">{issue.title}</div>
            <div className="mt-1 text-xs text-muted">
              {issue.description || "暂无描述"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
