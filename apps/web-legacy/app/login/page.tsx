"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../../components/common/Button";
import { ErrorBanner } from "../../components/common/ErrorBanner";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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
      setError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel-strong w-full max-w-md p-6 text-center">
          <div className="text-lg font-semibold">已登录</div>
          <div className="mt-2 text-sm text-muted">
            当前账号：{user.username}
          </div>
          <Button className="mt-6" onClick={() => router.push("/workspace")}>
            返回 Workspace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel-strong w-full max-w-md p-6">
        <div className="text-xl font-semibold">
          {mode === "login" ? "登录" : "注册账号"}
        </div>
        <div className="mt-2 text-sm text-muted">
          {mode === "login"
            ? "欢迎回来，请继续你的创作。"
            : "创建账号，开始你的第一个剧本。"}
        </div>
        {error ? (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <div>
            <div className="text-xs text-muted">用户名</div>
            <input
              className="mt-2 w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-ink/40"
              placeholder="输入用户名"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div>
            <div className="text-xs text-muted">密码</div>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-ink/40"
              placeholder="至少 6 位"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>

        <Button className="mt-6 w-full" loading={loading} onClick={handleSubmit}>
          {mode === "login" ? "登录" : "注册"}
        </Button>

        <button
          type="button"
          className="mt-4 w-full text-xs text-muted"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </div>
  );
}
