import { useCallback, useEffect, useState } from "react";

type AiStatus = "idle" | "pending" | "success" | "error";

type AiActionState = {
  status: AiStatus;
  message: string | null;
  run: () => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function useMockAction(label: string): AiActionState {
  const [status, setStatus] = useState<AiStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (status === "pending") return;
    setStatus("pending");
    setMessage("处理中...");

    try {
      await sleep(800);
      setStatus("success");
      setMessage(`${label}已完成（Mock）`);
    } catch {
      setStatus("error");
      setMessage(`${label}失败，请稍后重试`);
    }
  }, [label, status]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => {
      setStatus("idle");
      setMessage(null);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [status]);

  return { status, message, run };
}

export function useMockAiTasks() {
  const reviewLogic = useMockAction("一致性检查");

  return { reviewLogic };
}
