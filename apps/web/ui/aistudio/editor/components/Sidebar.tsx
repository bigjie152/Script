"use client";

import { useMemo, useState } from "react";
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
  Plus
} from "lucide-react";
import { EditorModuleKey } from "@/types/editorDocument";

export type NavStructure = Partial<
  Record<EditorModuleKey, { id: string; label: string }[]>
>;

interface SidebarProps {
  activeModule: EditorModuleKey;
  activeEntryId?: string;
  onNavigate: (module: EditorModuleKey, entryId?: string) => void;
  onCreateEntry?: (module: EditorModuleKey) => void;
  structure: NavStructure;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeEntryId,
  onNavigate,
  onCreateEntry,
  structure
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<EditorModuleKey>>(
    new Set(["roles", "clues", "timeline", "dm"])
  );

  const toggleExpand = (module: EditorModuleKey, event: React.MouseEvent) => {
    event.stopPropagation();
    const next = new Set(expandedModules);
    if (next.has(module)) {
      next.delete(module);
    } else {
      next.add(module);
    }
    setExpandedModules(next);
  };

  const menuItems = useMemo(
    () => [
      { id: "overview" as const, icon: LayoutDashboard, label: "概览", hasChildren: false },
      { id: "truth" as const, icon: Eye, label: "真相", hasChildren: false },
      { id: "roles" as const, icon: Users, label: "角色", hasChildren: true },
      { id: "clues" as const, icon: Search, label: "线索", hasChildren: true },
      { id: "timeline" as const, icon: Clock, label: "时间线", hasChildren: true },
      { id: "dm" as const, icon: BookOpen, label: "DM 手册", hasChildren: true }
    ],
    []
  );

  return (
    <div className="w-64 bg-white h-screen flex flex-col border-r border-gray-100 shadow-sm z-10 flex-shrink-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">SF</div>
          ScriptForge
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">项目导航</div>
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group ${
                  isActive && !activeEntryId
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
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
                <div className="ml-9 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
                  {subItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onNavigate(item.id, sub.id);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group/sub ${
                        activeModule === item.id && activeEntryId === sub.id
                          ? "text-indigo-600 font-medium bg-indigo-50/50"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      type="button"
                    >
                      <span className="truncate">{sub.label}</span>
                    </button>
                  ))}

                  <button
                    className="w-full text-left px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/30 flex items-center gap-2 transition-colors"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCreateEntry?.(item.id);
                    }}
                  >
                    <Plus size={12} />
                    <span>添加{item.label}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
          <Settings size={18} />
          <span>全局设置</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
