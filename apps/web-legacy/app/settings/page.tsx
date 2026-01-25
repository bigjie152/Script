"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { Button } from "../../components/common/Button";

const MODEL_OPTIONS = ["deepseek-chat", "deepseek-reasoner", "mock"];

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(MODEL_OPTIONS[0]);
  const [savedState, setSavedState] = useState({ apiKey: "", model: MODEL_OPTIONS[0] });

  useEffect(() => {
    setSavedState({ apiKey: "", model: MODEL_OPTIONS[0] });
  }, []);

  const isDirty = useMemo(
    () => apiKey !== savedState.apiKey || model !== savedState.model,
    [apiKey, model, savedState]
  );

  const handleSave = () => {
    setSavedState({ apiKey, model });
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="settings" />
        <main className="space-y-6">
          <div>
            <div className="text-2xl font-semibold">系统设置</div>
            <div className="mt-1 text-sm text-muted">
              管理你的 AI 配置与工作流偏好。
            </div>
          </div>

          <section className="glass-panel-strong space-y-4 px-6 py-5">
            <div className="text-sm font-semibold">AI 配置</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-xs text-muted">API Key</span>
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="输入你的 API Key"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-indigo-300"
                  type="password"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-xs text-muted">模型选择</span>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {isDirty ? (
              <div className="flex justify-end">
                <Button onClick={handleSave}>保存设置</Button>
              </div>
            ) : null}
          </section>

          <section className="glass-panel-strong px-6 py-5">
            <div className="text-sm font-semibold">提示</div>
            <div className="mt-2 text-sm text-muted">
              修改后请保存设置，系统将用于下一次 AI 调用。
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
