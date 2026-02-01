import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";
import { getCommunitySummary } from "@/app/api/community/utils";
import { runPublishGate } from "@/lib/publishGate";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/publish";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);

  try {
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

    if (project.status === "ARCHIVED") {
      return jsonError(409, "项目已归档，无法发布", undefined, requestId);
    }

    const [truth] = await db
      .select()
      .from(schema.truths)
      .where(eq(schema.truths.projectId, projectId))
      .orderBy(desc(schema.truths.createdAt))
      .limit(1);

    if (!truth || truth.status !== "LOCKED") {
      return jsonError(409, "真相未锁定，无法发布", undefined, requestId);
    }

    const gate = await runPublishGate(projectId);

    if (!gate.truthSnapshotId) {
      return jsonError(409, "未找到 Truth 快照，无法发布", undefined, requestId);
    }

    if (!gate.ok) {
      return jsonError(
        409,
        "发布前校验未通过，请先修复结构或致命问题",
        {
          missingModules: gate.missingModules,
          needsReviewModules: gate.needsReviewModules,
          p0IssueCount: gate.p0IssueCount,
          p0Issues: gate.p0Issues
        },
        requestId
      );
    }

    const summary = await getCommunitySummary(projectId);
    const now = new Date().toISOString();

    await db
      .update(schema.projects)
      .set({
        isPublic: 1,
        publishedAt: now,
        communitySummary: summary ?? project.communitySummary,
        status: "PUBLISHED",
        updatedAt: now
      })
      .where(eq(schema.projects.id, projectId));

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ published: true, publishedAt: now }, { requestId });
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
    return jsonError(500, "发布失败，请稍后再试", undefined, requestId);
  }
}


