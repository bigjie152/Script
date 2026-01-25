import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../../../lib/db";
import { extractTextFromContent } from "../../../editors/adapters/plainTextAdapter";

export type RatingSummary = {
  average: number;
  votes: number;
  displayScore: number;
};

export type CommunityCounts = {
  likes: number;
  favorites: number;
  comments: number;
};

export type AiValidationStatus = {
  issueCount: number;
  hasP0: boolean;
  lastCheckedAt: string | null;
};

const DEFAULT_C = 3.6;
const DEFAULT_M = 10;

export async function getTruthStatus(projectId: string) {
  const [truth] = await db
    .select()
    .from(schema.truths)
    .where(eq(schema.truths.projectId, projectId))
    .orderBy(desc(schema.truths.createdAt))
    .limit(1);

  return truth?.status === "LOCKED" ? "Locked" : "Draft";
}

export async function getCommunityCounts(projectId: string): Promise<CommunityCounts> {
  const likes = await db
    .select()
    .from(schema.likes)
    .where(eq(schema.likes.projectId, projectId));
  const favorites = await db
    .select()
    .from(schema.favorites)
    .where(eq(schema.favorites.projectId, projectId));
  const comments = await db
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.projectId, projectId));

  return {
    likes: likes.length,
    favorites: favorites.length,
    comments: comments.length
  };
}

export async function getGlobalRatingStats() {
  const all = await db.select().from(schema.ratings);
  if (!all.length) {
    return { average: DEFAULT_C, votes: 0 };
  }
  const sum = all.reduce((acc, item) => acc + item.score, 0);
  return {
    average: sum / all.length,
    votes: all.length
  };
}

export async function getRatingSummary(
  projectId: string,
  globalAverage: number = DEFAULT_C,
  m: number = DEFAULT_M
): Promise<RatingSummary> {
  const ratings = await db
    .select()
    .from(schema.ratings)
    .where(eq(schema.ratings.projectId, projectId));

  if (!ratings.length) {
    return {
      average: 0,
      votes: 0,
      displayScore: Number(globalAverage.toFixed(2))
    };
  }

  const sum = ratings.reduce((acc, item) => acc + item.score, 0);
  const average = sum / ratings.length;
  const displayScore = (average * ratings.length + globalAverage * m) /
    (ratings.length + m);

  return {
    average: Number(average.toFixed(2)),
    votes: ratings.length,
    displayScore: Number(displayScore.toFixed(2))
  };
}

export async function getAiStatus(projectId: string): Promise<AiValidationStatus> {
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (project?.aiStatus && typeof project.aiStatus === "object") {
    const aiStatus = project.aiStatus as AiValidationStatus;
    return {
      issueCount: typeof aiStatus.issueCount === "number" ? aiStatus.issueCount : 0,
      hasP0: Boolean(aiStatus.hasP0),
      lastCheckedAt: aiStatus.lastCheckedAt ?? null
    };
  }

  const issues = await db
    .select()
    .from(schema.issues)
    .where(eq(schema.issues.projectId, projectId));
  const hasP0 = issues.some((issue) =>
    ["P0", "HIGH", "CRITICAL"].includes(issue.severity?.toUpperCase?.() ?? "")
  );
  const lastCheckedAt = issues.length
    ? issues
        .map((issue) => issue.createdAt)
        .sort()
        .slice(-1)[0]
    : null;

  return {
    issueCount: issues.length,
    hasP0,
    lastCheckedAt
  };
}

export async function getCommunitySummary(projectId: string) {
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .limit(1);

  if (!project) return null;

  if (project.communitySummary && typeof project.communitySummary === "object") {
    return project.communitySummary as Record<string, unknown>;
  }

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

  const meta = project.meta && typeof project.meta === "object" ? project.meta : {};
  const intro =
    extractTextFromContent(overview?.content).slice(0, 140) ||
    (project.description ?? "");

  return {
    title: project.name,
    intro,
    genre: (meta as Record<string, unknown>).genre ?? null,
    players: (meta as Record<string, unknown>).players ?? null,
    cover: (meta as Record<string, unknown>).cover ?? null
  };
}

export function buildHotScore(params: {
  rating: RatingSummary;
  counts: CommunityCounts;
}) {
  const { rating, counts } = params;
  return rating.displayScore * 3 + counts.likes * 2 + counts.comments * 1.5 + counts.favorites;
}
