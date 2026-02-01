"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, Lock, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { getStructureStatus, listImpactReports, ImpactReportItem, listIssues, IssueItem } from "@/services/projectApi";
import { deriveCandidatesStream, listAiCandidates, CandidateItem, runLogicCheck } from "@/services/aiApi";

interface RightPanelProps {
  projectId?: string;
  onCandidatesUpdated?: () => void;
  onStreamUpdate?: (draft: { active: boolean; target?: string; text: string } | null) => void;
}

type StructureStatus = {
  ready: boolean;
  healthy: boolean;
  missingModules: string[];
  needsReviewModules: string[];
  p0IssueCount: number;
};

const RightPanel: React.FC<RightPanelProps> = ({
  projectId,
  onCandidatesUpdated,
  onStreamUpdate
}) => {
  const params = useParams();
  const resolvedProjectId =
    projectId || (typeof params?.projectId === "string" ? params.projectId : "");
  const [activeTab, setActiveTab] = useState<"canvas" | "issues">("canvas");
  const currentModule = typeof params?.module === "string" ? params.module : "";

  const [structure, setStructure] = useState<StructureStatus | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [reports, setReports] = useState<ImpactReportItem[]>([]);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState("story");
  const [aiIntent, setAiIntent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [aiStreaming, setAiStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesVersion, setIssuesVersion] = useState(0);

  useEffect(() => {
    if (!resolvedProjectId) return;
    let alive = true;
    async function run() {
      try {
        const result = await getStructureStatus(resolvedProjectId);
        if (!alive) return;
        setStructure(result);
        setStructureError(null);
      } catch (err) {
        if (!alive) return;
        setStructureError(err instanceof Error ? err.message : "加载结构状态失败");
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [resolvedProjectId]);

  useEffect(() => {
    if (!aiLoading) return;
    setAiProgress(10);
    const timer = window.setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= 90) return prev;
        const bump = Math.max(2, Math.round(Math.random() * 6));
        return Math.min(90, prev + bump);
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [aiLoading]);

  useEffect(() => {
    if (!resolvedProjectId) return;
    let alive = true;
    async function run() {
      try {
        const result = await listImpactReports(resolvedProjectId);
        if (!alive) return;
        setReports(result.reports || []);
        setReportsError(null);
      } catch (err) {
        if (!alive) return;
        setReportsError(err instanceof Error ? err.message : "加载影响分析失败");
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [resolvedProjectId]);

  useEffect(() => {
    if (!resolvedProjectId) return;
    let alive = true;
    async function run() {
      try {
        const result = await listAiCandidates(resolvedProjectId, "pending");
        if (!alive) return;
        setCandidates(result.candidates || []);
        setAiError(null);
      } catch (err) {
        if (!alive) return;
        setAiError(err instanceof Error ? err.message : "加载候选区失败");
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [resolvedProjectId]);

  useEffect(() => {
    if (!resolvedProjectId) return;
    let alive = true;
    async function run() {
      setIssuesLoading(true);
      try {
        const result = await listIssues(resolvedProjectId);
        if (!alive) return;
        setIssues(result.issues || []);
        setIssuesError(null);
      } catch (err) {
        if (!alive) return;
        setIssuesError(err instanceof Error ? err.message : "加载审查问题失败");
      } finally {
        if (alive) setIssuesLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [resolvedProjectId, issuesVersion]);

  const structureLabel = useMemo(() => {
    if (!structure) return "未加载";
    if (structure.healthy) return "结构健康";
    if (structure.ready) return "结构齐全";
    return "结构未齐全";
  }, [structure]);

  const structureAlert = Boolean(structure && !structure.healthy);

  const targetLabel = (target: string) => {
    if (target === "role") return "角色剧本生成";
    if (target === "clue") return "线索结构生成";
    if (target === "timeline") return "时间线生成";
    if (target === "dm") return "DM 手册生成";
    if (target === "story") return "故事剧情生成";
    if (target === "insight") return "真相生成";
    return "真相生成";
  };

  const runDerive = async () => {
    if (!resolvedProjectId || aiLoading || aiStreaming) return;
    setAiLoading(true);
    setAiError(null);
    setAiNotice(null);
    const targetMap: Record<string, string> = {
      outline: "truth",
      worldcheck: "truth",
      story: "story",
      role: "roles",
      clue: "clues",
      timeline: "timeline",
      dm: "dm"
    };
    const moduleLabelMap: Record<string, string> = {
      truth: "Truth",
      story: "故事",
      roles: "角色",
      clues: "线索",
      timeline: "时间线",
      dm: "DM 手册"
    };
    const targetModule = targetMap[aiAction] || "";
    const controller = new AbortController();
    abortRef.current = controller;
    setAiStreaming(true);
    onStreamUpdate?.({ active: true, target: aiAction, text: "" });
    let streamText = "";
    try {
      await deriveCandidatesStream(
        resolvedProjectId,
        {
          actionType: aiAction,
          intent: aiIntent || undefined
        },
        {
          signal: controller.signal,
          onDelta: (delta) => {
            streamText += delta;
            onStreamUpdate?.({ active: true, target: aiAction, text: streamText });
          },
          onDone: (result) => {
            setCandidates((prev) => [...result.candidates, ...prev]);
            const noticeBase = `已生成候选内容（${result.provider}/${result.model}）。`;
            const targetLabel = moduleLabelMap[targetModule] || "对应模块";
            const crossModuleNotice =
              targetModule && currentModule && targetModule !== currentModule
                ? `请到 ${targetLabel} 模块查看。`
                : "请在候选区采纳或拒绝。";
            setAiNotice(`${noticeBase} ${crossModuleNotice}`);
            setAiIntent("");
            onCandidatesUpdated?.();
            onStreamUpdate?.(null);
          },
          onError: (message) => {
            setAiError(message || "AI 生成失败，请稍后重试");
            onStreamUpdate?.(null);
          }
        }
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI 生成失败，请稍后重试");
      onStreamUpdate?.(null);
    } finally {
      setAiProgress(100);
      window.setTimeout(() => setAiProgress(0), 800);
      setAiLoading(false);
      setAiStreaming(false);
      abortRef.current = null;
    }
  };

  const stopDerive = () => {
    if (!abortRef.current) return;
    abortRef.current.abort();
    setAiStreaming(false);
    setAiNotice("已中断生成");
    onStreamUpdate?.(null);
  };

  const handleLogicCheck = async () => {
    if (!resolvedProjectId || issuesLoading) return;
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      await runLogicCheck(resolvedProjectId);
      setAiNotice("AI 逻辑审查已完成。");
      setIssuesVersion((v) => v + 1);
    } catch (err) {
      setIssuesError(err instanceof Error ? err.message : "AI 逻辑审查失败");
    } finally {
      setIssuesLoading(false);
    }
  };

  const reportSummary = (report: ImpactReportItem) => {
    const affected = report.affectedItems as {
      totalModules?: number;
      modules?: { module: string }[];
    };
    const total = affected?.totalModules ?? affected?.modules?.length ?? 0;
    return total > 0 ? `影响 ${total} 个模块` : "无影响模块";
  };

  const formatTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  return (
    <div className="w-72 bg-white border-l border-gray-100 h-screen flex flex-col shadow-sm z-10">
      <div className="flex p-2 gap-2 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("canvas")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "canvas"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          type="button"
        >
          AI 画板
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "issues"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            审查与结构
            {structureAlert ? <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span> : null}
          </span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "canvas" ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">Truth 核心控制</h3>
                <Lock size={14} className="text-amber-500" />
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                当前状态：<span className="font-medium text-gray-900">已锁定（Locked）</span>
                <br />
                当前真相已锁定，派生内容将基于此版本。
              </p>
              <button
                className="w-full py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                type="button"
              >
                核对真相
              </button>
            </div>

            <div className="h-px bg-gray-100"></div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-500" />
                  AI 写作助手
                </h3>
                <span className="text-[10px] text-gray-400">候选区（主编辑区查看）</span>
              </div>
              <div className="space-y-2">
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white"
                  value={aiAction}
                  onChange={(event) => setAiAction(event.target.value)}
                >
                  <option value="outline">真相（Truth）生成</option>
                  <option value="worldcheck">设定漏洞检查</option>
                  <option value="story">故事剧情生成</option>
                  <option value="role">角色剧本生成</option>
                  <option value="clue">线索结构生成</option>
                  <option value="timeline">时间线生成</option>
                  <option value="dm">DM 手册生成</option>
                </select>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 min-h-[70px] resize-none"
                  placeholder="补充意图（可选）"
                  value={aiIntent}
                  onChange={(event) => setAiIntent(event.target.value)}
                />
                <button
                  type="button"
                  onClick={runDerive}
                  disabled={aiLoading || aiStreaming}
                  className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {aiLoading || aiStreaming
                    ? `生成中... ${Math.min(99, aiProgress || 0)}%`
                    : "生成候选"}
                </button>
                {aiStreaming ? (
                  <button
                    type="button"
                    onClick={stopDerive}
                    className="w-full py-2 rounded-lg border border-rose-200 text-rose-600 text-xs font-medium hover:bg-rose-50"
                  >
                    停止生成
                  </button>
                ) : null}
                {aiLoading || aiProgress > 0 ? (
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${aiProgress}%` }}
                    />
                  </div>
                ) : null}
                {aiError ? <div className="text-xs text-rose-500">{aiError}</div> : null}
                {aiNotice ? <div className="text-xs text-emerald-600">{aiNotice}</div> : null}
              </div>
              <div className="space-y-2">
                {candidates.length === 0 ? (
                  <div className="text-xs text-gray-400">暂无候选内容，请在主编辑区查看与处理。</div>
                ) : (
                  <div className="text-xs text-gray-500">
                    当前待处理候选：{candidates.length} 条（请在主编辑区阅读与采纳）
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">结构状态</h3>
                {structure?.healthy ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-500" />
                )}
              </div>
              <div className="text-xs text-gray-600">当前：{structureLabel}</div>
              {structureError ? (
                <div className="mt-2 text-xs text-rose-500">{structureError}</div>
              ) : null}
              {structure ? (
                <div className="mt-3 space-y-2 text-xs text-gray-500">
                  <div>缺失模块：{structure.missingModules.length ? structure.missingModules.join(" / ") : "无"}</div>
                  <div>待复查模块：{structure.needsReviewModules.length ? structure.needsReviewModules.join(" / ") : "无"}</div>
                  <div>P0 问题数：{structure.p0IssueCount}</div>
                </div>
              ) : null}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">AI 逻辑审查</h3>
                <button
                  type="button"
                  onClick={handleLogicCheck}
                  disabled={issuesLoading}
                  className="text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
                >
                  {issuesLoading ? "审查中..." : "运行审查"}
                </button>
              </div>
              {issuesError ? <div className="text-xs text-rose-500">{issuesError}</div> : null}
              {issues.length === 0 ? (
                <div className="text-xs text-gray-400">暂无审查问题</div>
              ) : (
                <div className="space-y-2">
                  {issues.slice(0, 3).map((issue) => (
                    <div key={issue.id} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-2">
                      <div className="text-xs text-gray-700">
                        {issue.severity} · {issue.title}
                      </div>
                      {issue.description ? (
                        <div className="text-[10px] text-gray-500 mt-1">{issue.description}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">影响分析</h3>
              {reportsError ? (
                <div className="text-xs text-rose-500">{reportsError}</div>
              ) : reports.length === 0 ? (
                <div className="text-xs text-gray-400">暂无影响分析记录</div>
              ) : (
                <div className="space-y-2">
                  {reports.slice(0, 3).map((report) => (
                    <div key={report.id} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-2">
                      <div className="text-xs text-gray-700">{reportSummary(report)}</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {formatTime(report.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center text-gray-400 py-6">
              <HelpCircle size={28} className="mb-2 opacity-50" />
              <span className="text-xs">暂无更多审查内容</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
