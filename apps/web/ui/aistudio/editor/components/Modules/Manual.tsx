import { useEffect, useMemo } from "react";
import { AlertTriangle, BookOpenText, Users } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";

type ModuleCollectionState = {
  entries: { id: string; name: string; meta?: Record<string, unknown> }[];
  activeEntry?: { id: string; name: string; meta?: Record<string, unknown> } | null;
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  setActiveEntry: (entryId: string) => void;
  updateMeta: (entryId: string, meta: Record<string, unknown>) => void;
};

interface ManualProps {
  collection: ModuleCollectionState;
  entryId?: string;
  onSelectEntry: (entryId: string) => void;
  onCreateEntry: () => void;
  readOnly?: boolean;
}

const Manual: React.FC<ManualProps> = ({
  collection,
  entryId,
  onSelectEntry,
  onCreateEntry,
  readOnly = false
}) => {
  const { entries, setActiveEntry, document, setDocument, updateMeta } = collection;

  const selectedEntry = useMemo(() => {
    if (!entryId) return null;
    return entries.find((item) => item.id === entryId) || null;
  }, [entryId, entries]);

  useEffect(() => {
    if (!entryId) return;
    setActiveEntry(entryId);
  }, [entryId, setActiveEntry]);

  if (!selectedEntry) {
    return (
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">DM 手册</h2>
        <div className="space-y-4">
          {entries.map((item) => (
            <button
              key={item.id}
              className="w-full bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all text-left flex items-center justify-between"
              onClick={() => onSelectEntry(item.id)}
              type="button"
            >
              <div className="flex items-center gap-4">
                <div className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold">
                  阶段
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500">
                    {(item.meta?.phase as string) || "未填写阶段"}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {(item.meta?.risks as string) || "未填写风险点"}
              </div>
            </button>
          ))}

          <button
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-400"
            type="button"
            onClick={onCreateEntry}
            disabled={readOnly}
          >
            + 新增 DM 手册
          </button>
        </div>
      </div>
    );
  }

  const meta = selectedEntry.meta ?? {};
  const phase = (meta.phase as string) || "";
  const tips = (meta.tips as string) || "";
  const risks = (meta.risks as string) || "";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <BookOpenText size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              主持阶段
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="开场 / 搜证 / 结案"
              value={phase}
              onChange={(event) =>
                updateMeta(selectedEntry.id, {
                  ...meta,
                  phase: event.target.value
                })
              }
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Users size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              关键提示
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="引导语 / 玩家提示"
              value={tips}
              onChange={(event) =>
                updateMeta(selectedEntry.id, {
                  ...meta,
                  tips: event.target.value
                })
              }
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              风险点
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="容易翻车的环节"
              value={risks}
              onChange={(event) =>
                updateMeta(selectedEntry.id, {
                  ...meta,
                  risks: event.target.value
                })
              }
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-4">
        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-semibold text-gray-800 text-lg">{selectedEntry.name}</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <DocumentEditor value={document} onChange={setDocument} readonly={readOnly} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-600">
          <div className="font-semibold text-gray-800 mb-2">快捷目录</div>
          <div className="space-y-2">
            <div className="px-2 py-1 rounded bg-indigo-50 text-indigo-700">1. 关键节点</div>
            <div className="px-2 py-1 rounded hover:bg-gray-50">2. 风险提示</div>
            <div className="px-2 py-1 rounded hover:bg-gray-50">3. 应急建议</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual;
