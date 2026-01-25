import { Clue } from "../../types/types";
import RichEditor from "../RichEditor";
import { MapPin, Star, CheckCircle2, Search } from "lucide-react";

interface CluesProps {
  clues: Clue[];
  activeSubId?: string;
}

const Clues: React.FC<CluesProps> = ({ clues, activeSubId }) => {
  const selectedClue = clues.find((clue) => clue.id === activeSubId);

  if (!selectedClue) {
    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">线索库</h2>
        <div className="space-y-4">
          {clues.map((clue) => (
            <div key={clue.id} className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    clue.type === "物品" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {clue.type}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{clue.name}</h3>
                  <p className="text-xs text-gray-500">{clue.acquisition}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin size={12} /> 指向 {clue.pointsTo}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-500" /> {clue.reliability}
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-4 rounded-xl flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors cursor-pointer">
            <span className="text-sm font-medium">+ 添加新线索</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-blue-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">指向性</span>
          </div>
          <div className="font-semibold text-gray-800 text-lg">{selectedClue.pointsTo}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-orange-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">获取难度</span>
          </div>
          <div className="flex items-center gap-1 text-orange-500">
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} className="text-gray-200" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">真实度</span>
          </div>
          <div className="font-semibold text-gray-800 text-lg">{selectedClue.reliability}线索</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Search size={18} className="text-indigo-500" />
            <h2 className="font-bold text-gray-800 text-lg">线索详情：{selectedClue.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-white text-gray-500 rounded border border-gray-200 shadow-sm">
              Source: {selectedClue.sourceVersion}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <RichEditor key={selectedClue.id} initialContent={selectedClue.content} className="border-none shadow-none h-full rounded-none" />
        </div>
      </div>
    </div>
  );
};

export default Clues;
