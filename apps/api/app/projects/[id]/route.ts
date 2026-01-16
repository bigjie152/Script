import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "../../../lib/db";
import { jsonError } from "../../../lib/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await Promise.resolve(params);

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    return jsonError(404, "project not found");
  }

  const [truth] = await db
    .select()
    .from(schema.truths)
    .where(eq(schema.truths.projectId, projectId))
    .orderBy(desc(schema.truths.createdAt))
    .limit(1);

  const [snapshot] = await db
    .select()
    .from(schema.truthSnapshots)
    .where(eq(schema.truthSnapshots.projectId, projectId))
    .orderBy(desc(schema.truthSnapshots.createdAt))
    .limit(1);

  return NextResponse.json({
    project,
    truth: truth || null,
    latestSnapshotId: snapshot?.id ?? null
  });
}
