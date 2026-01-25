import { useEffect, useMemo } from "react";
import { Lock, Sparkles, Target, User } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";

type ModuleCollectionState = {
  entries: { id: string; name: string; content: Record<string, unknown>; meta?: Record<string, unknown> }[];
  activeEntryId: string | null;
  activeEntry?: { id: string; name: string; content: Record<string, unknown>; meta?: Record<string, unknown> } | null;
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  setActiveEntry: (entryId: string) => void;
};

interface RolesProps {
  collection: ModuleCollectionState;
  entryId?: string;
  onSelectEntry: (entryId: string) => void;
  onCreateEntry: () => void;
}

const Roles: React.FC<RolesProps> = ({
  collection,
  entryId,
  onSelectEntry,
  onCreateEntry
}) => {
  const { entries, activeEntry, setActiveEntry, document, setDocument } = collection;

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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">角色概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((role) => (
            <button
              key={role.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all text-left"
              onClick={() => onSelectEntry(role.id)}
              type="button"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {role.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{role.name}</h3>
                  <span className="text-xs text-gray-500">
                    {(role.meta?.motivation as string) || "未设置"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">剧本进度</span>
                  <span className="text-indigo-600 font-medium">85%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-indigo-500 rounded-full"></div>
                </div>
              </div>
            </button>
          ))}

          <button
            className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors min-h-[180px]"
            type="button"
            onClick={onCreateEntry}
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
              <span className="text-2xl font-light">+</span>
            </div>
            <span className="text-sm font-medium">创建新角色</span>
          </button>
        </div>
      </div>
    );
  }

  const motivation = (selectedEntry.meta?.motivation as string) || "复仇";
  const knownTruth = (selectedEntry.meta?.knownTruth as string) || "40%";
  const secretCount = (selectedEntry.meta?.secretCount as string) || "3 个核心秘密";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-red-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">核心动机</span>
          </div>
          <div className="font-semibold text-gray-800 text-lg">{motivation}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-purple-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">已知真相</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[40%] rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-purple-700">{knownTruth}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Lock size={48} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-amber-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">秘密数量</span>
          </div>
          <div className="font-semibold text-gray-800 text-lg">{secretCount}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-800 text-lg">{selectedEntry.name} 个人剧本</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-white text-gray-500 rounded border border-gray-200 shadow-sm">
              Source: v1
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <DocumentEditor value={document} onChange={setDocument} />
        </div>
      </div>
    </div>
  );
};

export default Roles;
