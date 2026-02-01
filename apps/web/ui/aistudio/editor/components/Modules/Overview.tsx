import { ChevronDown, GitBranch, Users } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { ProjectMetaForm } from "@/hooks/useProjectMeta";
import type { EditorDocument } from "@/types/editorDocument";

interface OverviewProps {
  projectMeta: {
    form: ProjectMetaForm;
    updateField: (key: keyof ProjectMetaForm, value: string) => void;
  };
  overviewDoc: {
    document: EditorDocument;
    setDocument: (next: EditorDocument) => void;
    loading: boolean;
    error: string | null;
  };
  readOnly?: boolean;
  latestSnapshotId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

const genreOptions = ["悬疑", "情感", "恐怖", "机制", "硬核"];
const playerOptions = ["4 人", "5 人", "6 人", "7 人", "8 人"];

const Overview: React.FC<OverviewProps> = ({
  projectMeta,
  overviewDoc,
  readOnly = false,
  latestSnapshotId,
  createdAt,
  updatedAt
}) => {
  const { form, updateField } = projectMeta;
  const versionLabel = form.version || latestSnapshotId || "v0.1";

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-5 p-1">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[11px] text-gray-400 uppercase font-semibold mb-1 tracking-wider block">
            项目名称
          </span>
          <input
            className="w-full text-base font-semibold text-gray-800 bg-transparent outline-none"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="输入项目名称"
            disabled={readOnly}
          />
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <span className="text-[11px] text-gray-400 uppercase font-semibold mb-1 tracking-wider block">
            项目简介
          </span>
          <textarea
            className="w-full text-sm text-gray-700 bg-transparent outline-none resize-none min-h-[72px]"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="一句话介绍你的剧本"
            disabled={readOnly}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase font-semibold mb-1 tracking-wider">
              项目类型
            </span>
            <select
              className="text-sm text-gray-800 font-medium bg-transparent outline-none"
              value={form.genre}
              onChange={(event) => updateField("genre", event.target.value)}
              disabled={readOnly}
            >
              <option value="">请选择</option>
              {genreOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
            <ChevronDown size={16} className="text-gray-400 group-hover:text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase font-semibold mb-1 tracking-wider">
              人数
            </span>
            <div className="flex items-center gap-2 text-gray-800 font-medium">
              <Users size={16} className="text-gray-400" />
              <select
                className="text-sm text-gray-800 font-medium bg-transparent outline-none"
                value={form.players}
                onChange={(event) => updateField("players", event.target.value)}
                disabled={readOnly}
              >
                <option value="">请选择</option>
                {playerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
            <ChevronDown size={16} className="text-gray-400 group-hover:text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase font-semibold mb-1 tracking-wider">
              当前版本
            </span>
            <div className="flex items-center gap-2 text-gray-800 font-medium">
              <GitBranch size={16} className="text-gray-400" />
              <span className="text-sm text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm">
                {versionLabel}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1 self-end">
            最近更新：{form.version ? "已同步" : "待更新"}
          </div>
        </div>
      </section>

      <section className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">剧本简介</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
              核心
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-[520px]">
          <DocumentEditor
            value={overviewDoc.document}
            onChange={overviewDoc.setDocument}
            readonly={readOnly}
          />
        </div>
      </section>

      <div className="text-right pb-4">
        <p className="text-[10px] text-gray-400 font-mono">
          CREATED: {createdAt || "-"} | LAST_SYNC: {updatedAt || "-"}
        </p>
      </div>
    </div>
  );
};

export default Overview;
