"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Eye,
  Users,
  Search,
  Clock,
  BookOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { EditorModuleKey } from "@/types/editorDocument";

export type NavStructure = Partial<
  Record<EditorModuleKey, { id: string; label: string }[]>
>;

interface SidebarProps {
  activeModule: EditorModuleKey;
  activeEntryId?: string;
  onNavigate: (module: EditorModuleKey, entryId?: string) => void;
  onCreateEntry?: (module: EditorModuleKey) => string | null;
  onRenameEntry?: (module: EditorModuleKey, entryId: string, name: string) => Promise<boolean>;
  onDeleteEntry?: (module: EditorModuleKey, entryId: string) => Promise<boolean>;
  structure: NavStructure;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeEntryId,
  onNavigate,
  onCreateEntry,
  onRenameEntry,
  onDeleteEntry,
  structure
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<EditorModuleKey>>(
    new Set(["roles"])
  );
  const [editing, setEditing] = useState<{
    module: EditorModuleKey;
    entryId: string;
    value: string;
  } | null>(null);

  useEffect(() => {
    if (!activeModule) return;
    if (!(["roles", "clues", "timeline", "dm"] as EditorModuleKey[]).includes(activeModule)) return;
    setExpandedModules((prev) => new Set(prev).add(activeModule));
  }, [activeModule]);

  const toggleExpand = (module: EditorModuleKey, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const menuItems = useMemo(
    () => [
      { id: "overview" as const, icon: LayoutDashboard, label: "概览", hasChildren: false },
      { id: "truth" as const, icon: Eye, label: "真相", hasChildren: false },
      { id: "roles" as const, icon: Users, label: "角色", hasChildren: true },
      { id: "clues" as const, icon: Search, label: "线索", hasChildren: true },
      { id: "timeline" as const, icon: Clock, label: "时间线", hasChildren: false },
      { id: "dm" as const, icon: BookOpen, label: "DM 手册", hasChildren: false }
    ],
    []
  );

  const handleCreate = async (module: EditorModuleKey) => {
    const id = onCreateEntry?.(module);
    if (!id) return;
    setEditing({ module, entryId: id, value: "" });
  };

  const handleRenameSubmit = async () => {
    if (!editing) return;
    const nextName = editing.value.trim();
    if (!nextName) {
      setEditing(null);
      return;
    }
    const ok = await onRenameEntry?.(editing.module, editing.entryId, nextName);
    if (ok === false) return;
    setEditing(null);
  };

  return (
    <div className="w-60 bg-white h-screen flex flex-col border-r border-gray-100 shadow-sm z-10 flex-shrink-0">
      <div className="px-5 py-6">
        <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">SF</div>
          ScriptForge
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          项目导航
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const isExpanded = expandedModules.has(item.id as EditorModuleKey);
          const subItems = structure[item.id] || [];
          const hasChildren = item.hasChildren;

          return (
            <div key={item.id} className="mb-1">
              <div
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer group ${
                  isActive && !activeEntryId
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? "text-indigo-600" : "text-gray-400"} />
                  {item.label}
                </div>
                {hasChildren ? (
                  <button
                    onClick={(event) => toggleExpand(item.id, event)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 group-hover:text-gray-600"
                    type="button"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : null}
              </div>

              {hasChildren && isExpanded && (
                <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
                  {subItems.map((sub) => {
                    const isEditing =
                      editing?.entryId === sub.id && editing.module === item.id;
                    return (
                      <div
                        key={sub.id}
                        className={`w-full rounded-md text-[13px] transition-colors flex items-center justify-between group/sub ${
                          activeModule === item.id && activeEntryId === sub.id
                            ? "text-indigo-600 font-medium bg-indigo-50/50"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            className="w-full bg-white border border-indigo-200 rounded-md px-2 py-1 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            placeholder="新条目名称..."
                            value={editing?.value ?? ""}
                            onChange={(event) =>
                              setEditing((prev) =>
                                prev
                                  ? { ...prev, value: event.target.value }
                                  : prev
                              )
                            }
                            onBlur={handleRenameSubmit}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleRenameSubmit();
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                setEditing(null);
                              }
                            }}
                          />
                        ) : (
                          <>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onNavigate(item.id, sub.id);
                              }}
                              className="flex-1 text-left px-2 py-1.5"
                              type="button"
                            >
                              <span className="truncate">{sub.label}</span>
                            </button>
                            <div className="flex items-center gap-1 pr-2 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditing({ module: item.id, entryId: sub.id, value: sub.label });
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDeleteEntry?.(item.id, sub.id);
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  <button
                    className="w-full text-left px-2 py-1.5 rounded-md text-[12px] font-medium text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/30 flex items-center gap-2 transition-colors"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCreate(item.id);
                    }}
                  >
                    <Plus size={12} />
                    <span>新增{item.label}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 text-[13px] text-gray-500 hover:text-gray-700 cursor-pointer">
          <Settings size={16} />
          <span>项目设置</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
