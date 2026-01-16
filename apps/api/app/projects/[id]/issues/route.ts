import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../../../../lib/db";
import { jsonError } from "../../../../lib/http";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    return jsonError(404, "truth snapshot not found");
  }

  const issues = await db
    .select()
    .from(schema.issues)
    .where(eq(schema.issues.truthSnapshotId, snapshot.id))
    .orderBy(desc(schema.issues.createdAt));

  return NextResponse.json({
    truthSnapshotId: snapshot.id,
    issues
  });
}
