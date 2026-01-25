import { useMemo } from "react";
import { Clock3, Activity, Repeat } from "lucide-react";

interface TimelineProps {
  activeSubId?: string;
}

const Timeline: React.FC<TimelineProps> = ({ activeSubId }) => {
  const act1Events = useMemo(
    () => [
      { time: "18:00", detail: "众人抵达山庄，暴雪开始封路。", participants: ["@All"] },
      { time: "19:30", detail: "晚宴开始，管家宣布老爷身体不适。", participants: ["@林管家", "@苏小姐", "@陈医生"] },
    ],
    []
  );
  const act2Events = useMemo(
    () => [
      { time: "20:15", detail: "突然停电，持续了约5分钟。", participants: ["@All"] },
      { time: "20:45", detail: "一声尖叫划破长空，发现尸体。", participants: ["@苏小姐"] },
    ],
    []
  );

  const currentEvents = activeSubId === "act-2" ? act2Events : act1Events;
  const currentActName = activeSubId === "act-2" ? "第二幕：晚宴与停电" : "第一幕：集结";

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Clock3 size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">总时长</div>
            <div className="text-lg font-semibold text-gray-800">4.5 小时</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">事件密度</div>
            <div className="text-lg font-semibold text-gray-800">15 min/node</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Repeat size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">关键反转</div>
            <div className="text-lg font-semibold text-gray-800">3 次</div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">CURRENT</span>
            <h2 className="font-bold text-gray-800 text-lg">{currentActName}</h2>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-700" type="button">
            + 添加事件
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100">
                <th className="py-3 px-6 font-medium w-32">时间点</th>
                <th className="py-3 px-6 font-medium">事件详情</th>
                <th className="py-3 px-6 font-medium w-48">涉及角色</th>
              </tr>
            </thead>
            <tbody>
              {currentEvents.map((event, index) => (
                <tr key={`${event.time}-${index}`} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-gray-700 font-medium w-20 text-center">
                      {event.time}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-700">{event.detail}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-2">
                      {event.participants.map((participant) => (
                        <span key={participant} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded">
                          {participant}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5 text-gray-400 text-sm">
          点击此处
          <br />
          添加下一个时间节点...
        </div>
      </div>
    </div>
  );
};

export default Timeline;
