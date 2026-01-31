import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/status";

const STATUS_FLOW = ["DRAFT", "TRUTH_LOCKED", "PUBLISHED", "ARCHIVED"] as const;

type ProjectStatus = (typeof STATUS_FLOW)[number];

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

function isValidNext(current: ProjectStatus, next: ProjectStatus) {
  const currentIndex = STATUS_FLOW.indexOf(current);
  const nextIndex = STATUS_FLOW.indexOf(next);
  return currentIndex !== -1 && nextIndex === currentIndex + 1;
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

  const nextStatusRaw = parsed.body?.nextStatus;
  if (typeof nextStatusRaw !== "string") {
    return jsonError(400, "nextStatus 必填", undefined, requestId);
  }

  const nextStatus = nextStatusRaw.toUpperCase() as ProjectStatus;
  if (!STATUS_FLOW.includes(nextStatus)) {
    return jsonError(400, "无效状态", undefined, requestId);
  }

  const user = await getAuthUser(request);
  if (!user) {
    return jsonError(401, "login required", undefined, requestId);
  }

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    return jsonError(404, "project not found", undefined, requestId);
  }

  if (project.ownerId && project.ownerId !== user.id) {
    return jsonError(403, "forbidden", undefined, requestId);
  }

  const current =
    typeof project.status === "string" ? project.status.toUpperCase() : "DRAFT";
  if (!STATUS_FLOW.includes(current as ProjectStatus)) {
    return jsonError(400, "当前状态无效", undefined, requestId);
  }

  if (!isValidNext(current as ProjectStatus, nextStatus)) {
    return jsonError(400, "状态流转不合法", undefined, requestId);
  }

  if (nextStatus === "TRUTH_LOCKED") {
    const [truth] = await db
      .select()
      .from(schema.truths)
      .where(eq(schema.truths.projectId, projectId))
      .orderBy(desc(schema.truths.createdAt))
      .limit(1);
    if (!truth || truth.status !== "LOCKED") {
      return jsonError(409, "需先锁定 Truth 才能进入该状态", undefined, requestId);
    }
  }

  if (nextStatus === "PUBLISHED") {
    if (current !== "TRUTH_LOCKED") {
      return jsonError(409, "需先完成 Truth 锁定", undefined, requestId);
    }
  }

  const now = new Date().toISOString();
  await db
    .update(schema.projects)
    .set({ status: nextStatus, updatedAt: now })
    .where(eq(schema.projects.id, projectId));

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse({ status: nextStatus }, { requestId });
}
