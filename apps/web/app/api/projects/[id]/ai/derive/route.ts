import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { deriveCandidates, deriveCandidatesStream } from "@/lib/ai";
import { loadPrompt } from "@/lib/prompts";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/ai/derive";

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

const WRITING_TRUTH_ACTIONS = new Set<ActionType>(["outline", "worldcheck"]);

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

function fallbackItem(raw: string, actionType: ActionType) {
  const summary = raw.slice(0, 200);
  return {
    title: `${actionType}-ai-output`,
    summary,
    content: raw,
    refs: null,
    riskFlags: []
  };
}

function createSseHeaders(requestId: string) {
  return new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "x-request-id": requestId
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
  const streamEnabled = body?.stream === true;

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

  const [truthRow] = await db
    .select()
    .from(schema.truths)
    .where(eq(schema.truths.projectId, projectId))
    .orderBy(desc(schema.truths.createdAt))
    .limit(1);

  const truthLocked = truthRow?.status === "LOCKED";
  const writingTruth = WRITING_TRUTH_ACTIONS.has(actionType);

  if (writingTruth && truthLocked) {
    return jsonError(409, "Truth 已锁定，无法生成，请先解锁", undefined, requestId);
  }
  if (!writingTruth && !truthLocked) {
    return jsonError(409, "请先锁定 Truth，再生成派生内容", undefined, requestId);
  }

  const snapshotRows = await db
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

  let snapshot = snapshotRows[0];
  let snapshotLogId: string | null = snapshot?.id ?? null;

  if (!snapshot && writingTruth) {
    const [truth] = await db
      .select()
      .from(schema.truths)
      .where(eq(schema.truths.projectId, projectId))
      .orderBy(desc(schema.truths.createdAt))
      .limit(1);
    if (truth) {
      snapshot = { id: truth.id, version: null, content: truth.content } as typeof snapshot;
    } else {
      snapshot = {
        id: crypto.randomUUID(),
        version: null,
        content: { type: "doc", content: [] }
      } as typeof snapshot;
    }
    snapshotLogId = null;
  }

  if (!snapshot) {
    return jsonError(409, "未找到 Truth 快照，请先锁定 Truth", undefined, requestId);
  }

  const prompt = await loadPrompt(ACTION_PROMPT[actionType]);

  if (streamEnabled) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let raw = "";
        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };
        const pingTimer = setInterval(() => send({ type: "ping" }), 10000);

        try {
          const iterator = deriveCandidatesStream({
            prompt,
            project,
            truthSnapshot: snapshot,
            actionType,
            intent,
            context: body?.context ?? null
          });

          while (true) {
            const { value, done } = await iterator.next();
            if (done) {
              raw = value?.raw ?? raw;
              const provider = value?.provider ?? "unknown";
              const model = value?.model ?? "unknown";
              const items = value?.items ?? [];
              const target = ACTION_TARGET[actionType];
              const resolvedItems = items.length
                ? items
                : raw && raw.trim()
                  ? [fallbackItem(raw, actionType)]
                  : [];

              if (!resolvedItems.length) {
                send({ type: "error", message: "AI 返回为空，请稍后再试" });
                controller.close();
                return;
              }

              await db.insert(schema.aiRequestLogs).values({
                id: crypto.randomUUID(),
                projectId,
                truthSnapshotId: snapshotLogId,
                actionType: `derive_${actionType}`,
                provider,
                model,
                meta: { prompt: ACTION_PROMPT[actionType], mode: "direct", stream: true }
              });

              const directItems = resolvedItems.map((item) => ({
                target,
                title: item.title,
                summary: item.summary ?? null,
                content: normalizeDoc(item.content, item.summary || item.title),
                refs: item.refs ?? null,
                riskFlags: item.riskFlags ?? []
              }));

              send({
                type: "final",
                payload: {
                  actionType,
                  provider,
                  model,
                  items: directItems
                }
              });
              send({ type: "done" });
              controller.close();
              return;
            }
            if (value) {
              raw += value;
              send({ type: "delta", content: value });
            }
          }
        } catch (err) {
          send({
            type: "error",
            message: err instanceof Error ? err.message : "AI 生成失败，请稍后再试"
          });
          controller.close();
        } finally {
          clearInterval(pingTimer);
        }
      }
    });

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt,
      stream: true
    });

    return new Response(stream, { status: 200, headers: createSseHeaders(requestId) });
  }

  const result = await deriveCandidates({
    prompt,
    project,
    truthSnapshot: snapshot,
    actionType,
    intent,
    context: body?.context ?? null
  });

  const target = ACTION_TARGET[actionType];
  const items = result.items.length
    ? result.items
    : result.raw && result.raw.trim()
      ? [fallbackItem(result.raw, actionType)]
      : [];

  if (!items.length) {
    return jsonError(422, "AI 返回为空，请稍后再试", undefined, requestId);
  }

  await db.insert(schema.aiRequestLogs).values({
    id: crypto.randomUUID(),
    projectId,
    truthSnapshotId: snapshotLogId,
    actionType: `derive_${actionType}`,
    provider: result.provider,
    model: result.model,
    meta: { prompt: ACTION_PROMPT[actionType], mode: "direct" }
  });

  const directItems = items.map((item) => ({
    target,
    title: item.title,
    summary: item.summary ?? null,
    content: normalizeDoc(item.content, item.summary || item.title),
    refs: item.refs ?? null,
    riskFlags: item.riskFlags ?? []
  }));

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      actionType,
      provider: result.provider,
      model: result.model,
      items: directItems
    },
    { requestId }
  );
}
