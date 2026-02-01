"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCcw, X } from "lucide-react";
import { extractTextFromContent } from "@/editors/adapters/plainTextAdapter";
import { acceptAiCandidate, listAiCandidates, rejectAiCandidate, CandidateItem } from "@/services/aiApi";

interface AiCandidatePanelProps {
  projectId: string;
  refreshKey?: number;
  currentModule?: string;
  currentEntryId?: string | null;
  onInsertCandidate?: (candidate: CandidateItem) => void;
  streamDraft?: { active: boolean; target?: string; text: string } | null;
}

const targetLabel = (target: string) => {
  if (target === "role") return "角色剧本生成";
  if (target === "clue") return "线索结构生成";
  if (target === "timeline") return "时间线生成";
  if (target === "dm") return "DM 手册生成";
  if (target === "story") return "故事剧情生成";
  if (target === "insight") return "真相生成";
  return "真相生成";
};

export default function AiCandidatePanel({
  projectId,
  refreshKey = 0,
  currentModule,
  currentEntryId,
  onInsertCandidate,
  streamDraft
}: AiCandidatePanelProps) {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  const visibleCandidates = useMemo(() => {
    if (!currentModule) return candidates;
    const map: Record<string, string> = {
      truth: "insight",
      story: "story",
      roles: "role",
      clues: "clue",
      timeline: "timeline",
      dm: "dm"
    };
    const target = map[currentModule];
    if (!target) return candidates;
    return candidates.filter((candidate) => candidate.target === target);
  }, [candidates, currentModule]);

  const loadCandidates = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listAiCandidates(projectId, "pending");
      setCandidates(result.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载候选内容失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidates();
  }, [projectId, refreshKey]);

  const canInsert = (candidate: CandidateItem) => {
    if (!onInsertCandidate) return false;
    if (candidate.target === "insight") return currentModule === "truth";
    const map: Record<string, string> = {
      story: "story",
      role: "roles",
      clue: "clues",
      timeline: "timeline",
      dm: "dm"
    };
    if (!currentModule) return false;
    if (map[candidate.target] !== currentModule) return false;
    if (["role", "clue", "timeline", "dm"].includes(candidate.target)) {
      return Boolean(currentEntryId);
    }
    return true;
  };

  const handleAccept = async (candidate: CandidateItem) => {
    try {
      const entryId =
        ["role", "clue", "timeline", "dm"].includes(candidate.target) && currentEntryId
          ? currentEntryId
          : undefined;
      await acceptAiCandidate(projectId, candidate.id, entryId);
      if (canInsert(candidate)) {
        onInsertCandidate?.(candidate);
      }
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "采纳失败");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAiCandidate(projectId, id);
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "拒绝失败");
    }
  };

  const summary = useMemo(() => {
    if (loading) return "加载候选内容...";
    if (!visibleCandidates.length) return "暂无候选内容";
    return `待处理候选：${visibleCandidates.length}`;
  }, [loading, visibleCandidates.length]);

  return (
    <div className="mt-6 border border-gray-100 bg-white rounded-2xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="text-sm font-semibold text-gray-800">AI 候选区（阅读与采纳）</div>
          <div className="text-xs text-gray-500 mt-1">{summary}</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {collapsed ? "展开" : "收起"}
          </button>
          <button
            type="button"
            onClick={loadCandidates}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <RefreshCcw size={14} />
            刷新
          </button>
        </div>
      </div>

      {collapsed ? null : (
        <div className="px-5 py-4 space-y-4">
        {streamDraft?.active ? (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3">
            <div className="text-xs text-indigo-600 font-semibold mb-2">
              AI 正在生成中…
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-6">
              {streamDraft.text || "生成中，请稍候…"}
            </div>
          </div>
        ) : null}
        {error ? <div className="text-xs text-rose-500">{error}</div> : null}
        {!loading && visibleCandidates.length === 0 ? (
          <div className="text-xs text-gray-400">暂无候选内容</div>
        ) : null}

        {visibleCandidates.map((candidate) => {
          const contentText = candidate.content
            ? extractTextFromContent(candidate.content)
            : "";
          const isExpanded = !!expandedIds[candidate.id];
          const preview = contentText.length > 160 && !isExpanded
            ? `${contentText.slice(0, 160)}...`
            : contentText;

          return (
            <div key={candidate.id} className="rounded-xl border border-gray-100 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {candidate.title || "候选内容"}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {targetLabel(candidate.target)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(candidate)}
                    data-testid={`ai-accept-${candidate.id}`}
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    <Check size={12} />
                    {canInsert(candidate) ? "采纳并插入" : "采纳"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(candidate.id)}
                    data-testid={`ai-reject-${candidate.id}`}
                    className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
                  >
                    <X size={12} />
                    拒绝
                  </button>
                </div>
              </div>

              {candidate.summary ? (
                <div className="text-xs text-gray-600 mt-2">{candidate.summary}</div>
              ) : null}

              {preview ? (
                <div className="mt-3 text-sm text-gray-700 whitespace-pre-line leading-6">
                  {preview}
                </div>
              ) : null}

              {contentText.length > 160 ? (
                <button
                  type="button"
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
                  onClick={() =>
                    setExpandedIds((prev) => ({ ...prev, [candidate.id]: !isExpanded }))
                  }
                >
                  {isExpanded ? "收起内容" : "展开全部"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
