import type { AIClient } from "./base.adapter";

type QwenConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export function createQwenClient(config: QwenConfig): AIClient {
  const baseUrl =
    config.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

  return {
    provider: "qwen",
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
        throw new Error(`Qwen API error: ${response.status} ${text}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return data.choices?.[0]?.message?.content?.trim() || "";
    },
    completeStream: async function* ({ system, user, temperature }) {
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
          temperature: temperature ?? 0.2,
          stream: true
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Qwen API error: ${response.status} ${text}`);
      }

      if (!response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const lineEnd = buffer.indexOf("\n");
          if (lineEnd === -1) break;
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          if (!line || !line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          if (payload === "[DONE]") return;
          try {
            const data = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
            };
            const delta =
              data.choices?.[0]?.delta?.content ??
              data.choices?.[0]?.message?.content ??
              "";
            if (delta) {
              yield delta;
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    }
  };
}
