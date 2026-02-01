import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";
import {
  canTransitionProjectStatus,
  getAllowedNextStatuses,
  normalizeProjectStatus
} from "@/lib/domain";
import { getCommunitySummary } from "@/app/api/community/utils";
import { runPublishGate } from "@/lib/publishGate";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/status";

type ParsedJsonBody =
  | { ok: true; body: Record<string, unknown>; raw: string }
  | { ok: false; message: string; raw?: string };

async function parseJsonBody(request: Request): Promise<ParsedJsonBody> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, message: "unsupported content-type" };
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {}

  const trimmed = raw.replace(/^\uFEFF/, "").trim();
  if (trimmed) {
    try {
      const body = JSON.parse(trimmed);
      if (body && typeof body === "object" && !Array.isArray(body)) {
        return { ok: true, body: body as Record<string, unknown>, raw };
      }
    } catch {}
  }

  return { ok: false, message: "invalid json", raw };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return jsonError(400, parsed.message, undefined, requestId);
  }

  const rawNextStatus =
    typeof parsed.body?.nextStatus === "string" ? parsed.body.nextStatus : "";
  const nextStatus = normalizeProjectStatus(rawNextStatus);
  if (!nextStatus) {
    return jsonError(400, "不支持的状态值", { nextStatus: rawNextStatus }, requestId);
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

  const currentStatus =
    normalizeProjectStatus(project.status) ?? "DRAFT";

  if (currentStatus === nextStatus) {
    return jsonResponse({ status: currentStatus }, { requestId });
  }

  if (!canTransitionProjectStatus(currentStatus, nextStatus)) {
    return jsonError(
      409,
      "非法状态流转",
      { currentStatus, nextStatus, allowed: getAllowedNextStatuses(currentStatus) },
      requestId
    );
  }

  const now = new Date().toISOString();

  if (nextStatus === "TRUTH_LOCKED") {
    const [truth] = await db
      .select()
      .from(schema.truths)
      .where(eq(schema.truths.projectId, projectId))
      .orderBy(desc(schema.truths.createdAt))
      .limit(1);
    if (!truth || truth.status !== "LOCKED") {
      return jsonError(409, "真相未锁定，无法进入该状态", undefined, requestId);
    }
  }

  if (nextStatus === "DRAFT") {
    const [truth] = await db
      .select()
      .from(schema.truths)
      .where(eq(schema.truths.projectId, projectId))
      .orderBy(desc(schema.truths.createdAt))
      .limit(1);
    if (truth?.status === "LOCKED") {
      return jsonError(409, "真相仍为锁定状态，请先解锁", undefined, requestId);
    }
  }

  if (nextStatus === "PUBLISHED") {
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
    await db
      .update(schema.projects)
      .set({
        isPublic: 1,
        publishedAt: now,
        communitySummary: summary ?? project.communitySummary,
        status: nextStatus,
        updatedAt: now
      })
      .where(eq(schema.projects.id, projectId));
  } else if (nextStatus === "ARCHIVED") {
    await db
      .update(schema.projects)
      .set({
        isPublic: 0,
        publishedAt: null,
        status: nextStatus,
        updatedAt: now
      })
      .where(eq(schema.projects.id, projectId));
  } else {
    await db
      .update(schema.projects)
      .set({ status: nextStatus, updatedAt: now })
      .where(eq(schema.projects.id, projectId));
  }

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse({ status: nextStatus }, { requestId });
}
