import { and, desc, eq, like, or } from "drizzle-orm";
import { db, schema } from "../../../../lib/db";
import { jsonError, jsonResponse } from "../../../../lib/http";
import {
  buildHotScore,
  getAiStatus,
  getCommunityCounts,
  getGlobalRatingStats,
  getRatingSummary,
  getTruthStatus
} from "../utils";

export const runtime = "edge";

const routeLabel = "GET /api/community/projects";

type CommunityProjectItem = {
  id: string;
  name: string;
  description: string;
  author: { id: string | null; username: string };
  genre: string | null;
  players: string | null;
  intro: string;
  cover: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  truthStatus: string;
  ratingSummary: {
    average: number;
    votes: number;
    displayScore: number;
  };
  counts: {
    likes: number;
    favorites: number;
    comments: number;
  };
  aiStatus: {
    issueCount: number;
    hasP0: boolean;
    lastCheckedAt: string | null;
  };
};

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const url = new URL(request.url);
  const sort = (url.searchParams.get("sort") || "latest").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const genreFilter = (url.searchParams.get("genre") || "").trim();
  const authorFilter = (url.searchParams.get("author") || "").trim();

  try {
    let ownerIdFilter: string | null = null;
    if (authorFilter) {
      const [author] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, authorFilter))
        .limit(1);
      if (!author) {
        return jsonResponse({ projects: [] }, { requestId });
      }
      ownerIdFilter = author.id;
    }

    const filters = [eq(schema.projects.isPublic, 1)];
    if (q) {
      const keyword = `%${q}%`;
      const condition = or(
        like(schema.projects.name, keyword),
        like(schema.projects.description, keyword)
      );
      if (condition) {
        filters.push(condition);
      }
    }
    if (ownerIdFilter) {
      filters.push(eq(schema.projects.ownerId, ownerIdFilter));
    }

    const projects = await db
      .select()
      .from(schema.projects)
      .where(and(...filters))
      .orderBy(desc(schema.projects.publishedAt));

    const globalRating = await getGlobalRatingStats();

    const items = await Promise.all(
      projects.map(async (project) => {
        const summary =
          project.communitySummary && typeof project.communitySummary === "object"
            ? (project.communitySummary as Record<string, unknown>)
            : {};
        const meta = project.meta && typeof project.meta === "object" ? project.meta : {};
        const truthStatus = await getTruthStatus(project.id);
        const ratingSummary = await getRatingSummary(project.id, globalRating.average);
        const counts = await getCommunityCounts(project.id);
        const aiStatus = await getAiStatus(project.id);

        const ownerId = project.ownerId ?? null;
        const [owner] = ownerId
          ? await db
              .select()
              .from(schema.users)
              .where(eq(schema.users.id, ownerId))
              .limit(1)
          : [];

        const genre =
          (summary.genre as string | undefined) ??
          ((meta as Record<string, unknown>).genre as string | undefined) ??
          null;
        const players =
          (summary.players as string | undefined) ??
          ((meta as Record<string, unknown>).players as string | undefined) ??
          null;
        const intro =
          (summary.intro as string | undefined) ??
          (project.description ?? "") ??
          "";

        const cover =
          (summary.cover as string | undefined) ??
          ((meta as Record<string, unknown>).cover as string | undefined) ??
          null;

        return {
          id: project.id,
          name: project.name,
          description: project.description ?? "",
          author: {
            id: ownerId,
            username: owner?.username ?? "匿名作者"
          },
          genre,
          players,
          intro,
          cover,
          publishedAt: project.publishedAt ?? null,
          updatedAt: project.updatedAt ?? null,
          truthStatus,
          ratingSummary,
          counts,
          aiStatus
        } satisfies CommunityProjectItem;
      })
    );

    let result = items;

    if (genreFilter) {
      result = result.filter((item) => item.genre === genreFilter);
    }

    if (sort === "hot") {
      result = [...result].sort((a, b) => {
        const scoreA = buildHotScore({ rating: a.ratingSummary, counts: a.counts });
        const scoreB = buildHotScore({ rating: b.ratingSummary, counts: b.counts });
        return scoreB - scoreA;
      });
    } else {
      result = [...result].sort((a, b) =>
        (b.publishedAt || b.updatedAt || "").localeCompare(
          a.publishedAt || a.updatedAt || ""
        )
      );
    }

    console.log(routeLabel, {
      route: routeLabel,
      requestId,
      status: 200,
      latencyMs: Date.now() - startedAt
    });

    return jsonResponse({ projects: result }, { requestId });
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
    return jsonError(500, "failed to load community projects", undefined, requestId);
  }
}
