import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/truth/unlock";

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

  const reason =
    typeof parsed.body?.reason === "string" ? parsed.body.reason.trim() : "";
  if (!reason) {
    return jsonError(400, "解锁原因必填", undefined, requestId);
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

  const [truth] = await db
    .select()
    .from(schema.truths)
    .where(eq(schema.truths.projectId, projectId))
    .orderBy(desc(schema.truths.createdAt))
    .limit(1);

  if (!truth) {
    console.error(routeLabel, {
      route: routeLabel,
      requestId,
      status: 404,
      latencyMs: Date.now() - startedAt,
      error: { message: "truth not found" }
    });
    return jsonError(404, "truth not found", undefined, requestId);
  }

  if (truth.status !== "DRAFT") {
    await db
      .update(schema.truths)
      .set({ status: "DRAFT", updatedAt: new Date().toISOString() })
      .where(eq(schema.truths.id, truth.id));
  }

  await db
    .update(schema.projects)
    .set({ status: "DRAFT", updatedAt: new Date().toISOString() })
    .where(eq(schema.projects.id, projectId));

  const unlockedAt = new Date().toISOString();
  await db.insert(schema.truthUnlockLogs).values({
    id: crypto.randomUUID(),
    projectId,
    reason,
    unlockedBy: user.id,
    unlockedAt
  });

  const [latestSnapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(eq(schema.truthSnapshots.projectId, projectId))
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  const moduleDocs = await db
    .select()
    .from(schema.moduleDocuments)
    .where(eq(schema.moduleDocuments.projectId, projectId));

  if (moduleDocs.length) {
    await Promise.all(
      moduleDocs.map((doc) =>
        db
          .update(schema.moduleDocuments)
          .set({ needsReview: 1, updatedAt: new Date().toISOString() })
          .where(eq(schema.moduleDocuments.id, doc.id))
      )
    );
  }

  const affectedItems = {
    modules: moduleDocs.map((doc) => ({
      module: doc.module,
      documentId: doc.id
    })),
    totalModules: moduleDocs.length
  };

  const impactReportId = crypto.randomUUID();
  await db.insert(schema.impactReports).values({
    id: impactReportId,
    projectId,
    truthSnapshotId: latestSnapshot?.id ?? null,
    affectedItems,
    createdAt: unlockedAt
  });

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      truthId: truth.id,
      status: "DRAFT",
      impactReportId,
      affectedItems
    },
    { requestId }
  );
}
