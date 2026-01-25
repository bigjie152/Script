import { useEffect, useMemo } from "react";
import { AlertTriangle, BookOpenText, Users } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";

type ModuleCollectionState = {
  entries: { id: string; name: string; content: Record<string, unknown>; meta?: Record<string, unknown> }[];
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
}

const Manual: React.FC<ManualProps> = ({
  collection,
  entryId,
  onSelectEntry,
  onCreateEntry
}) => {
  const { entries, setActiveEntry, document, setDocument, updateMeta } = collection;

  const selectedEntry = useMemo(() => {
    if (!entryId) return null;
    return entries.find((entry) => entry.id === entryId) || null;
  }, [entryId, entries]);

  useEffect(() => {
    if (!entryId) return;
    setActiveEntry(entryId);
  }, [entryId, setActiveEntry]);

  if (!selectedEntry) {
    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">DM 手册目录</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <button
              key={entry.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all text-left"
              onClick={() => onSelectEntry(entry.id)}
              type="button"
            >
              <h3 className="font-bold text-gray-900">{entry.name}</h3>
              <p className="text-xs text-gray-500">点击进入章节内容</p>
            </button>
          ))}
          <button
            className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors min-h-[160px]"
            type="button"
            onClick={onCreateEntry}
          >
            + 添加 DM 章节
          </button>
        </div>
      </div>
    );
  }

  const meta = selectedEntry.meta ?? {};
  const difficulty = (meta.difficulty as string) || "";
  const players = (meta.players as string) || "";
  const risks = (meta.risks as string) || "";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <BookOpenText size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">开本难度</div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：进阶"
              value={difficulty}
              onChange={(event) =>
                updateMeta(selectedEntry.id, { ...meta, difficulty: event.target.value })
              }
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Users size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">人数限制</div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：5 人"
              value={players}
              onChange={(event) =>
                updateMeta(selectedEntry.id, { ...meta, players: event.target.value })
              }
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">核心难点</div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：1 个风险点"
              value={risks}
              onChange={(event) =>
                updateMeta(selectedEntry.id, { ...meta, risks: event.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-4">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-semibold text-gray-800 text-lg">{selectedEntry.name}</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <DocumentEditor value={document} onChange={setDocument} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-600">
          <div className="font-semibold text-gray-800 mb-2">本章大纲</div>
          <div className="space-y-2">
            <div className="px-2 py-1 rounded bg-indigo-50 text-indigo-700">1. 核心流程</div>
            <div className="px-2 py-1 rounded hover:bg-gray-50">2. 话术建议</div>
            <div className="px-2 py-1 rounded hover:bg-gray-50">3. 常见问题</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual;
