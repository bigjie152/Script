import { Activity, Clock3, Repeat } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";

type ModuleCollectionState = {
  entries: { id: string; name: string; meta?: Record<string, unknown> }[];
  activeEntry?: { id: string; name: string; meta?: Record<string, unknown> } | null;
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  updateMeta: (entryId: string, meta: Record<string, unknown>) => void;
};

interface TimelineProps {
  collection: ModuleCollectionState;
}

const Timeline: React.FC<TimelineProps> = ({ collection }) => {
  const entry = collection.activeEntry ?? collection.entries[0] ?? null;

  if (!entry) {
    return (
      <div className="max-w-5xl mx-auto text-sm text-gray-500">
        暂无时间线内容。
      </div>
    );
  }

  const meta = entry.meta ?? {};
  const duration = (meta.duration as string) || "";
  const density = (meta.density as string) || "";
  const turns = (meta.turns as string) || "";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Clock3 size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              总时长
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：4.5 小时"
              value={duration}
              onChange={(event) =>
                collection.updateMeta(entry.id, {
                  ...meta,
                  duration: event.target.value
                })
              }
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Activity size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              事件密度
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：15 min/node"
              value={density}
              onChange={(event) =>
                collection.updateMeta(entry.id, {
                  ...meta,
                  density: event.target.value
                })
              }
            />
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Repeat size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              关键反转
            </div>
            <input
              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-full"
              placeholder="例如：3 次"
              value={turns}
              onChange={(event) =>
                collection.updateMeta(entry.id, {
                  ...meta,
                  turns: event.target.value
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-100 bg-white overflow-hidden">
        <DocumentEditor value={collection.document} onChange={collection.setDocument} />
      </div>
    </div>
  );
};

export default Timeline;
