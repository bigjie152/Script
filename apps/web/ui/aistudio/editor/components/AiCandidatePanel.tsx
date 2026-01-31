"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCcw, X } from "lucide-react";
import { extractTextFromContent } from "@/editors/adapters/plainTextAdapter";
import { acceptAiCandidate, listAiCandidates, rejectAiCandidate, CandidateItem } from "@/services/aiApi";

interface AiCandidatePanelProps {
  projectId: string;
  refreshKey?: number;
}

const targetLabel = (target: string) => {
  if (target === "role") return "角色档案";
  if (target === "clue") return "线索草案";
  if (target === "timeline") return "时间线草案";
  if (target === "dm") return "主持人手册";
  if (target === "story") return "剧情草案";
  if (target === "insight") return "结构建议";
  return "结构建议";
};

export default function AiCandidatePanel({ projectId, refreshKey = 0 }: AiCandidatePanelProps) {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

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

  const handleAccept = async (id: string) => {
    try {
      await acceptAiCandidate(projectId, id);
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
    if (!candidates.length) return "暂无候选内容";
    return `待处理候选：${candidates.length}`;
  }, [loading, candidates.length]);

  return (
    <div className="mt-6 border border-gray-100 bg-white rounded-2xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="text-sm font-semibold text-gray-800">AI 候选区（阅读与采纳）</div>
          <div className="text-xs text-gray-500 mt-1">{summary}</div>
        </div>
        <button
          type="button"
          onClick={loadCandidates}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <RefreshCcw size={14} />
          刷新
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {error ? <div className="text-xs text-rose-500">{error}</div> : null}
        {!loading && candidates.length === 0 ? (
          <div className="text-xs text-gray-400">暂无候选内容</div>
        ) : null}

        {candidates.map((candidate) => {
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
                    onClick={() => handleAccept(candidate.id)}
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    <Check size={12} />
                    采纳
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(candidate.id)}
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
    </div>
  );
}
