import { Role } from "../../types/types";
import RichEditor from "../RichEditor";
import { Target, User, Lock, Sparkles } from "lucide-react";

interface RolesProps {
  roles: Role[];
  activeSubId?: string;
}

const Roles: React.FC<RolesProps> = ({ roles, activeSubId }) => {
  const selectedRole = roles.find((role) => role.id === activeSubId);

  if (!selectedRole) {
    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">角色概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {role.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{role.name}</h3>
                  <span className="text-xs text-gray-500">{role.motivation}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">剧本进度</span>
                  <span className="text-indigo-600 font-medium">85%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-indigo-500 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors cursor-pointer min-h-[180px]">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
              <span className="text-2xl font-light">+</span>
            </div>
            <span className="text-sm font-medium">创建新角色</span>
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
            <Target size={16} className="text-red-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">核心动机</span>
          </div>
          <div className="font-semibold text-gray-800 text-lg">{selectedRole.motivation}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-purple-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">已知真相</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[40%] rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-purple-700">40%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Lock size={48} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-amber-500" />
            <span className="text-xs uppercase text-gray-400 font-bold tracking-wider">秘密数量</span>
          </div>
          <div className="font-semibold text-gray-800 text-lg">3 个核心秘密</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-800 text-lg">{selectedRole.name} 个人剧本</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-white text-gray-500 rounded border border-gray-200 shadow-sm">
              Source: {selectedRole.sourceVersion}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <RichEditor key={selectedRole.id} initialContent={selectedRole.content} className="border-none shadow-none h-full rounded-none" />
        </div>
      </div>
    </div>
  );
};

export default Roles;
