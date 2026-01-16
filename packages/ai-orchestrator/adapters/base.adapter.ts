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
            name: "Primary Role",
            summary: "Stable mock role for V0.1 integration.",
            meta: { source: "mock" }
          }
        ],
        issues: [
          {
            type: "consistency",
            severity: "low",
            title: "Stable Issue",
            description: "Stable mock issue for V0.1 integration.",
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

      return JSON.stringify({});
    }
  };
}
