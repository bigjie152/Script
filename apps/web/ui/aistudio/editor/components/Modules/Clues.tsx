import { useEffect, useMemo } from "react";
import { FileText, Eye, ShieldCheck, Clock3, Users } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";

type ModuleCollectionState = {
  entries: { id: string; name: string; content: Record<string, unknown>; meta?: Record<string, unknown> }[];
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  setActiveEntry: (entryId: string) => void;
  updateMeta: (entryId: string, meta: Record<string, unknown>) => void;
  save?: () => Promise<boolean>;
};

interface CluesProps {
  collection: ModuleCollectionState;
  entryId?: string;
  onSelectEntry: (entryId: string) => void;
  onCreateEntry: () => void;
  onSave?: () => void;
  readOnly?: boolean;
}

const Clues: React.FC<CluesProps> = ({
  collection,
  entryId,
  onSelectEntry,
  onCreateEntry,
  onSave,
  readOnly = false
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
                  {String(clue.meta?.type ?? "线索")}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{clue.name}</h3>
                  <p className="text-xs text-gray-500">线索描述</p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {(clue.meta?.visibility as string) || "未设置可见范围"}
              </div>
            </button>
          ))}

          <button
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-400"
            type="button"
            onClick={onCreateEntry}
            disabled={readOnly}
          >
            + 添加新线索
          </button>
        </div>
      </div>
    );
  }

  const meta = selectedEntry.meta ?? {};
  const clueType = (meta.type as string) || "物证";
  const visibility = (meta.visibility as string) || "";
  const time = (meta.time as string) || "";
  const truthiness = (meta.truthiness as string) || "真";
  const refRoles = (meta.refRoleIds as string) || "";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-blue-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">线索类型</span>
          </div>
          <select
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={clueType}
            onChange={(event) => updateMeta(selectedEntry.id, { ...meta, type: event.target.value })}
            disabled={readOnly}
          >
            <option value="物证">物证</option>
            <option value="证言">证言</option>
            <option value="场景">场景</option>
            <option value="文件">文件</option>
          </select>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={14} className="text-amber-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">可见范围</span>
          </div>
          <input
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={visibility}
            placeholder="例如：所有角色 / 仅 A 可见"
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, visibility: event.target.value })
            }
            disabled={readOnly}
          />
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">真实性</span>
          </div>
          <select
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={truthiness}
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, truthiness: event.target.value })
            }
            disabled={readOnly}
          >
            <option value="真">真</option>
            <option value="假">假</option>
            <option value="误导">误导</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Clock3 size={14} className="text-indigo-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">出现时机</span>
          </div>
          <input
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={time}
            placeholder="例如：第二轮搜证"
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, time: event.target.value })
            }
            disabled={readOnly}
          />
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-slate-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">关联角色</span>
          </div>
          <input
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={refRoles}
            placeholder="例如：A / B"
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, refRoleIds: event.target.value })
            }
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="font-semibold text-gray-800 text-lg">{selectedEntry.name}</h2>
          <span className="text-xs px-2 py-1 bg-white text-gray-500 rounded border border-gray-200 shadow-sm">
            来源：v1
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <DocumentEditor value={document} onChange={setDocument} onSave={onSave} readonly={readOnly} />
        </div>
      </div>
    </div>
  );
};

export default Clues;
