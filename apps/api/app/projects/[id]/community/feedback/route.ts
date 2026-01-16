import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, schema } from "../../../../../lib/db";
import { jsonError } from "../../../../../lib/http";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const type = typeof body?.type === "string" ? body.type.trim() : null;
  const meta = body?.meta ?? null;

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    return jsonError(404, "project not found");
  }

  if (!content) {
    return jsonError(400, "content is required");
  }

  const feedbackId = randomUUID();

  await db.insert(schema.feedback).values({
    id: feedbackId,
    projectId,
    content,
    type,
    meta
  });

  return NextResponse.json({
    feedbackId
  });
}

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

  const feedbackList = await db
    .select()
    .from(schema.feedback)
    .where(eq(schema.feedback.projectId, projectId))
    .orderBy(desc(schema.feedback.createdAt))
    .limit(50);

  return NextResponse.json({
    feedback: feedbackList
  });
}
