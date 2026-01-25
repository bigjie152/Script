import { and, eq } from "drizzle-orm";
import { db, schema } from "../../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../../lib/http";
import { getAuthUser } from "../../../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/community/comments/:id/accept";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: commentId } = await Promise.resolve(params);

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return jsonError(401, "login required", undefined, requestId);
    }

    const [comment] = await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.id, commentId))
      .limit(1);
    if (!comment) {
      return jsonError(404, "comment not found", undefined, requestId);
    }
    if (comment.isSuggestion !== 1) {
      return jsonError(400, "comment is not a suggestion", undefined, requestId);
    }

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, comment.projectId))
      .limit(1);
    if (!project) {
      return jsonError(404, "project not found", undefined, requestId);
    }
    if (project.ownerId !== user.id) {
      return jsonError(403, "forbidden", undefined, requestId);
    }

    await db
      .update(schema.comments)
      .set({ status: "accepted", updatedAt: new Date().toISOString() })
      .where(eq(schema.comments.id, commentId));

    await db.insert(schema.notifications).values({
      id: crypto.randomUUID(),
      userId: comment.userId,
      type: "suggestion_accepted",
      payload: {
        projectId: comment.projectId,
        commentId,
        projectName: project.name
      }
    });

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ accepted: true }, { requestId });
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
    return jsonError(500, "failed to accept suggestion", undefined, requestId);
  }
}
