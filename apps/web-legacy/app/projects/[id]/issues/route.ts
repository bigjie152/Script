import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../../../../lib/db";
import { jsonResponse } from "../../../../lib/http";

export const runtime = "edge";

const routeLabel = "GET /api/projects/:id/issues";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);
  const url = new URL(request.url);
  const requestedSnapshotId = url.searchParams.get("truthSnapshotId");

  const [snapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(
      requestedSnapshotId
        ? and(
            eq(schema.truthSnapshots.id, requestedSnapshotId),
            eq(schema.truthSnapshots.projectId, projectId)
          )
        : eq(schema.truthSnapshots.projectId, projectId)
    )
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  if (!snapshot) {
    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });
    return jsonResponse(
      {
        truthSnapshotId: null,
        issues: []
      },
      { requestId }
    );
  }

  const issues = await db
    .select()
    .from(schema.issues)
    .where(eq(schema.issues.truthSnapshotId, snapshot.id))
    .orderBy(desc(schema.issues.createdAt));

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      truthSnapshotId: snapshot.id,
      issues
    },
    { requestId }
  );
}
