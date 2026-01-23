import { inArray, eq } from "drizzle-orm";
import { db, schema } from "../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../lib/http";
import { getAuthUser } from "../../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "PUT /api/me/notifications/read";

export async function PUT(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return jsonError(401, "login required", undefined, requestId);
    }

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((value: unknown) => typeof value === "string")
      : [];

    if (ids.length === 0) {
      await db
        .update(schema.notifications)
        .set({ isRead: 1 })
        .where(eq(schema.notifications.userId, user.id));
    } else {
      await db
        .update(schema.notifications)
        .set({ isRead: 1 })
        .where(inArray(schema.notifications.id, ids));
    }

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ read: true }, { requestId });
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
    return jsonError(500, "failed to mark notifications read", undefined, requestId);
  }
}
