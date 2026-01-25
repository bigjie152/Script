"use client";

import { useState } from "react";
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
} from "lucide-react";
import { ModuleType } from "../types/types";

export interface NavStructure {
  [key: string]: { id: string; label: string }[];
}

interface SidebarProps {
  activeModule: ModuleType;
  activeSubId?: string;
  onNavigate: (module: ModuleType, subId?: string) => void;
  structure: NavStructure;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, activeSubId, onNavigate, structure }) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set([ModuleType.Characters, ModuleType.Clues, ModuleType.Timeline, ModuleType.Manual])
  );

  const toggleExpand = (module: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSet = new Set(expandedModules);
    if (newSet.has(module)) {
      newSet.delete(module);
    } else {
      newSet.add(module);
    }
    setExpandedModules(newSet);
  };

  const menuItems = [
    { id: ModuleType.Overview, icon: LayoutDashboard, label: "概览", hasChildren: false },
    { id: ModuleType.Truth, icon: Eye, label: "真相", hasChildren: false },
    { id: ModuleType.Characters, icon: Users, label: "角色", hasChildren: true },
    { id: ModuleType.Clues, icon: Search, label: "线索", hasChildren: true },
    { id: ModuleType.Timeline, icon: Clock, label: "时间线", hasChildren: true },
    { id: ModuleType.Manual, icon: BookOpen, label: "DM 手册", hasChildren: true },
  ];

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
          const isExpanded = expandedModules.has(item.id);
          const subItems = structure[item.id] || [];
          const hasChildren = item.hasChildren;

          return (
            <div key={item.id} className="mb-1">
              <div
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group ${
                  isActive && !activeSubId
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
                  {item.label}
                </div>
                {hasChildren && (
                  <button
                    onClick={(event) => toggleExpand(item.id, event)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 group-hover:text-gray-600"
                    type="button"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
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
                        activeModule === item.id && activeSubId === sub.id
                          ? "text-indigo-600 font-medium bg-indigo-50/50"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      type="button"
                    >
                      <span className="truncate">{sub.label}</span>
                    </button>
                  ))}

                  <button className="w-full text-left px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/30 flex items-center gap-2 transition-colors" type="button">
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
