"use client";

import { Check, RefreshCcw, X, Sparkles, Loader2 } from "lucide-react";

export type AiDraftMode = "append" | "replace";

export type AiDraftOverlayProps = {
  promptOpen: boolean;
  prompt: string;
  mode: AiDraftMode;
  isGenerating: boolean;
  streaming?: boolean;
  draftActive: boolean;
  error?: string | null;
  notice?: string | null;
  onPromptChange: (value: string) => void;
  onPromptSubmit: () => void;
  onPromptCancel: () => void;
  onModeChange: (mode: AiDraftMode) => void;
  onAccept: () => void;
  onRetry: () => void;
  onDiscard: () => void;
};

const AiDraftOverlay: React.FC<AiDraftOverlayProps> = ({
  promptOpen,
  prompt,
  mode,
  isGenerating,
  streaming = false,
  draftActive,
  error,
  notice,
  onPromptChange,
  onPromptSubmit,
  onPromptCancel,
  onModeChange,
  onAccept,
  onRetry,
  onDiscard
}) => {
  return (
    <>
      {promptOpen && !isGenerating ? (
        <div className="absolute inset-x-4 top-4 z-20">
          <div className="rounded-2xl border border-indigo-200 bg-white/95 shadow-lg backdrop-blur px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold">
                <Sparkles size={14} />
                AI 生成/续写
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 p-1 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => onModeChange("append")}
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    mode === "append"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  续写
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("replace")}
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    mode === "replace"
                      ? "bg-rose-500 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  覆盖
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                className="flex-1 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="输入提示词，回车开始生成"
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onPromptSubmit();
                  }
                }}
              />
              <button
                type="button"
                onClick={onPromptSubmit}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                生成
              </button>
              <button
                type="button"
                onClick={onPromptCancel}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50"
              >
                取消
              </button>
            </div>
            {error ? <div className="mt-2 text-xs text-rose-500">{error}</div> : null}
          </div>
        </div>
      ) : null}

      {isGenerating ? (
        streaming ? (
          <div className="absolute right-4 top-4 z-30">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-md border border-slate-100 text-xs text-slate-600">
              <Loader2 size={14} className="animate-spin text-indigo-500" />
              正在实时生成…
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/65 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg border border-slate-100">
              <Loader2 size={18} className="animate-spin text-indigo-500" />
              <span className="text-sm text-slate-600 font-medium">AI 正在思考…</span>
            </div>
          </div>
        )
      ) : null}

      {draftActive && !isGenerating ? (
        <>
          <div className="absolute left-4 top-4 z-10 rounded-full bg-indigo-600/90 px-3 py-1 text-[11px] text-white shadow">
            AI 草稿中
          </div>
          {notice ? (
            <div className="absolute right-4 bottom-16 z-20 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 shadow-sm">
              {notice}
            </div>
          ) : null}
          <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg border border-slate-100">
              <button
                type="button"
                onClick={onAccept}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600"
              >
                <Check size={14} />
                采纳
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <RefreshCcw size={14} />
                重试
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                <X size={14} />
                放弃
              </button>
            </div>
          </div>
        </>
      ) : null}

      {!draftActive && notice ? (
        <div className="absolute right-4 bottom-4 z-20 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 border border-emerald-100 shadow-sm">
          {notice}
        </div>
      ) : null}
    </>
  );
};

export default AiDraftOverlay;
