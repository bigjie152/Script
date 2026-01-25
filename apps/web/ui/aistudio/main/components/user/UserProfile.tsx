"use client";

import { ShieldCheck, Activity, Clock, Layers, Key, Mail, Edit3, Cpu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error } = useUserProfile();

  const stats = {
    avgDraftTime: "--",
    snapshots: data?.myProjects?.length ?? 0,
    aiAdoptionRate: data?.acceptedSuggestionsCount
      ? Math.min(100, data.acceptedSuggestionsCount * 5)
      : 0
  };

  const kycStatus = {
    isVerified: false,
    id: user?.id || "--"
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="w-24 h-24 rounded-full border-4 border-indigo-50 shadow-md overflow-hidden flex-shrink-0">
          <img src="https://picsum.photos/200" alt="Avatar" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{user?.username || "未登录"}</h1>
            {kycStatus.isVerified && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200">
                <ShieldCheck size={12} /> 实名认证
              </span>
            )}
          </div>
          <p className="text-gray-500 mb-4 max-w-xl">
            {user
              ? "资深科幻编剧，擅长构建赛博朋克世界观。Bigjie 工作室主笔。"
              : "请登录以查看完整个人信息。"}
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
              <Mail size={14} /> {user ? "user@example.com" : "--"}
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
              <ShieldCheck size={14} /> Truth ID: {kycStatus.id}
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">加载中...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : null}

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="text-indigo-600" size={20} /> 创作看板（Creative Dashboard）
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock size={20} />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center">↑12% 效率提升</span>
            </div>
            <p className="text-sm text-gray-500">完成初稿平均时长</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgDraftTime}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Layers size={20} />
              </div>
            </div>
            <p className="text-sm text-gray-500">已生成版本快照数（Truth Evidence）</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.snapshots}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Cpu size={20} />
              </div>
            </div>
            <p className="text-sm text-gray-500 relative z-10">AI 采纳率（K1 指标）</p>
            <div className="flex items-end gap-2 mt-1 relative z-10">
              <p className="text-2xl font-bold text-gray-900">{stats.aiAdoptionRate}%</p>
              <p className="text-xs text-gray-400 mb-1">人机协作深度</p>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 relative z-10">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${stats.aiAdoptionRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key size={18} /> 账号安全
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">登录密码</p>
                <p className="text-xs text-gray-500">上次修改：3 个月前</p>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium" type="button">
                修改
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">实名认证（KYC）</p>
                <p className="text-xs text-gray-500">已绑定身份证：510***********1234</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">已完成</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
              <Cpu size={18} /> API 接入
            </h3>
            <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100" type="button">
              + 新建 Token
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-gray-400 border border-gray-200">
                  T1
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">External_Analysis_Tool</p>
                  <p className="text-[10px] text-gray-400">sk-live...982a · Read Only</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" type="button">
                <Edit3 size={14} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            使用 API Token 可将您的创作数据导出至第三方分析工具。请妥善保管。
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
