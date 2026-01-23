import { apiRequest } from "./apiClient";

export type RatingSummary = {
  average: number;
  votes: number;
  displayScore: number;
};

export type AiStatus = {
  issueCount: number;
  hasP0: boolean;
  lastCheckedAt: string | null;
};

export type CommunityCounts = {
  likes: number;
  favorites: number;
  comments: number;
};

export type CommunityProjectListItem = {
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
  ratingSummary: RatingSummary;
  counts: CommunityCounts;
  aiStatus: AiStatus;
};

export type CommunityProjectListResponse = {
  projects: CommunityProjectListItem[];
};

export type CommunityComment = {
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

export type CommunityProjectDetail = {
  project: {
    id: string;
    name: string;
    description: string;
    meta?: Record<string, unknown> | null;
    communitySummary?: Record<string, unknown> | null;
    isPublic: boolean;
    publishedAt: string | null;
    updatedAt: string | null;
    ownerId: string | null;
  };
  author: { id: string | null; username: string };
  overview: Record<string, unknown>;
  truthStatus: string;
  aiStatus: AiStatus;
  ratingSummary: RatingSummary;
  counts: CommunityCounts;
  comments: CommunityComment[];
  userState: { rating: number | null; liked: boolean; favorited: boolean };
  isOwner: boolean;
};

export type CommunityProjectDetailResponse = CommunityProjectDetail;

export async function listCommunityProjects(params: {
  sort?: "latest" | "hot";
  q?: string;
  genre?: string;
  author?: string;
}) {
  const search = new URLSearchParams();
  if (params.sort) search.set("sort", params.sort);
  if (params.q) search.set("q", params.q);
  if (params.genre) search.set("genre", params.genre);
  if (params.author) search.set("author", params.author);
  const query = search.toString();
  const path = query ? `/api/community/projects?${query}` : "/api/community/projects";
  return apiRequest<CommunityProjectListResponse>(path);
}

export async function getCommunityProject(projectId: string) {
  return apiRequest<CommunityProjectDetailResponse>(
    `/api/community/projects/${projectId}`
  );
}

export async function rateCommunityProject(projectId: string, score: number) {
  return apiRequest<{ ratingSummary: RatingSummary }>(
    `/api/community/projects/${projectId}/rating`,
    {
      method: "PUT",
      body: JSON.stringify({ score })
    }
  );
}

export async function toggleFavorite(projectId: string, on: boolean) {
  return apiRequest<{ favorited: boolean }>(
    `/api/community/projects/${projectId}/favorite`,
    {
      method: "PUT",
      body: JSON.stringify({ on })
    }
  );
}

export async function toggleLike(projectId: string, on: boolean) {
  return apiRequest<{ liked: boolean }>(
    `/api/community/projects/${projectId}/like`,
    {
      method: "PUT",
      body: JSON.stringify({ on })
    }
  );
}

export async function createCommunityComment(payload: {
  projectId: string;
  content: string;
  isSuggestion?: boolean;
  parentId?: string | null;
}) {
  return apiRequest<{ comment: { id: string } }>(
    `/api/community/projects/${payload.projectId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({
        content: payload.content,
        isSuggestion: Boolean(payload.isSuggestion),
        parentId: payload.parentId ?? null
      })
    }
  );
}

export async function updateCommunityComment(commentId: string, content: string) {
  return apiRequest<{ commentId: string }>(`/api/community/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify({ content })
  });
}

export async function deleteCommunityComment(commentId: string) {
  return apiRequest<{ deleted: boolean }>(`/api/community/comments/${commentId}`, {
    method: "DELETE"
  });
}

export async function acceptSuggestion(commentId: string) {
  return apiRequest<{ accepted: boolean }>(
    `/api/community/comments/${commentId}/accept`,
    {
      method: "POST"
    }
  );
}
