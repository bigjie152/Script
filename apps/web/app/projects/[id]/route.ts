import { desc, eq } from "drizzle-orm";
import { db, schema } from "../../../lib/db";
import { jsonError, jsonResponse } from "../../../lib/http";

export const runtime = "edge";

const routeLabel = "GET /api/projects/:id";

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
