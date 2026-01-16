import type { AIClient } from "./base.adapter";

type DeepSeekConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export function createDeepSeekClient(config: DeepSeekConfig): AIClient {
  const baseUrl = config.baseUrl || "https://api.deepseek.com/chat/completions";

  return {
    provider: "deepseek",
    model: config.model,
    complete: async ({ system, user, temperature }) => {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          temperature: temperature ?? 0.2
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${text}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return data.choices?.[0]?.message?.content?.trim() || "";
    }
  };
}
