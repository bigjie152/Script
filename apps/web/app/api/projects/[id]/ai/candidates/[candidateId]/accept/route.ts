import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { jsonError, jsonResponse } from "@/lib/http";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const routeLabel = "POST /api/projects/:id/ai/candidates/:candidateId/accept";

function normalizeDoc(content: unknown, fallback: string) {
  if (content && typeof content === "object") {
    return content as Record<string, unknown>;
  }
  const text = typeof content === "string" ? content : fallback;
  return {
    type: "doc",
    content: text
      ? [
          {
            type: "paragraph",
            content: [{ type: "text", text }]
          }
        ]
      : []
  };
}

function ensureCollection(content: unknown) {
  if (
    content &&
    typeof content === "object" &&
    (content as any).kind === "collection" &&
    Array.isArray((content as any).entries)
  ) {
    return content as { kind: "collection"; entries: Array<Record<string, unknown>>; activeId?: string | null };
  }
  return { kind: "collection", entries: [], activeId: null };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId, candidateId } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));
  const targetEntryId = typeof body?.entryId === "string" ? body.entryId : null;

  const user = await getAuthUser(request);
  if (!user) {
    return jsonError(401, "请先登录", undefined, requestId);
  }

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) {
    return jsonError(404, "项目不存在", undefined, requestId);
  }

  if (project.ownerId && project.ownerId !== user.id) {
    return jsonError(403, "无权限访问", undefined, requestId);
  }

  const [candidate] = await db
    .select()
    .from(schema.aiCandidates)
    .where(
      and(
        eq(schema.aiCandidates.id, candidateId),
        eq(schema.aiCandidates.projectId, projectId)
      )
    )
    .limit(1);

  if (!candidate) {
    return jsonError(404, "候选内容不存在", undefined, requestId);
  }

  if (candidate.status !== "pending") {
    return jsonResponse({ status: candidate.status }, { requestId });
  }

  const now = new Date().toISOString();

  if (candidate.target !== "insight") {
    const module =
      candidate.target === "story"
        ? "story"
        : candidate.target === "role"
          ? "roles"
          : candidate.target === "clue"
            ? "clues"
            : candidate.target === "timeline"
              ? "timeline"
              : candidate.target === "dm"
                ? "dm"
                : null;

    if (!module) {
      return jsonError(400, "候选目标类型不支持", undefined, requestId);
    }

    const [doc] = await db
      .select()
      .from(schema.moduleDocuments)
      .where(
        and(
          eq(schema.moduleDocuments.projectId, projectId),
          eq(schema.moduleDocuments.module, module)
        )
      )
      .limit(1);

    if (module === "story") {
      const baseDoc = normalizeDoc(doc?.content, "");
      const incoming = normalizeDoc(candidate.content, candidate.summary || candidate.title || "");
      const merged = {
        type: "doc",
        content: [
          ...(((baseDoc as any).content as unknown[]) || []),
          ...(((incoming as any).content as unknown[]) || [])
        ]
      };
      if (doc) {
        await db
          .update(schema.moduleDocuments)
          .set({ content: merged, needsReview: 0, updatedAt: now })
          .where(eq(schema.moduleDocuments.id, doc.id));
      } else {
        await db.insert(schema.moduleDocuments).values({
          id: crypto.randomUUID(),
          projectId,
          module,
          content: merged,
          needsReview: 0
        });
      }
    } else {
      const collection = ensureCollection(doc?.content);
      const entries = Array.isArray(collection.entries) ? collection.entries : [];
      const entryId =
        targetEntryId && entries.some((entry) => entry.id === targetEntryId)
          ? targetEntryId
          : crypto.randomUUID();
      const nameBase =
        candidate.title ||
        (module === "roles"
          ? "角色"
          : module === "clues"
            ? "线索"
            : module === "timeline"
              ? "时间线"
              : "DM 手册");
      const incoming = normalizeDoc(candidate.content, candidate.summary || candidate.title || "");
      const mergeDoc = (base: unknown) => {
        const baseDoc = normalizeDoc(base, "");
        return {
          type: "doc",
          content: [
            ...(((baseDoc as any).content as unknown[]) || []),
            ...(((incoming as any).content as unknown[]) || [])
          ]
        };
      };
      const updatedEntries = entries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              content: mergeDoc(entry.content),
              updatedAt: now
            }
          : entry
      );
      const nextEntries = updatedEntries.some((entry) => entry.id === entryId)
        ? updatedEntries
        : [
            ...entries,
            {
              id: entryId,
              name: nameBase,
              content: incoming,
              meta: candidate.meta ?? {},
              data: {},
              placeholderId: entryId,
              updatedAt: now
            }
          ];
      const next = {
        kind: "collection",
        activeId: entryId,
        entries: nextEntries
      };
      if (doc) {
        await db
          .update(schema.moduleDocuments)
          .set({ content: next, needsReview: 0, updatedAt: now })
          .where(eq(schema.moduleDocuments.id, doc.id));
      } else {
        await db.insert(schema.moduleDocuments).values({
          id: crypto.randomUUID(),
          projectId,
          module,
          content: next,
          needsReview: 0
        });
      }
    }
  } else {
    const [truth] = await db
      .select()
      .from(schema.truths)
      .where(eq(schema.truths.projectId, projectId))
      .orderBy(desc(schema.truths.createdAt))
      .limit(1);

    const baseDoc = normalizeDoc(truth?.content, "");
    const incoming = normalizeDoc(
      candidate.content,
      candidate.summary || candidate.title || ""
    );
    const merged = {
      type: "doc",
      content: [
        ...(((baseDoc as any).content as unknown[]) || []),
        ...(((incoming as any).content as unknown[]) || [])
      ]
    };

    if (truth) {
      await db
        .update(schema.truths)
        .set({ content: merged, updatedAt: now })
        .where(eq(schema.truths.id, truth.id));
    } else {
      await db.insert(schema.truths).values({
        id: crypto.randomUUID(),
        projectId,
        status: "DRAFT",
        content: merged
      });
    }
  }

  await db
    .update(schema.aiCandidates)
    .set({ status: "accepted", updatedAt: now })
    .where(eq(schema.aiCandidates.id, candidateId));

  await db
    .update(schema.projects)
    .set({ updatedAt: now })
    .where(eq(schema.projects.id, projectId));

  console.log(routeLabel, {
    route: routeLabel,
    requestId,
    status: 200,
    latencyMs: Date.now() - startedAt
  });

  return jsonResponse(
    {
      status: "accepted"
    },
    { requestId }
  );
}
