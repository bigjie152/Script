import { useEffect, useMemo } from "react";
import { Compass, Star, ShieldCheck } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";

type ModuleCollectionState = {
  entries: { id: string; name: string; content: Record<string, unknown>; meta?: Record<string, unknown> }[];
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  setActiveEntry: (entryId: string) => void;
  updateMeta: (entryId: string, meta: Record<string, unknown>) => void;
};

interface CluesProps {
  collection: ModuleCollectionState;
  entryId?: string;
  onSelectEntry: (entryId: string) => void;
  onCreateEntry: () => void;
}

const Clues: React.FC<CluesProps> = ({
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
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">线索库</h2>
        <div className="space-y-4">
          {entries.map((clue) => (
            <button
              key={clue.id}
              className="w-full bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all text-left flex items-center justify-between"
              onClick={() => onSelectEntry(clue.id)}
              type="button"
            >
              <div className="flex items-center gap-4">
                <div className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold">
                  物品
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{clue.name}</h3>
                  <p className="text-xs text-gray-500">线索描述</p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                指向 {String(clue.meta?.pointsTo ?? "未知")}
              </div>
            </button>
          ))}

          <button
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors"
            type="button"
            onClick={onCreateEntry}
          >
            + 添加新线索
          </button>
        </div>
      </div>
    );
  }

  const meta = selectedEntry.meta ?? {};
  const pointsTo = (meta.pointsTo as string) || "";
  const difficulty = (meta.difficulty as string) || "2";
  const reliability = (meta.reliability as string) || "真实线索";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Compass size={14} className="text-blue-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">指向性</span>
          </div>
          <input
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={pointsTo}
            placeholder="例如：陈医生"
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, pointsTo: event.target.value })
            }
          />
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-amber-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">获取难度</span>
          </div>
          <select
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={difficulty}
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, difficulty: event.target.value })
            }
          >
            <option value="1">一星</option>
            <option value="2">二星</option>
            <option value="3">三星</option>
            <option value="4">四星</option>
            <option value="5">五星</option>
          </select>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">真实度</span>
          </div>
          <select
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={reliability}
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, reliability: event.target.value })
            }
          >
            <option value="真实线索">真实线索</option>
            <option value="不确定">不确定</option>
            <option value="虚假线索">虚假线索</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="font-semibold text-gray-800 text-lg">{selectedEntry.name}</h2>
          <span className="text-xs px-2 py-1 bg-white text-gray-500 rounded border border-gray-200 shadow-sm">
            Source: v1
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <DocumentEditor value={document} onChange={setDocument} />
        </div>
      </div>
    </div>
  );
};

export default Clues;
