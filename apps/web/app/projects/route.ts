import { NextResponse } from "next/server";
import { db, getD1Binding, schema } from "../../lib/db";
import { jsonError } from "../../lib/http";

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
    const buffer = await request.clone().arrayBuffer();
    const rawUtf8 = new TextDecoder("utf-8").decode(buffer);
    raw = rawUtf8;
    const trimmed = rawUtf8.replace(/^\uFEFF/, "").trim();
    if (trimmed) {
      try {
        const body = JSON.parse(trimmed);
        if (body && typeof body === "object" && !Array.isArray(body)) {
          return { ok: true, body: body as Record<string, unknown>, raw };
        }
      } catch {}
    }

    if (rawUtf8.includes("\u0000")) {
      const rawUtf16 = new TextDecoder("utf-16le").decode(buffer);
      raw = rawUtf16;
      const trimmedUtf16 = rawUtf16.replace(/^\uFEFF/, "").trim();
      if (trimmedUtf16) {
        try {
          const body = JSON.parse(trimmedUtf16);
          if (body && typeof body === "object" && !Array.isArray(body)) {
            return { ok: true, body: body as Record<string, unknown>, raw };
          }
        } catch {}
      }
    }
  } catch {}

  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return { ok: true, body: body as Record<string, unknown>, raw };
    }
  } catch {}

  return { ok: false, message: "invalid json", raw };
}

function logError(context: {
  message: string;
  requestId: string;
  contentType: string;
  body?: unknown;
  error?: unknown;
}) {
  console.error("[POST /api/projects]", {
    ...context,
    error:
      context.error instanceof Error
        ? { message: context.error.message, stack: context.error.stack }
        : context.error
  });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const contentType = request.headers.get("content-type") || "";

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    logError({
      message: parsed.message,
      requestId,
      contentType,
      body: parsed.raw
        ? {
            rawPreview: parsed.raw.slice(0, 200),
            rawLength: parsed.raw.length,
            contentLength: request.headers.get("content-length") || ""
          }
        : { contentLength: request.headers.get("content-length") || "" }
    });
    return jsonError(400, parsed.message);
  }

  const body = parsed.body;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const content = body?.content ?? { type: "doc", content: [] };

  if (!name) {
    return jsonError(400, "name is required");
  }

  const bindingName = process.env.D1_BINDING || "DB";
  const binding = getD1Binding();
  if (!binding) {
    logError({
      message: "DB binding not found",
      requestId,
      contentType,
      body: { bindingName }
    });
    return jsonError(500, "DB binding not found");
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

    return NextResponse.json(
      {
        project: { id: projectId, name, description },
        truth: { id: truthId, status: "DRAFT" },
        projectId,
        truthId,
        status: "DRAFT"
      },
      { status: 201 }
    );
  } catch (error) {
    logError({
      message: "failed to create project",
      requestId,
      contentType,
      body,
      error
    });
    return jsonError(500, "failed to create project");
  }
}

