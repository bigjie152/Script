import { useEffect, useMemo, useState } from "react";
import { Lock, Sparkles, Target, User, Pencil, Check, X } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";

type ModuleCollectionState = {
  entries: { id: string; name: string; content: Record<string, unknown>; meta?: Record<string, unknown> }[];
  activeEntryId: string | null;
  activeEntry?: { id: string; name: string; content: Record<string, unknown>; meta?: Record<string, unknown> } | null;
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  setActiveEntry: (entryId: string) => void;
  updateMeta: (entryId: string, meta: Record<string, unknown>) => void;
};

interface RolesProps {
  collection: ModuleCollectionState;
  entryId?: string;
  onSelectEntry: (entryId: string) => void;
  onCreateEntry: () => void;
  onRenameEntry: (entryId: string, name: string) => Promise<boolean>;
}

const Roles: React.FC<RolesProps> = ({
  collection,
  entryId,
  onSelectEntry,
  onCreateEntry,
  onRenameEntry
}) => {
  const {
    entries,
    activeEntry,
    setActiveEntry,
    document,
    setDocument,
    updateMeta
  } = collection;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const selectedEntry = useMemo(() => {
    if (!entryId) return null;
    return entries.find((entry) => entry.id === entryId) || null;
  }, [entryId, entries]);

  useEffect(() => {
    if (!entryId) return;
    setActiveEntry(entryId);
  }, [entryId, setActiveEntry]);

  const beginRename = (entryId: string, name: string) => {
    setEditingId(entryId);
    setNameDraft(name);
  };

  const commitRename = async () => {
    if (!editingId) return;
    const nextName = nameDraft.trim();
    if (nextName) await onRenameEntry(editingId, nextName);
    setEditingId(null);
  };

  if (!selectedEntry) {
    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">角色概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((role) => (
            <div
              key={role.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
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
                <button
                  type="button"
                  className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => beginRename(role.id, role.name)}
                >
                  <Pencil size={14} />
                </button>
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
              <button
                className="mt-4 text-xs text-indigo-600 font-medium"
                type="button"
                onClick={() => onSelectEntry(role.id)}
              >
                进入剧本
              </button>
            </div>
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

        {editingId && (
          <div className="mt-6 max-w-md">
            <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 shadow-sm">
              <input
                className="flex-1 text-sm text-gray-700 focus:outline-none"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                placeholder="角色名称"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitRename();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setEditingId(null);
                  }
                }}
              />
              <button type="button" onClick={commitRename} className="text-indigo-600">
                <Check size={16} />
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="text-gray-400">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const meta = selectedEntry.meta ?? {};
  const motivation = (meta.motivation as string) || "";
  const knownTruth = (meta.knownTruth as string) || "无所知 (Low)";
  const secretCount = (meta.secretCount as string) || "";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-red-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">核心动机</span>
          </div>
          <input
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={motivation}
            placeholder="例如：复仇"
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, motivation: event.target.value })
            }
          />
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-purple-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">已知真相</span>
          </div>
          <select
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={knownTruth}
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, knownTruth: event.target.value })
            }
          >
            <option value="无所知 (Low)">无所知 (Low)</option>
            <option value="部分知晓 (Mid)">部分知晓 (Mid)</option>
            <option value="完全知晓 (High)">完全知晓 (High)</option>
          </select>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Lock size={40} />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-amber-500" />
            <span className="text-[11px] uppercase text-gray-400 font-semibold tracking-wider">秘密数量</span>
          </div>
          <input
            className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
            value={secretCount}
            placeholder="例如：3"
            onChange={(event) =>
              updateMeta(selectedEntry.id, { ...meta, secretCount: event.target.value })
            }
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          {editingId === selectedEntry.id ? (
            <input
              className="flex-1 text-lg font-semibold text-gray-800 bg-transparent focus:outline-none"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitRename();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setEditingId(null);
                }
              }}
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800 text-lg">{selectedEntry.name}</h2>
              <button
                type="button"
                className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                onClick={() => beginRename(selectedEntry.id, selectedEntry.name)}
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
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

export default Roles;
