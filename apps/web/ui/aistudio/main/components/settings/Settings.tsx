"use client";

import { useState } from "react";
import { Settings as SettingsIcon, Cpu, Shield, Type, Save, Info } from "lucide-react";

const Settings: React.FC = () => {
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [provider, setProvider] = useState("Gemini 2.5");
  const [autoSave, setAutoSave] = useState(5);
  const [watermark, setWatermark] = useState(true);

  return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="text-gray-900" /> 系统设置
        </h2>
        <p className="text-gray-500 mt-1 ml-9">
          管理 AI 编排器、内容版权与编辑器环境。
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Cpu className="text-indigo-600" size={20} /> AI 模型编排
            </h3>
            <p className="text-xs text-gray-500 mt-1">配置底层的生成式 AI 参数与提供商。</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">模型提供商</label>
                <select
                  value={provider}
                  onChange={(event) => setProvider(event.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="Gemini 2.5">Google Gemini 2.5（当前）</option>
                  <option value="DeepSeek">DeepSeek V3</option>
                  <option value="GPT-4o">OpenAI GPT-4o</option>
                </select>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info size={10} /> 切换 Provider 可能会影响 K1 采纳率统计。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt 版本</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value="v2.4.1-stable (Orchestrator)"
                    disabled
                    className="flex-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  />
                  <button className="text-xs text-indigo-600 hover:underline" type="button">
                    查看差异
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">创意温度 (Temperature)</label>
                  <span className="text-sm font-mono text-gray-600">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(event) => setTemperature(parseFloat(event.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>严谨 (0.0)</span>
                  <span>创意 (1.0)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">最大 Token 数</label>
                  <span className="text-sm font-mono text-gray-600">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(event) => setMaxTokens(parseInt(event.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-green-600" size={20} /> 内容与版权偏好
            </h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">默认项目可见性</h4>
                <p className="text-xs text-gray-500">新建项目时的默认隐私设置。</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button className="px-3 py-1.5 text-xs font-medium bg-white shadow-sm rounded-md text-gray-800" type="button">
                  私有 (Private)
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700" type="button">
                  团队可见
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700" type="button">
                  公开
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 pt-5">
              <div>
                <h4 className="text-sm font-medium text-gray-900">预览页动态水印</h4>
                <p className="text-xs text-gray-500">
                  分享剧本预览时，是否嵌入包含 Truth ID 的隐形数字水印。
                </p>
              </div>
              <button
                onClick={() => setWatermark(!watermark)}
                className={`w-11 h-6 flex items-center rounded-full transition-colors ${watermark ? "bg-indigo-600" : "bg-gray-300"}`}
                type="button"
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${watermark ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Type className="text-orange-600" size={20} /> 编辑器偏好
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">自动保存频率（分钟）</label>
              <input
                type="number"
                value={autoSave}
                onChange={(event) => setAutoSave(parseInt(event.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <label className="block text-sm font-medium text-gray-700">智能引用（@Mention）</label>
                <p className="text-xs text-gray-500 mt-1">输入 @ 时自动弹出角色库列表。</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all hover:-translate-y-0.5" type="button">
            <Save size={18} /> 保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
