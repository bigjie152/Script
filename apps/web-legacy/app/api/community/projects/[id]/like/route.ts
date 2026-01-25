import { and, eq } from "drizzle-orm";
import { db, schema } from "../../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../../lib/http";
import { getAuthUser } from "../../../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "PUT /api/community/projects/:id/like";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return jsonError(401, "login required", undefined, requestId);
    }

    const body = await request.json().catch(() => ({}));
    const on = Boolean(body?.on);

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);
    if (!project || project.isPublic !== 1) {
      return jsonError(404, "project not found", undefined, requestId);
    }

    const [existing] = await db
      .select()
      .from(schema.likes)
      .where(
        and(eq(schema.likes.projectId, projectId), eq(schema.likes.userId, user.id))
      )
      .limit(1);

    if (on && !existing) {
      await db.insert(schema.likes).values({
        id: crypto.randomUUID(),
        projectId,
        userId: user.id
      });
    }
    if (!on && existing) {
      await db.delete(schema.likes).where(eq(schema.likes.id, existing.id));
    }

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ liked: on }, { requestId });
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
    return jsonError(500, "failed to update like", undefined, requestId);
  }
}
