"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError("请输入用户名与密码");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      router.push("/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    router.push("/workspace");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="space-y-1">
          <div className="text-2xl font-semibold text-gray-900">
            {mode === "login" ? "登录" : "注册账号"}
          </div>
          <div className="text-sm text-gray-500">
            {mode === "login"
              ? "欢迎回来，请输入账号信息"
              : "创建一个新账号，开始创作之旅"}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">用户名</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">密码</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        ) : null}

        <button
          className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition ${
            loading
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-sm"
          }`}
          type="button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
        </button>

        <button
          className="w-full text-xs text-indigo-600 hover:text-indigo-700"
          type="button"
          onClick={() =>
            setMode((prev) => (prev === "login" ? "register" : "login"))
          }
        >
          {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </div>
  );
}
