import { desc, eq } from "drizzle-orm";
import { db, schema } from "../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../lib/http";
import { getAuthUser } from "../../../../lib/auth";

export const runtime = "edge";

const routeLabel = "GET /api/me/notifications";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return jsonError(401, "login required", undefined, requestId);
    }

    const rows = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, user.id))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(200);

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse(
      {
        notifications: rows.map((item) => ({
          id: item.id,
          type: item.type,
          payload: item.payload ?? null,
          isRead: item.isRead === 1,
          createdAt: item.createdAt
        }))
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
    return jsonError(500, "failed to load notifications", undefined, requestId);
  }
}
