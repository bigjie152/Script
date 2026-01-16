import { db, getD1Binding, schema } from "../../lib/db";
import { jsonError, jsonResponse } from "../../lib/http";

export const runtime = "edge";

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

const routeLabel = "POST /api/projects";

function logError(context: {
  message: string;
  requestId: string;
  status: number;
  contentType: string;
  startedAt: number;
  body?: unknown;
  error?: unknown;
}) {
  console.error(routeLabel, {
    route: routeLabel,
    ...context,
    latencyMs: Date.now() - context.startedAt,
    error:
      context.error instanceof Error
        ? { message: context.error.message, stack: context.error.stack }
        : context.error
  });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const contentType = request.headers.get("content-type") || "";

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    logError({
      message: parsed.message,
      requestId,
      status: 400,
      contentType,
      startedAt,
      body: parsed.raw
        ? {
            rawPreview: parsed.raw.slice(0, 200),
            rawLength: parsed.raw.length,
            contentLength: request.headers.get("content-length") || ""
          }
        : { contentLength: request.headers.get("content-length") || "" }
    });
    return jsonError(400, parsed.message, undefined, requestId);
  }

  const body = parsed.body;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const content = body?.content ?? { type: "doc", content: [] };

  if (!name) {
    logError({
      message: "name is required",
      requestId,
      status: 400,
      contentType,
      startedAt,
      body
    });
    return jsonError(400, "name is required", undefined, requestId);
  }

  const bindingName = process.env.D1_BINDING || "DB";
  const binding = getD1Binding();
  if (!binding) {
    logError({
      message: "DB binding not found",
      requestId,
      status: 500,
      contentType,
      startedAt,
      body: { bindingName }
    });
    return jsonError(500, "DB binding not found", undefined, requestId);
  }

  try {
    const projectId = crypto.randomUUID();
    const truthId = crypto.randomUUID();

    await db.insert(schema.projects).values({
      id: projectId,
      name,
      description
    });

    await db.insert(schema.truths).values({
      id: truthId,
      projectId,
      status: "DRAFT",
      content
    });

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 201,
      latencyMs: Date.now() - startedAt
    });
    return jsonResponse(
      {
        project: { id: projectId, name, description },
        truth: { id: truthId, status: "DRAFT" },
        projectId,
        truthId,
        status: "DRAFT"
      },
      { status: 201, requestId }
    );
  } catch (error) {
    logError({
      message: "failed to create project",
      requestId,
      status: 500,
      contentType,
      startedAt,
      body,
      error
    });
    return jsonError(500, "failed to create project", undefined, requestId);
  }
}

