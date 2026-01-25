import RichEditor from "../RichEditor";
import { ShieldAlert, Users, AlertTriangle } from "lucide-react";

interface ManualProps {
  activeSubId?: string;
}

const Manual: React.FC<ManualProps> = ({ activeSubId }) => {
  const currentChapter = activeSubId === "manual-2" ? "第二幕：破冰环节" : "第一幕：开场致辞";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">开本难度</div>
            <div className="text-lg font-semibold text-gray-800">进阶 (Hard)</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 text-green-600">
            <Users size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">人数限制</div>
            <div className="text-lg font-semibold text-gray-800">5 人固定</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50 text-red-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">核心难点</div>
            <div className="text-lg font-semibold text-gray-800">1 个风险点</div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-800 text-lg">DM 执行手册 - {currentChapter}</h2>
        </div>
        <div className="flex h-full">
          <div className="flex-1 overflow-hidden">
            <RichEditor minHeight="min-h-[420px]" />
          </div>
          <div className="w-60 border-l border-gray-100 bg-gray-50/50 p-4 hidden md:block">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">本章大纲</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="px-2 py-1 rounded bg-indigo-50 text-indigo-600">1. 核心流程</li>
              <li className="px-2 py-1 rounded hover:bg-gray-100">2. 话术建议</li>
              <li className="px-2 py-1 rounded hover:bg-gray-100">3. 常见问题</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manual;
