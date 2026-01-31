import { createDeepSeekClient } from "./deepseek.adapter";

export type AIClient = {
  provider: string;
  model: string;
  complete: (input: {
    system: string;
    user: string;
    temperature?: number;
  }) => Promise<string>;
};

export function getAIClient(): AIClient {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "deepseek-chat";

  if (provider === "deepseek" && apiKey) {
    return createDeepSeekClient({
      apiKey,
      model,
      baseUrl: process.env.AI_BASE_URL
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
            summary: "用于 MVP 的稳定 mock 角色。",
            meta: { source: "mock" }
          }
        ],
        items: [
          {
            title: "候选内容",
            summary: "用于 MVP 的稳定 mock 候选。",
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
            title: "稳定提示",
            description: "用于 MVP 的稳定 mock 问题。",
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
