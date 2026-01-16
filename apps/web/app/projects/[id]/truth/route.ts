import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "../../../../lib/db";
import { jsonError } from "../../../../lib/http";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await Promise.resolve(params);
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return jsonError(400, parsed.message);
  }

  const body = parsed.body;
  const content = body?.content;

  if (!content) {
    return jsonError(400, "content is required");
  }

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    return jsonError(404, "project not found");
  }

  const [truth] = await db
    .select()
    .from(schema.truths)
    .where(eq(schema.truths.projectId, projectId))
    .orderBy(desc(schema.truths.createdAt))
    .limit(1);

  if (truth && truth.status === "LOCKED") {
    return jsonError(409, "truth is locked");
  }

  if (truth) {
    await db
      .update(schema.truths)
      .set({ content, updatedAt: new Date().toISOString() })
      .where(eq(schema.truths.id, truth.id));

    return NextResponse.json({
      truthId: truth.id,
      status: "DRAFT"
    });
  }

  const truthId = crypto.randomUUID();
  await db.insert(schema.truths).values({
    id: truthId,
    projectId,
    status: "DRAFT",
    content
  });

  return NextResponse.json({
    truthId,
    status: "DRAFT"
  });
}
