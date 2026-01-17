import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../lib/http";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/truth/lock";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);

  const [truth] = await db
    .select()
    .from(schema.truths)
    .where(eq(schema.truths.projectId, projectId))
    .orderBy(desc(schema.truths.createdAt))
    .limit(1);

  if (!truth) {
    console.error(routeLabel, {
      route: routeLabel,
      requestId,
      status: 404,
      latencyMs: Date.now() - startedAt,
      error: { message: "truth not found" }
    });
    return jsonError(404, "truth not found", undefined, requestId);
  }

  const [latestSnapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(eq(schema.truthSnapshots.projectId, projectId))
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  if (truth.status === "LOCKED" && latestSnapshot) {
    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });
    return jsonResponse(
      {
        truthSnapshotId: latestSnapshot.id,
        version: latestSnapshot.version,
        status: "LOCKED"
      },
      { requestId }
    );
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.truthSnapshots)
    .where(eq(schema.truthSnapshots.projectId, projectId));

  const version = Number(count || 0) + 1;
  const snapshotId = crypto.randomUUID();

  await db.insert(schema.truthSnapshots).values({
    id: snapshotId,
    projectId,
    truthId: truth.id,
    version,
    content: truth.content
  });

  await db
    .update(schema.truths)
    .set({ status: "LOCKED", updatedAt: new Date().toISOString() })
    .where(eq(schema.truths.id, truth.id));

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      truthSnapshotId: snapshotId,
      version,
      status: "LOCKED"
    },
    { requestId }
  );
}
