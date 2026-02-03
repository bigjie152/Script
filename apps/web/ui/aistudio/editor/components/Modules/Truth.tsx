import { Calendar, Database, GitCommit, Lock, ShieldCheck, Unlock } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { MentionItem } from "@/editors/tiptap/mentionSuggestion";
import type { EditorDocument } from "@/types/editorDocument";
import AiTriggerButton from "../AiTriggerButton";

type TruthState = {
  truth: { status: string; updatedAt?: string | null } | null;
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  locked: boolean;
  lock: () => Promise<unknown>;
  unlock: () => Promise<unknown>;
};

interface TruthProps {
  truthState: TruthState;
  latestSnapshotId?: string | null;
  mentionItems: MentionItem[];
  onMentionClick: (item: MentionItem) => void;
  readOnly?: boolean;
  aiTriggerVisible?: boolean;
  aiTriggerDisabledReason?: string | null;
  onAiTrigger?: () => void;
  aiDraftActive?: boolean;
  aiOverlay?: React.ReactNode;
}

const Truth: React.FC<TruthProps> = ({
  truthState,
  latestSnapshotId,
  mentionItems,
  onMentionClick,
  readOnly = false,
  aiTriggerVisible,
  aiTriggerDisabledReason,
  onAiTrigger,
  aiDraftActive,
  aiOverlay
}) => {
  const isLocked = truthState.locked;
  const isReadOnly = readOnly || isLocked;
  const snapshotLabel = latestSnapshotId || "v0.1";

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-5 p-1">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-xs text-gray-400 uppercase font-semibold mb-1 tracking-wider">
            最新快照
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-800 font-medium">
              <GitCommit size={16} className="text-indigo-500" />
              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{snapshotLabel}</span>
            </div>
            <span className="text-[10px] text-gray-400">SHA-29F8</span>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl shadow-sm border flex flex-col justify-between transition-colors ${
            isLocked ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
          }`}
        >
          <span
            className={`text-xs uppercase font-semibold mb-1 tracking-wider ${
              isLocked ? "text-amber-600" : "text-gray-400"
            }`}
          >
            {isLocked ? "锁定时间" : "当前状态"}
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <Calendar size={16} className={isLocked ? "text-amber-600" : "text-gray-400"} />
              <span className={isLocked ? "text-amber-900" : "text-gray-800"}>
                {isLocked ? truthState.truth?.updatedAt || "已锁定" : "草稿中"}
              </span>
            </div>
            <button
              onClick={() => (isLocked ? truthState.unlock() : truthState.lock())}
              className={`p-1.5 rounded-full transition-colors ${
                isLocked
                  ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              title={isLocked ? "点击解锁" : "点击锁定"}
              type="button"
              disabled={readOnly}
            >
              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          </div>
        </div>
      </section>

      <section className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Database size={18} className="text-indigo-600" />
            真理源 (Single Source of Truth)
          </h2>
          <div className="flex items-center gap-2">
            {isLocked && (
              <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                内容已锁定，作为派生源
              </div>
            )}
            {aiTriggerVisible && onAiTrigger ? (
              <AiTriggerButton
                onClick={onAiTrigger}
                disabled={Boolean(aiTriggerDisabledReason)}
                disabledReason={aiTriggerDisabledReason}
              />
            ) : null}
          </div>
        </div>

        <div
          className={`relative flex-1 rounded-xl overflow-hidden transition-all duration-300 border ${
            isLocked ? "border-amber-200 bg-amber-50/30" : "border-slate-100"
          } ${aiDraftActive ? "ring-2 ring-indigo-300 border-indigo-200" : ""}`}
        >
          {aiOverlay}
          <DocumentEditor
            value={truthState.document}
            onChange={truthState.setDocument}
            readonly={isReadOnly}
            mentionItems={mentionItems}
            onMentionClick={onMentionClick}
          />
        </div>

        {isLocked && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center opacity-[0.03]">
            <ShieldCheck size={260} />
          </div>
        )}
      </section>
    </div>
  );
};

export default Truth;
