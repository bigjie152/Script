import { and, eq } from "drizzle-orm";
import { db, schema } from "../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../lib/http";
import { getAuthUser } from "../../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "API /api/projects/:id/modules/:module";
const MODULES = ["overview", "roles", "clues", "timeline", "dm"] as const;

type ModuleKey = (typeof MODULES)[number];

type ParsedJsonBody =
  | { ok: true; body: Record<string, unknown>; raw: string }
  | { ok: false; message: string; raw?: string };

function resolveModule(value: string | undefined | null) {
  if (!value) return null;
  if ((MODULES as readonly string[]).includes(value)) {
    return value as ModuleKey;
  }
  return null;
}

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; module: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const resolved = await Promise.resolve(params);
  const projectId = resolved.id;
  const moduleKey = resolveModule(resolved.module);

  if (!moduleKey) {
    return jsonError(400, "unsupported module", undefined, requestId);
  }

  const [doc] = await db
    .select()
    .from(schema.moduleDocuments)
    .where(
      and(
        eq(schema.moduleDocuments.projectId, projectId),
        eq(schema.moduleDocuments.module, moduleKey)
      )
    )
    .limit(1);

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      module: moduleKey,
      documentId: doc?.id ?? null,
      content: doc?.content ?? { type: "doc", content: [] }
    },
    { requestId }
  );
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; module: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const resolved = await Promise.resolve(params);
  const projectId = resolved.id;
  const moduleKey = resolveModule(resolved.module);

  if (!moduleKey) {
    return jsonError(400, "unsupported module", undefined, requestId);
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return jsonError(400, parsed.message, undefined, requestId);
  }

  const body = parsed.body;
  const content = body?.content;

  if (!content) {
    return jsonError(400, "content is required", undefined, requestId);
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

  if (!project.ownerId) {
    await db
      .update(schema.projects)
      .set({ ownerId: user.id, updatedAt: new Date().toISOString() })
      .where(eq(schema.projects.id, projectId));
  }

  const [existing] = await db
    .select()
    .from(schema.moduleDocuments)
    .where(
      and(
        eq(schema.moduleDocuments.projectId, projectId),
        eq(schema.moduleDocuments.module, moduleKey)
      )
    )
    .limit(1);

  let documentId = existing?.id;
  if (existing) {
    await db
      .update(schema.moduleDocuments)
      .set({ content, updatedAt: new Date().toISOString() })
      .where(eq(schema.moduleDocuments.id, existing.id));
  } else {
    documentId = crypto.randomUUID();
    await db.insert(schema.moduleDocuments).values({
      id: documentId,
      projectId,
      module: moduleKey,
      content
    });
  }
  await db
    .update(schema.projects)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(schema.projects.id, projectId));

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      module: moduleKey,
      documentId,
      status: "DRAFT"
    },
    { requestId }
  );
}
