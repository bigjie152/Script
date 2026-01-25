import { and, eq } from "drizzle-orm";
import { db, schema } from "../../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../../lib/http";
import { getAuthUser } from "../../../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "PUT /api/community/projects/:id/favorite";

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
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.projectId, projectId),
          eq(schema.favorites.userId, user.id)
        )
      )
      .limit(1);

    if (on && !existing) {
      await db.insert(schema.favorites).values({
        id: crypto.randomUUID(),
        projectId,
        userId: user.id
      });
    }
    if (!on && existing) {
      await db.delete(schema.favorites).where(eq(schema.favorites.id, existing.id));
    }

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ favorited: on }, { requestId });
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
    return jsonError(500, "failed to update favorite", undefined, requestId);
  }
}
