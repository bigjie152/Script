"use client";

import { ChevronRight, Lock, Save, Unlock } from "lucide-react";

type SaveState = "idle" | "saving" | "success" | "error";

interface HeaderProps {
  moduleLabel: string;
  projectTitle: string;
  projectStatusLabel: string;
  truthStatusLabel: string;
  truthLocked: boolean;
  readOnly?: boolean;
  readOnlyReason?: string;
  saveState: SaveState;
  onSave: () => void | Promise<boolean>;
  onBack: () => void;
  structureStatus?: {
    ready: boolean;
    healthy: boolean;
    missingModules: string[];
    needsReviewModules: string[];
    p0IssueCount: number;
  } | null;
  structureError?: string | null;
  onFixStructure?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  moduleLabel,
  projectTitle,
  projectStatusLabel,
  truthStatusLabel,
  truthLocked,
  readOnly = false,
  readOnlyReason,
  saveState,
  onSave,
  onBack,
  structureStatus,
  structureError,
  onFixStructure
}) => {
  const saveLabel =
    saveState === "saving"
      ? "保存中..."
      : saveState === "success"
      ? "已保存"
      : saveState === "error"
      ? "保存失败"
      : "保存";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center text-sm">
          <span className="font-semibold text-gray-800 text-lg">{projectTitle}</span>
          <ChevronRight size={16} className="text-gray-400 mx-2" />
          <span className="text-gray-500">{moduleLabel}</span>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-green-700">{projectStatusLabel}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              truthLocked
                ? "bg-amber-50 border-amber-100 text-amber-700"
                : "bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            {truthLocked ? <Lock size={12} /> : <Unlock size={12} />}
            <span className="text-xs font-medium">真相：{truthStatusLabel}</span>
          </div>

          {readOnly ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700">
              <span className="text-xs font-medium">{readOnlyReason || "只读模式"}</span>
            </div>
          ) : null}
          {structureError ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700">
              <span className="text-xs font-medium">结构状态加载失败</span>
            </div>
          ) : structureStatus && !structureStatus.healthy ? (
            <button
              type="button"
              onClick={onFixStructure}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-xs font-medium">结构未完成</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          type="button"
          onClick={onBack}
        >
          返回工作台
        </button>
        <button
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
          type="button"
          onClick={onSave}
          disabled={saveState === "saving" || readOnly}
        >
          <Save size={16} />
          <span>{saveLabel}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
