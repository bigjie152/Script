import { and, eq } from "drizzle-orm";
import { db, schema } from "../../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../../lib/http";
import { getAuthUser } from "../../../../../../lib/auth";
import { getGlobalRatingStats, getRatingSummary } from "../../../utils";

export const runtime = "edge";

const routeLabel = "PUT /api/community/projects/:id/rating";

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
    const score = Number(body?.score);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return jsonError(400, "score must be 1-5", undefined, requestId);
    }

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
      .from(schema.ratings)
      .where(
        and(
          eq(schema.ratings.projectId, projectId),
          eq(schema.ratings.userId, user.id)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(schema.ratings)
        .set({ score, updatedAt: new Date().toISOString() })
        .where(eq(schema.ratings.id, existing.id));
    } else {
      await db.insert(schema.ratings).values({
        id: crypto.randomUUID(),
        projectId,
        userId: user.id,
        score
      });
    }

    const globalStats = await getGlobalRatingStats();
    const summary = await getRatingSummary(projectId, globalStats.average);

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ ratingSummary: summary }, { requestId });
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
    return jsonError(500, "failed to update rating", undefined, requestId);
  }
}
