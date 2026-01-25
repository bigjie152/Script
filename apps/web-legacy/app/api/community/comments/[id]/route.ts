import { and, eq } from "drizzle-orm";
import { db, schema } from "../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../lib/http";
import { getAuthUser } from "../../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "API /api/community/comments/:id";

export async function PUT(
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

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return jsonError(400, "content is required", undefined, requestId);
    }

    const [comment] = await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.id, commentId))
      .limit(1);
    if (!comment) {
      return jsonError(404, "comment not found", undefined, requestId);
    }
    if (comment.userId !== user.id) {
      return jsonError(403, "forbidden", undefined, requestId);
    }

    await db
      .update(schema.comments)
      .set({ content, updatedAt: new Date().toISOString() })
      .where(eq(schema.comments.id, commentId));

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ commentId, content }, { requestId });
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
    return jsonError(500, "failed to update comment", undefined, requestId);
  }
}

export async function DELETE(
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

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, comment.projectId))
      .limit(1);
    const isOwner = project && project.ownerId === user.id;
    if (comment.userId !== user.id && !isOwner) {
      return jsonError(403, "forbidden", undefined, requestId);
    }

    await db
      .delete(schema.comments)
      .where(
        and(
          eq(schema.comments.projectId, comment.projectId),
          eq(schema.comments.parentId, commentId)
        )
      );
    await db.delete(schema.comments).where(eq(schema.comments.id, commentId));

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ deleted: true }, { requestId });
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
    return jsonError(500, "failed to delete comment", undefined, requestId);
  }
}
