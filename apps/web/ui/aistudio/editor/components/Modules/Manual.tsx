import { AlertTriangle, BookOpenText, Users } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";

type ModuleCollectionState = {
  entries: { id: string; name: string; meta?: Record<string, unknown> }[];
  activeEntry?: { id: string; name: string; meta?: Record<string, unknown> } | null;
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  updateMeta: (entryId: string, meta: Record<string, unknown>) => void;
};

interface ManualProps {
  collection: ModuleCollectionState;
}

const Manual: React.FC<ManualProps> = ({ collection }) => {
  const entry = collection.activeEntry ?? collection.entries[0] ?? null;

  if (!entry) {
    return (
      <div className="max-w-5xl mx-auto text-sm text-gray-500">
        暂无 DM 手册内容。
      </div>
    );
  }

  const meta = entry.meta ?? {};
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
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              开场难度
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：进阶"
              value={difficulty}
              onChange={(event) =>
                collection.updateMeta(entry.id, {
                  ...meta,
                  difficulty: event.target.value
                })
              }
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Users size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              人数限制
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：5 人"
              value={players}
              onChange={(event) =>
                collection.updateMeta(entry.id, {
                  ...meta,
                  players: event.target.value
                })
              }
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              核心难点
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：1 个风险点"
              value={risks}
              onChange={(event) =>
                collection.updateMeta(entry.id, {
                  ...meta,
                  risks: event.target.value
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-4">
        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-semibold text-gray-800 text-lg">{entry.name}</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <DocumentEditor value={collection.document} onChange={collection.setDocument} />
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
