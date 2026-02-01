import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { loadPrompt } from "@/lib/prompts";
import { getAuthUser } from "@/lib/auth";
import { resolveAIConfig } from "@/lib/ai";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/ai/derive/stream";

const ACTIONS = ["outline", "worldcheck", "story", "role", "clue", "timeline", "dm"] as const;
type ActionType = (typeof ACTIONS)[number];

const ACTION_PROMPT: Record<ActionType, string> = {
  outline: "derive/outline.v1.md",
  worldcheck: "derive/worldcheck.v1.md",
  story: "derive/story.v1.md",
  role: "derive/role.v1.md",
  clue: "derive/clue.v1.md",
  timeline: "derive/timeline.v1.md",
  dm: "derive/dm.v1.md"
};

const ACTION_TARGET: Record<ActionType, string> = {
  outline: "insight",
  worldcheck: "insight",
  story: "story",
  role: "role",
  clue: "clue",
  timeline: "timeline",
  dm: "dm"
};

function extractJson<T>(input: string): T | null {
  if (!input) return null;
  const trimmed = input.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {}
  const fenced =
    trimmed.match(/```json\\s*([\\s\\S]*?)```/i) ||
    trimmed.match(/```([\\s\\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {}
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(candidate) as T;
    } catch {}
  }
  return null;
}

function normalizeDoc(input: unknown, fallback: string) {
  if (input && typeof input === "object") {
    return input as Record<string, unknown>;
  }
  const text = typeof input === "string" ? input : fallback;
  return {
    type: "doc",
    content: text
      ? [
          {
            type: "paragraph",
            content: [{ type: "text", text }]
          }
        ]
      : []
  };
}

function mapCandidates(raw: string) {
  const parsed = extractJson<{
    items?: Array<Record<string, unknown>>;
    candidates?: Array<Record<string, unknown>>;
    suggestions?: Array<Record<string, unknown>>;
    roles?: Array<Record<string, unknown>>;
  }>(raw);
  const rawItems =
    parsed?.items ||
    parsed?.candidates ||
    parsed?.suggestions ||
    parsed?.roles ||
    [];
  return rawItems.map((item, index) => {
    const title = String(item?.title || item?.name || `候选${index + 1}`);
    const summary = item?.summary
      ? String(item.summary)
      : item?.detail
        ? String(item.detail)
        : item?.description
          ? String(item.description)
          : undefined;
    const flagsSource = (item as any)?.risk_flags ?? (item as any)?.riskFlags;
    const riskFlags = Array.isArray(flagsSource)
      ? flagsSource.map((flag: unknown) => String(flag))
      : [];
    return {
      title,
      summary,
      content: normalizeDoc(item as Record<string, unknown>, summary || title),
      refs: item?.refs ?? null,
      riskFlags,
      meta: item
    };
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));
  const actionType = (body?.actionType || "") as ActionType;
  const intent = typeof body?.intent === "string" ? body.intent : undefined;
  const requestedSnapshotId =
    typeof body?.truthSnapshotId === "string" ? body.truthSnapshotId : null;

  if (!ACTIONS.includes(actionType)) {
    return jsonError(400, "不支持的 AI 动作类型", { actionType }, requestId);
  }

  const user = await getAuthUser(request);
  if (!user) {
    return jsonError(401, "请先登录", undefined, requestId);
  }

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    return jsonError(404, "项目不存在", undefined, requestId);
  }

  if (project.ownerId && project.ownerId !== user.id) {
    return jsonError(403, "无权限访问", undefined, requestId);
  }

  if (!project.ownerId) {
    await db
      .update(schema.projects)
      .set({ ownerId: user.id, updatedAt: new Date().toISOString() })
      .where(eq(schema.projects.id, projectId));
  }

  const [snapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(
      requestedSnapshotId
        ? and(
            eq(schema.truthSnapshots.id, requestedSnapshotId),
            eq(schema.truthSnapshots.projectId, projectId)
          )
        : eq(schema.truthSnapshots.projectId, projectId)
    )
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  if (!snapshot) {
    return jsonError(409, "未找到 Truth 快照，请先锁定 Truth", undefined, requestId);
  }

  const prompt = await loadPrompt(ACTION_PROMPT[actionType]);
  const { provider, model, apiKey, baseUrl } = resolveAIConfig("derive");

  if (provider !== "qwen" || !apiKey) {
    return jsonError(400, "当前仅支持 qwen 流式生成", undefined, requestId);
  }

  const payload = {
    action: `derive_${actionType}`,
    project: { id: project.id, name: project.name || undefined },
    truthSnapshot: {
      id: snapshot.id,
      version: snapshot.version ?? undefined,
      content: snapshot.content
    },
    intent,
    context: body?.context ?? null
  };

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let rawText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const abortController = new AbortController();
      const abortHandler = () => abortController.abort();
      request.signal.addEventListener("abort", abortHandler);
      try {
        const response = await fetch(
          baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model,
              stream: true,
              messages: [
                { role: "system", content: prompt },
                { role: "user", content: JSON.stringify(payload, null, 2) }
              ],
              temperature: 0.2
            }),
            signal: abortController.signal
          }
        );

        if (!response.ok || !response.body) {
          const text = await response.text();
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: text })}\n\n`)
          );
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            const lines = part.split("\n").map((line) => line.trim());
            const dataLines = lines
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.replace(/^data:\\s*/, ""));
            if (!dataLines.length) continue;
            const data = dataLines.join("\n");
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                rawText += delta;
                controller.enqueue(
                  encoder.encode(
                    `event: delta\ndata: ${JSON.stringify({ content: delta })}\n\n`
                  )
                );
              }
            } catch {
              // ignore non-json chunks
            }
          }
        }

        const items = mapCandidates(rawText);
        const target = ACTION_TARGET[actionType];
        const now = new Date().toISOString();
        const candidates = items.map((item) => ({
          id: crypto.randomUUID(),
          projectId,
          target,
          title: item.title,
          summary: item.summary ?? null,
          content: item.content,
          meta: item.meta ?? { actionType },
          refs: item.refs ?? null,
          riskFlags: item.riskFlags ?? [],
          status: "pending",
          createdAt: now,
          updatedAt: now
        }));

        if (candidates.length > 0) {
          await db.insert(schema.aiCandidates).values(candidates);
        }

        await db.insert(schema.aiRequestLogs).values({
          id: crypto.randomUUID(),
          projectId,
          truthSnapshotId: snapshot.id,
          actionType: `derive_${actionType}`,
          provider,
          model,
          meta: { prompt: ACTION_PROMPT[actionType] }
        });

        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              provider,
              model,
              candidates: candidates.map((candidate) => ({
                id: candidate.id,
                target: candidate.target,
                title: candidate.title,
                summary: candidate.summary,
                content: candidate.content,
                refs: candidate.refs,
                riskFlags: candidate.riskFlags,
                status: candidate.status
              }))
            })}\n\n`
          )
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              message: error instanceof Error ? error.message : String(error)
            })}\n\n`
          )
        );
        controller.close();
      } finally {
        request.signal.removeEventListener("abort", abortHandler);
        console.log(routeLabel, {
          route: routeLabel,
          requestId,
          status: 200,
          latencyMs: Date.now() - startedAt
        });
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
