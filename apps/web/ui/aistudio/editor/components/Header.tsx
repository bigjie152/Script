"use client";

import { ChevronRight, Lock, Unlock, Save } from "lucide-react";
import { ModuleType, ProjectStatus, TruthStatus } from "../types/types";

interface HeaderProps {
  module: ModuleType;
  projectStatus: ProjectStatus;
  truthStatus: TruthStatus;
  scriptTitle: string;
}

const Header: React.FC<HeaderProps> = ({ module, projectStatus, truthStatus, scriptTitle }) => {
  const isTruthLocked = truthStatus === TruthStatus.Locked;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center text-sm">
          <span className="font-semibold text-gray-800 text-lg">{scriptTitle}</span>
          <ChevronRight size={16} className="text-gray-400 mx-2" />
          <span className="text-gray-500">{module}</span>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-green-700">{projectStatus}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              isTruthLocked ? "bg-amber-50 border-amber-100 text-amber-700" : "bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            {isTruthLocked ? <Lock size={12} /> : <Unlock size={12} />}
            <span className="text-xs font-medium">真相：{truthStatus}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="text-sm text-gray-500 hover:text-indigo-600 transition-colors" type="button">
          返回 Workspace
        </button>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm" type="button">
          <Save size={16} />
          <span>保存</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
