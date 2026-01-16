import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, schema } from "../../../../../lib/db";
import { jsonError } from "../../../../../lib/http";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await Promise.resolve(params);

  const [truth] = await db
    .select()
    .from(schema.truths)
    .where(eq(schema.truths.projectId, projectId))
    .orderBy(desc(schema.truths.createdAt))
    .limit(1);

  if (!truth) {
    return jsonError(404, "truth not found");
  }

  const [latestSnapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(eq(schema.truthSnapshots.projectId, projectId))
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  if (truth.status === "LOCKED" && latestSnapshot) {
    return NextResponse.json({
      truthSnapshotId: latestSnapshot.id,
      version: latestSnapshot.version,
      status: "LOCKED"
    });
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.truthSnapshots)
    .where(eq(schema.truthSnapshots.projectId, projectId));

  const version = Number(count || 0) + 1;
  const snapshotId = randomUUID();

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

  return NextResponse.json({
    truthSnapshotId: snapshotId,
    version,
    status: "LOCKED"
  });
}
