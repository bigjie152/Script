import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { deriveCandidates } from "@/lib/ai";
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
  const result = await deriveCandidates({
    prompt,
    project,
    truthSnapshot: snapshot,
    actionType,
    intent,
    context: body?.context ?? null
  });

  const target = ACTION_TARGET[actionType];
  const now = new Date().toISOString();
  const candidates = result.items.map((item) => ({
    id: crypto.randomUUID(),
    projectId,
    target,
    title: item.title,
    summary: item.summary ?? null,
    content: normalizeDoc(item.content, item.summary || item.title),
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
    provider: result.provider,
    model: result.model,
    meta: { prompt: ACTION_PROMPT[actionType] }
  });

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
    },
    { requestId }
  );
}
