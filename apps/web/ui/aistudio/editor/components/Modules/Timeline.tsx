import { useEffect, useMemo } from "react";
import { Activity, Clock3, Repeat } from "lucide-react";
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

interface TimelineProps {
  collection: ModuleCollectionState;
  entryId?: string;
  onSelectEntry: (entryId: string) => void;
  onCreateEntry: () => void;
  readOnly?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">时间线</h2>
        <div className="space-y-4">
          {entries.map((item) => (
            <button
              key={item.id}
              className="w-full bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all text-left flex items-center justify-between"
              onClick={() => onSelectEntry(item.id)}
              type="button"
            >
              <div className="flex items-center gap-4">
                <div className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold">
                  时间点
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500">
                    {(item.meta?.timePoint as string) || "未填写时间点"}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {(item.meta?.participants as string) || "未填写参与角色"}
              </div>
            </button>
          ))}

          <button
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-400"
            type="button"
            onClick={onCreateEntry}
            disabled={readOnly}
          >
            + 新增时间线
          </button>
        </div>
      </div>
    );
  }

  const meta = selectedEntry.meta ?? {};
  const timePoint = (meta.timePoint as string) || "";
  const participants = (meta.participants as string) || "";
  const conflicts = (meta.conflicts as string) || "";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Clock3 size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              时间点
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="时间点 18:30 / 夜间"
              value={timePoint}
              onChange={(event) =>
                updateMeta(selectedEntry.id, {
                  ...meta,
                  timePoint: event.target.value
                })
              }
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Activity size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              参与角色
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="角色A / 角色B / 角色C"
              value={participants}
              onChange={(event) =>
                updateMeta(selectedEntry.id, {
                  ...meta,
                  participants: event.target.value
                })
              }
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Repeat size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              冲突提示
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="与其他事件冲突说明"
              value={conflicts}
              onChange={(event) =>
                updateMeta(selectedEntry.id, {
                  ...meta,
                  conflicts: event.target.value
                })
              }
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-100 bg-white overflow-hidden">
        <DocumentEditor value={document} onChange={setDocument} readonly={readOnly} />
      </div>
    </div>
  );
};

export default Timeline;
