import { useState } from "react";
import { ScriptMetadata } from "../../types/types";
import RichEditor from "../RichEditor";
import { Users, GitBranch, ChevronDown } from "lucide-react";

interface OverviewProps {
  metadata: ScriptMetadata;
}

const Overview: React.FC<OverviewProps> = ({ metadata: initialMetadata }) => {
  const [metadata] = useState(initialMetadata);

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-6 p-1">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-colors">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-semibold mb-1 tracking-wider">项目类型</span>
            <div className="flex items-center gap-2 text-gray-800 font-medium">
              <span className="text-lg">{metadata.genre}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
            <ChevronDown size={16} className="text-gray-400 group-hover:text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-colors">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-semibold mb-1 tracking-wider">人数</span>
            <div className="flex items-center gap-2 text-gray-800 font-medium">
              <Users size={18} className="text-gray-400" />
              <span className="text-lg">{metadata.playerCount} 人</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
            <ChevronDown size={16} className="text-gray-400 group-hover:text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-colors">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase font-semibold mb-1 tracking-wider">当前版本</span>
            <div className="flex items-center gap-2 text-gray-800 font-medium">
              <GitBranch size={18} className="text-gray-400" />
              <span className="text-lg text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm">{metadata.version}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1 self-end">上次更新：2小时前</div>
        </div>
      </section>

      <section className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">剧本简介</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">Core</span>
          </div>
        </div>

        <div className="flex-1 min-h-[500px]">
          <RichEditor />
        </div>
      </section>

      <div className="text-right pb-4">
        <p className="text-[10px] text-gray-400 font-mono">CREATED: 2026-01-19T10:01:59 | LAST_SYNC: 2026-01-20T08:30:12</p>
      </div>
    </div>
  );
};

export default Overview;
