import { apiRequest } from "./apiClient";
import { RatingSummary } from "./communityApi";

export type ProfileProject = {
  id: string;
  name: string;
  description: string;
  publishedAt: string | null;
  updatedAt: string | null;
  truthStatus: string;
  ratingSummary: RatingSummary;
};

export type ProfileInteraction = {
  id: string;
  projectId: string;
  projectName: string;
  content: string;
  isSuggestion: boolean;
  status: string;
  createdAt: string;
};

export type UserProfileResponse = {
  user: { id: string; username: string };
  myProjects: ProfileProject[];
  favorites: ProfileProject[];
  interactions: ProfileInteraction[];
  acceptedSuggestionsCount: number;
};

export type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

export async function getUserProfile() {
  return apiRequest<UserProfileResponse>("/api/me/profile");
}

export async function getNotifications() {
  return apiRequest<{ notifications: NotificationItem[] }>("/api/me/notifications");
}

export async function markNotificationsRead(ids?: string[]) {
  return apiRequest<{ read: boolean }>("/api/me/notifications/read", {
    method: "PUT",
    body: JSON.stringify({ ids: ids ?? [] })
  });
}
