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
  const globalValue = (globalThis as Record<string, unknown>)[key];
  if (typeof globalValue === "string" && globalValue.trim()) {
    return globalValue;
  }
  const ctx = (globalThis as Record<symbol, unknown>)[
    cloudflareContextSymbol
  ] as { env?: Record<string, unknown> } | undefined;
  const value = ctx?.env?.[key];
  if (typeof value === "string") return value;

  const pickFromEnv = (env: Record<string, unknown> | undefined) => {
    if (!env) return undefined;
    const resolved = env[key];
    return typeof resolved === "string" ? resolved : undefined;
  };

  try {
    for (const sym of Object.getOwnPropertySymbols(globalThis)) {
      const candidate = (globalThis as Record<symbol, unknown>)[sym];
      if (
        candidate &&
        typeof candidate === "object" &&
        "env" in (candidate as Record<string, unknown>)
      ) {
        const resolved = pickFromEnv((candidate as { env?: Record<string, unknown> }).env);
        if (resolved) return resolved;
      }
    }
  } catch {
    // ignore symbol probing failures
  }

  try {
    for (const name of Object.getOwnPropertyNames(globalThis)) {
      const candidate = (globalThis as Record<string, unknown>)[name];
      if (
        candidate &&
        typeof candidate === "object" &&
        "env" in (candidate as Record<string, unknown>)
      ) {
        const resolved = pickFromEnv((candidate as { env?: Record<string, unknown> }).env);
        if (resolved) return resolved;
      }
      if (name === "env" && candidate && typeof candidate === "object") {
        const resolved = pickFromEnv(candidate as Record<string, unknown>);
        if (resolved) return resolved;
      }
    }
  } catch {
    // ignore name probing failures
  }

  return undefined;
}

function resolveProvider(purpose?: AIPurpose) {
  const fallbackRaw = (readEnv("AI_PROVIDER") || "").toLowerCase();
  const deriveProvider = (readEnv("AI_PROVIDER_DERIVE") || "").toLowerCase();
  const checkProvider = (readEnv("AI_PROVIDER_CHECK") || "").toLowerCase();
  const fallback =
    fallbackRaw ||
    (readEnv("AI_QWEN_API_KEY") ? "qwen" : "") ||
    (readEnv("AI_DEEPSEEK_API_KEY") ? "deepseek" : "") ||
    "mock";
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

export function resolveAIConfig(purpose?: AIPurpose) {
  const provider = resolveProvider(purpose);
  return {
    provider,
    model: resolveModel(provider, purpose),
    apiKey: resolveApiKey(provider),
    baseUrl: resolveBaseUrl(provider)
  };
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
