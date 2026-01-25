import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";
import { getCommunitySummary } from "@/app/api/community/utils";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/publish";

export async function POST(
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

    const summary = await getCommunitySummary(projectId);
    const now = new Date().toISOString();

    await db
      .update(schema.projects)
      .set({
        isPublic: 1,
        publishedAt: now,
        communitySummary: summary ?? project.communitySummary,
        updatedAt: now
      })
      .where(eq(schema.projects.id, projectId));

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ published: true, publishedAt: now }, { requestId });
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
    return jsonError(500, "failed to publish project", undefined, requestId);
  }
}


