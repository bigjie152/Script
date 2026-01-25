"use client";

import { useState } from "react";
import { HelpCircle, Lock } from "lucide-react";
import ImageEditor from "./ImageEditor";

const RightPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"canvas" | "issues">("canvas");

  return (
    <div className="w-72 bg-white border-l border-gray-100 h-screen flex flex-col shadow-sm z-10">
      <div className="flex p-2 gap-2 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("canvas")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "canvas"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          type="button"
        >
          AI 画板
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "issues"
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50"
          }`}
          type="button"
        >
          问题列表
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "canvas" ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">Truth 核心控制</h3>
                <Lock size={14} className="text-amber-500" />
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                当前状态：<span className="font-medium text-gray-900">已锁定（Locked）</span>
                <br />
                当前真相已锁定，角色剧本生成将基于此版本。
              </p>
              <button
                className="w-full py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                type="button"
              >
                核对真相
              </button>
            </div>

            <div className="h-px bg-gray-100"></div>

            <ImageEditor />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <HelpCircle size={32} className="mb-2 opacity-50" />
            <span className="text-sm">暂无待解决问题</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
