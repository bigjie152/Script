import { useEffect, useMemo } from "react";
import { Activity, Clock3, Repeat } from "lucide-react";

type ModuleCollectionState = {
  entries: { id: string; name: string; data?: Record<string, unknown> }[];
  setActiveEntry: (entryId: string) => void;
  updateData: (entryId: string, data: Record<string, unknown>) => void;
};

interface TimelineProps {
  collection: ModuleCollectionState;
  entryId?: string;
  onSelectEntry: (entryId: string) => void;
  onCreateEntry: () => void;
}

type TimelineEvent = {
  id: string;
  time: string;
  detail: string;
  participants: string[];
};

const Timeline: React.FC<TimelineProps> = ({
  collection,
  entryId,
  onSelectEntry,
  onCreateEntry
}) => {
  const { entries, setActiveEntry, updateData } = collection;

  const selectedEntry = useMemo(() => {
    if (!entryId) return null;
    return entries.find((entry) => entry.id === entryId) || null;
  }, [entryId, entries]);

  useEffect(() => {
    if (!entryId) return;
    setActiveEntry(entryId);
  }, [entryId, setActiveEntry]);

  if (!selectedEntry) {
    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">时间线总览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <button
              key={entry.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all text-left"
              onClick={() => onSelectEntry(entry.id)}
              type="button"
            >
              <div className="text-sm text-gray-400 mb-2">CURRENT</div>
              <h3 className="font-bold text-gray-900">{entry.name}</h3>
              <p className="text-xs text-gray-500">点击进入事件编辑</p>
            </button>
          ))}
          <button
            className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors min-h-[160px]"
            type="button"
            onClick={onCreateEntry}
          >
            + 添加时间线
          </button>
        </div>
      </div>
    );
  }

  const events = (selectedEntry.data?.events as TimelineEvent[]) || [];

  const updateEvents = (nextEvents: TimelineEvent[]) => {
    updateData(selectedEntry.id, {
      ...(selectedEntry.data || {}),
      events: nextEvents
    });
  };

  const handleAddEvent = () => {
    const nextEvents = [
      ...events,
      { id: crypto.randomUUID(), time: "", detail: "", participants: [] }
    ];
    updateEvents(nextEvents);
  };

  const handleUpdateEvent = (index: number, key: "time" | "detail", value: string) => {
    const nextEvents = events.map((event, idx) =>
      idx === index ? { ...event, [key]: value } : event
    );
    updateEvents(nextEvents);
  };

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
            <h2 className="font-bold text-gray-800 text-lg">{selectedEntry.name}</h2>
          </div>
          <button
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-700"
            type="button"
            onClick={handleAddEvent}
          >
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
              {events.map((event, index) => (
                <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                  <td className="py-4 px-6">
                    <input
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-gray-700 font-medium w-20 text-center"
                      value={event.time}
                      onChange={(e) => handleUpdateEvent(index, "time", e.target.value)}
                      placeholder="18:00"
                    />
                  </td>
                  <td className="py-4 px-6 text-gray-700">
                    <textarea
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                      rows={2}
                      value={event.detail}
                      onChange={(e) => handleUpdateEvent(index, "detail", e.target.value)}
                      placeholder="填写事件详情"
                    />
                  </td>
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

        {events.length === 0 && (
          <div className="px-6 py-5 text-gray-400 text-sm">
            点击此处
            <br />
            添加下一个时间节点...
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
