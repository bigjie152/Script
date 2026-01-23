import { and, eq, inArray, desc } from "drizzle-orm";
import { db, schema } from "../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../lib/http";
import { getAuthUser } from "../../../../lib/auth";
import { getGlobalRatingStats, getRatingSummary, getTruthStatus } from "../../community/utils";

export const runtime = "edge";

const routeLabel = "GET /api/me/profile";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return jsonError(401, "login required", undefined, requestId);
    }

    const [dbUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    const publishedProjects = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.ownerId, user.id), eq(schema.projects.isPublic, 1)))
      .orderBy(desc(schema.projects.publishedAt))
      .limit(100);

    const globalRating = await getGlobalRatingStats();

    const myProjects = await Promise.all(
      publishedProjects.map(async (project) => ({
        id: project.id,
        name: project.name,
        description: project.description ?? "",
        publishedAt: project.publishedAt ?? null,
        updatedAt: project.updatedAt ?? null,
        truthStatus: await getTruthStatus(project.id),
        ratingSummary: await getRatingSummary(project.id, globalRating.average)
      }))
    );

    const favoriteRows = await db
      .select()
      .from(schema.favorites)
      .where(eq(schema.favorites.userId, user.id));
    const favoriteIds = favoriteRows.map((item) => item.projectId);
    const favoriteProjects = favoriteIds.length
      ? await db
          .select()
          .from(schema.projects)
          .where(inArray(schema.projects.id, favoriteIds))
      : [];

    const favorites = await Promise.all(
      favoriteProjects.map(async (project) => ({
        id: project.id,
        name: project.name,
        description: project.description ?? "",
        publishedAt: project.publishedAt ?? null,
        updatedAt: project.updatedAt ?? null,
        truthStatus: await getTruthStatus(project.id),
        ratingSummary: await getRatingSummary(project.id, globalRating.average)
      }))
    );

    const comments = await db
      .select({
        id: schema.comments.id,
        projectId: schema.comments.projectId,
        content: schema.comments.content,
        isSuggestion: schema.comments.isSuggestion,
        status: schema.comments.status,
        createdAt: schema.comments.createdAt,
        projectName: schema.projects.name
      })
      .from(schema.comments)
      .leftJoin(schema.projects, eq(schema.comments.projectId, schema.projects.id))
      .where(eq(schema.comments.userId, user.id))
      .orderBy(desc(schema.comments.createdAt))
      .limit(200);

    const acceptedCount = comments.filter((item) => item.status === "accepted").length;

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse(
      {
        user: {
          id: dbUser?.id ?? user.id,
          username: dbUser?.username ?? user.username
        },
        myProjects,
        favorites,
        interactions: comments.map((item) => ({
          id: item.id,
          projectId: item.projectId,
          projectName: item.projectName ?? "未知作品",
          content: item.content,
          isSuggestion: item.isSuggestion === 1,
          status: item.status,
          createdAt: item.createdAt
        })),
        acceptedSuggestionsCount: acceptedCount
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
    return jsonError(500, "failed to load profile", undefined, requestId);
  }
}
