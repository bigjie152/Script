import { and, eq } from "drizzle-orm";
import { db, schema } from "../../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../../lib/http";
import { getAuthUser } from "../../../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/community/projects/:id/comments";

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

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const parentId = typeof body?.parentId === "string" ? body.parentId : null;
    const isSuggestion = Boolean(body?.isSuggestion);

    if (!content) {
      return jsonError(400, "content is required", undefined, requestId);
    }

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);
    if (!project || project.isPublic !== 1) {
      return jsonError(404, "project not found", undefined, requestId);
    }

    if (parentId) {
      const [parent] = await db
        .select()
        .from(schema.comments)
        .where(eq(schema.comments.id, parentId))
        .limit(1);
      if (!parent || parent.parentId) {
        return jsonError(400, "invalid parent comment", undefined, requestId);
      }
    }

    const commentId = crypto.randomUUID();
    await db.insert(schema.comments).values({
      id: commentId,
      projectId,
      userId: user.id,
      parentId,
      content,
      isSuggestion: isSuggestion ? 1 : 0,
      status: "normal"
    });

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 201,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse(
      {
        comment: {
          id: commentId,
          projectId,
          userId: user.id,
          content,
          parentId,
          isSuggestion,
          status: "normal",
          createdAt: new Date().toISOString()
        }
      },
      { requestId, status: 201 }
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
    return jsonError(500, "failed to create comment", undefined, requestId);
  }
}
