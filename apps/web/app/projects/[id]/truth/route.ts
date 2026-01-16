import { desc, eq } from "drizzle-orm";
import { db, schema } from "../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../lib/http";

export const runtime = "edge";

const routeLabel = "PUT /api/projects/:id/truth";

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

  if (raw.includes("\u0000")) {
    const compact = raw.replace(/\u0000/g, "").replace(/^\uFEFF/, "").trim();
    if (compact) {
      try {
        const body = JSON.parse(compact);
        if (body && typeof body === "object" && !Array.isArray(body)) {
          return { ok: true, body: body as Record<string, unknown>, raw };
        }
      } catch {}
    }
  }

  return { ok: false, message: "invalid json", raw };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);
  const parsed = await parseJsonBody(request);

  if (!parsed.ok) {
    console.error(routeLabel, {
      route: routeLabel,
      requestId,
      status: 400,
      latencyMs: Date.now() - startedAt,
      error: { message: parsed.message }
    });
    return jsonError(400, parsed.message, undefined, requestId);
  }

  const body = parsed.body;
  const content = body?.content;

  if (!content) {
    console.error(routeLabel, {
      route: routeLabel,
      requestId,
      status: 400,
      latencyMs: Date.now() - startedAt,
      error: { message: "content is required" }
    });
    return jsonError(400, "content is required", undefined, requestId);
  }

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

  if (truth && truth.status === "LOCKED") {
    console.error(routeLabel, {
      route: routeLabel,
      requestId,
      status: 409,
      latencyMs: Date.now() - startedAt,
      error: { message: "truth is locked" }
    });
    return jsonError(409, "truth is locked", undefined, requestId);
  }

  if (truth) {
    await db
      .update(schema.truths)
      .set({ content, updatedAt: new Date().toISOString() })
      .where(eq(schema.truths.id, truth.id));

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse(
      {
        truthId: truth.id,
        status: "DRAFT"
      },
      { requestId }
    );
  }

  const truthId = crypto.randomUUID();
  await db.insert(schema.truths).values({
    id: truthId,
    projectId,
    status: "DRAFT",
    content
  });

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      truthId,
      status: "DRAFT"
    },
    { requestId }
  );
}
