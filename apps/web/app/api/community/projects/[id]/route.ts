import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../../lib/http";
import { getAuthUser } from "../../../../../lib/auth";
import {
  getAiStatus,
  getCommunityCounts,
  getGlobalRatingStats,
  getRatingSummary,
  getTruthStatus
} from "../../utils";

export const runtime = "edge";

const routeLabel = "GET /api/community/projects/:id";

type CommunityComment = {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isSuggestion: boolean;
  status: string;
  replies: CommunityComment[];
};

function toCommentTree(
  comments: {
    id: string;
    projectId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    parentId: string | null;
    isSuggestion: number;
    status: string;
    username: string;
  }[]
) {
  const root: CommunityComment[] = [];
  const map = new Map<string, CommunityComment>();

  comments.forEach((item) => {
    const node: CommunityComment = {
      id: item.id,
      projectId: item.projectId,
      userId: item.userId,
      username: item.username,
      content: item.content,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isSuggestion: item.isSuggestion === 1,
      status: item.status,
      replies: []
    };
    map.set(item.id, node);
  });

  comments.forEach((item) => {
    const node = map.get(item.id);
    if (!node) return;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)?.replies.push(node);
    } else {
      root.push(node);
    }
  });

  return root;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const { id: projectId } = await Promise.resolve(params);

  try {
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);

    if (!project) {
      return jsonError(404, "project not found", undefined, requestId);
    }

    const user = await getAuthUser(request);
    const isPublic = project.isPublic === 1;
    const isOwner = user && project.ownerId === user.id;
    if (!isPublic && !isOwner) {
      return jsonError(404, "project not found", undefined, requestId);
    }

    const [owner] = project.ownerId
      ? await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, project.ownerId))
          .limit(1)
      : [];

    const truthStatus = await getTruthStatus(projectId);
    const aiStatus = await getAiStatus(projectId);
    const ratingGlobal = await getGlobalRatingStats();
    const ratingSummary = await getRatingSummary(projectId, ratingGlobal.average);
    const counts = await getCommunityCounts(projectId);

    const [overview] = await db
      .select()
      .from(schema.moduleDocuments)
      .where(
        and(
          eq(schema.moduleDocuments.projectId, projectId),
          eq(schema.moduleDocuments.module, "overview")
        )
      )
      .limit(1);

    const comments = await db
      .select({
        id: schema.comments.id,
        projectId: schema.comments.projectId,
        userId: schema.comments.userId,
        parentId: schema.comments.parentId,
        content: schema.comments.content,
        createdAt: schema.comments.createdAt,
        updatedAt: schema.comments.updatedAt,
        isSuggestion: schema.comments.isSuggestion,
        status: schema.comments.status,
        username: schema.users.username
      })
      .from(schema.comments)
      .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
      .where(eq(schema.comments.projectId, projectId))
      .orderBy(desc(schema.comments.createdAt));

    const tree = toCommentTree(
      comments.map((item) => ({
        ...item,
        username: item.username || "匿名用户"
      }))
    );

    const userState = user
      ? {
          rating: (
            await db
              .select()
              .from(schema.ratings)
              .where(
                and(
                  eq(schema.ratings.projectId, projectId),
                  eq(schema.ratings.userId, user.id)
                )
              )
              .limit(1)
          )[0]?.score ?? null,
          liked: Boolean(
            (
              await db
                .select()
                .from(schema.likes)
                .where(
                  and(
                    eq(schema.likes.projectId, projectId),
                    eq(schema.likes.userId, user.id)
                  )
                )
                .limit(1)
            )[0]
          ),
          favorited: Boolean(
            (
              await db
                .select()
                .from(schema.favorites)
                .where(
                  and(
                    eq(schema.favorites.projectId, projectId),
                    eq(schema.favorites.userId, user.id)
                  )
                )
                .limit(1)
            )[0]
          )
        }
      : {
          rating: null,
          liked: false,
          favorited: false
        };

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse(
      {
        project: {
          id: project.id,
          name: project.name,
          description: project.description ?? "",
          meta: project.meta ?? null,
          communitySummary: project.communitySummary ?? null,
          isPublic: project.isPublic === 1,
          publishedAt: project.publishedAt ?? null,
          updatedAt: project.updatedAt ?? null,
          ownerId: project.ownerId ?? null
        },
        author: {
          id: project.ownerId ?? null,
          username: owner?.username ?? "匿名作者"
        },
        overview: overview?.content ?? { type: "doc", content: [] },
        truthStatus,
        aiStatus,
        ratingSummary,
        counts,
        comments: tree,
        userState,
        isOwner
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
    return jsonError(500, "failed to load community project", undefined, requestId);
  }
}
