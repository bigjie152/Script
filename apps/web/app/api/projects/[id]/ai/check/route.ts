import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { logicCheck } from "@/lib/ai";
import { loadPrompt } from "@/lib/prompts";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/ai/check";
const issueSource = "ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));
  const requestedSnapshotId =
    typeof body?.truthSnapshotId === "string" ? body.truthSnapshotId : null;

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

  try {
    const docs = await db
      .select()
      .from(schema.moduleDocuments)
      .where(eq(schema.moduleDocuments.projectId, projectId));
    const context = {
      story: docs.find((doc) => doc.module === "story")?.content ?? null,
      roles: docs.find((doc) => doc.module === "roles")?.content ?? null,
      clues: docs.find((doc) => doc.module === "clues")?.content ?? null,
      timeline: docs.find((doc) => doc.module === "timeline")?.content ?? null,
      dm: docs.find((doc) => doc.module === "dm")?.content ?? null
    };

    const prompt = await loadPrompt("check/logic.v1.md");
    const result = await logicCheck({
      prompt,
      project,
      truthSnapshot: snapshot,
      context
    });

    await db
      .delete(schema.issues)
      .where(
        and(
          eq(schema.issues.truthSnapshotId, snapshot.id),
          eq(schema.issues.source, issueSource)
        )
      );

    if (result.issues.length > 0) {
      await db.insert(schema.issues).values(
        result.issues.map((issue) => ({
          id: crypto.randomUUID(),
          projectId,
          truthSnapshotId: snapshot.id,
          source: issueSource,
          type: issue.type,
          severity: issue.severity,
          title: issue.title,
          description: issue.description ?? null,
          refs: issue.refs ?? null
        }))
      );
    }

    await db.insert(schema.aiRequestLogs).values({
      id: crypto.randomUUID(),
      projectId,
      truthSnapshotId: snapshot.id,
      actionType: "logic_check",
      provider: result.provider,
      model: result.model,
      meta: { prompt: "check/logic.v1.md" }
    });

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse(
      {
        truthSnapshotId: snapshot.id,
        issues: result.issues
      },
      { requestId }
    );
  } catch (error) {
    console.error(routeLabel, {
      route: routeLabel,
      requestId,
      status: 500,
      latencyMs: Date.now() - startedAt,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error
    });
    return jsonError(
      500,
      "AI 逻辑审查失败",
      { message: error instanceof Error ? error.message : String(error) },
      requestId
    );
  }
}
