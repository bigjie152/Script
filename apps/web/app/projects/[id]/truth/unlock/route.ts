import { desc, eq } from "drizzle-orm";
import { db, schema } from "../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../lib/http";
import { getAuthUser } from "../../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/truth/unlock";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);

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
