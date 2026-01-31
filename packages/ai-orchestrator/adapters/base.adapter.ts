import { createDeepSeekClient } from "./deepseek.adapter";
import { createQwenClient } from "./qwen.adapter";

export type AIClient = {
  provider: string;
  model: string;
  complete: (input: {
    system: string;
    user: string;
    temperature?: number;
  }) => Promise<string>;
};

export type AIPurpose = "derive" | "check";

const cloudflareContextSymbol = Symbol.for("__cloudflare-request-context__");

function readEnv(key: string): string | undefined {
  const direct = process.env[key];
  if (direct) return direct;
  const ctx = (globalThis as Record<symbol, unknown>)[
    cloudflareContextSymbol
  ] as { env?: Record<string, unknown> } | undefined;
  const value = ctx?.env?.[key];
  return typeof value === "string" ? value : undefined;
}

function resolveProvider(purpose?: AIPurpose) {
  const fallback = (readEnv("AI_PROVIDER") || "mock").toLowerCase();
  const deriveProvider = (readEnv("AI_PROVIDER_DERIVE") || "").toLowerCase();
  const checkProvider = (readEnv("AI_PROVIDER_CHECK") || "").toLowerCase();
  if (purpose === "check") {
    return checkProvider || fallback;
  }
  if (purpose === "derive") {
    return deriveProvider || fallback;
  }
  return fallback;
}

function resolveModel(provider: string, purpose?: AIPurpose) {
  if (provider === "qwen") {
    return (
      readEnv("AI_QWEN_MODEL") ||
      readEnv("AI_MODEL") ||
      "qwen3-max-2026-01-23"
    );
  }
  if (provider === "deepseek") {
    const raw =
      readEnv("AI_DEEPSEEK_MODEL") || readEnv("AI_MODEL") || "deepseek-reasoner";
    const normalized = raw.toLowerCase().replace(/\s+/g, "");
    if (normalized === "deepseek-r1" || normalized === "deepseekr1" || normalized === "r1") {
      return "deepseek-reasoner";
    }
    return raw;
  }
  if (purpose === "check") {
    return readEnv("AI_MODEL") || "DeepSeek-R1";
  }
  return readEnv("AI_MODEL") || "mock";
}

function resolveApiKey(provider: string) {
  if (provider === "qwen") {
    return readEnv("AI_QWEN_API_KEY") || readEnv("AI_API_KEY");
  }
  if (provider === "deepseek") {
    return readEnv("AI_DEEPSEEK_API_KEY") || readEnv("AI_API_KEY");
  }
  return readEnv("AI_API_KEY");
}

function resolveBaseUrl(provider: string) {
  if (provider === "qwen") {
    return readEnv("AI_QWEN_BASE_URL") || readEnv("AI_BASE_URL");
  }
  if (provider === "deepseek") {
    return readEnv("AI_DEEPSEEK_BASE_URL") || readEnv("AI_BASE_URL");
  }
  return readEnv("AI_BASE_URL");
}

export function getAIClient(purpose?: AIPurpose): AIClient {
  const provider = resolveProvider(purpose);
  const apiKey = resolveApiKey(provider);
  const model = resolveModel(provider, purpose);

  if (provider === "qwen" && apiKey) {
    return createQwenClient({
      apiKey,
      model,
      baseUrl: resolveBaseUrl(provider)
    });
  }

  if (provider === "deepseek" && apiKey) {
    return createDeepSeekClient({
      apiKey,
      model,
      baseUrl: resolveBaseUrl(provider)
    });
  }

  return createMockClient();
}

function createMockClient(): AIClient {
  return {
    provider: "mock",
    model: "mock",
    complete: async ({ user }) => {
      const fallback = {
        roles: [
          {
            name: "主要角色",
            summary: "用于 MVP 稳定性测试的 mock 角色。",
            meta: { source: "mock" }
          }
        ],
        items: [
          {
            title: "候选内容",
            summary: "用于 MVP 稳定性测试的 mock 候选。",
            content: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "这是 AI 生成的候选段落（mock）。" }]
                }
              ]
            },
            refs: [],
            risk_flags: []
          }
        ],
        issues: [
          {
            type: "logic_check",
            severity: "P1",
            title: "稳定性提示",
            description: "用于 MVP 稳定性测试的 mock 问题。",
            refs: []
          }
        ]
      };

      let action = "";
      try {
        const payload = JSON.parse(user) as { action?: string };
        action = payload?.action || "";
      } catch {
        action = user.includes("derive_roles")
          ? "derive_roles"
          : user.includes("consistency_check")
            ? "consistency_check"
            : "";
      }

      if (action === "derive_roles") {
        return JSON.stringify({ roles: fallback.roles });
      }

      if (action === "consistency_check") {
        return JSON.stringify({ issues: fallback.issues });
      }

      if (action.startsWith("derive_")) {
        return JSON.stringify({ items: fallback.items });
      }

      if (action === "logic_check") {
        return JSON.stringify({ issues: fallback.issues });
      }

      if (action === "outline" || action === "worldcheck") {
        return JSON.stringify({ items: fallback.items });
      }

      return JSON.stringify({ items: fallback.items });
    }
  };
}
