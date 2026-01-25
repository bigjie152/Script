import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "GET /api/projects/:id";
const updateLabel = "PUT /api/projects/:id";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const { id: projectId } = await Promise.resolve(params);

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!project) {
      console.error(routeLabel, {
        route: routeLabel,
        requestId,
        status: 404,
        latencyMs: Date.now() - startedAt,
        error: { message: "project not found" }
      });
      return jsonError(404, "project not found", undefined, requestId);
    }

    const [truth] = await db
      .select()
      .from(schema.truths)
      .where(eq(schema.truths.projectId, projectId))
      .orderBy(desc(schema.truths.createdAt))
      .limit(1);

    const [snapshot] = await db
      .select()
      .from(schema.truthSnapshots)
      .where(eq(schema.truthSnapshots.projectId, projectId))
      .orderBy(desc(schema.truthSnapshots.createdAt))
      .limit(1);

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse(
      {
        project,
        truth: truth || null,
        latestSnapshotId: snapshot?.id ?? null
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
    return jsonError(500, "failed to load project", undefined, requestId);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const { id: projectId } = await Promise.resolve(params);
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) {
      return jsonError(400, parsed.message, undefined, requestId);
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

    const { name, description, meta } = parsed.body;

    if (!name && !description && !meta) {
      return jsonError(400, "no fields to update", undefined, requestId);
    }

    const existingMeta =
      project.meta && typeof project.meta === "object" ? project.meta : null;

    await db
      .update(schema.projects)
      .set({
        name: typeof name === "string" ? name : project.name,
        description:
          typeof description === "string" ? description : project.description,
        meta: meta && typeof meta === "object" ? meta : existingMeta,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.projects.id, projectId));

    const [nextProject] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    console.log(updateLabel, {
      route: updateLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse(
      {
        project: nextProject ?? project
      },
      { requestId }
    );
  } catch (error) {
    console.error(updateLabel, {
      route: updateLabel,
      requestId,
      status: 500,
      latencyMs: Date.now() - startedAt,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error
    });
    return jsonError(500, "failed to update project", undefined, requestId);
  }
}

