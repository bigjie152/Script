import { apiRequest } from "./apiClient";

export type AuthUser = {
  id: string;
  username: string;
};

export type AuthResponse = {
  user: AuthUser;
};

export type AuthMeResponse = {
  user: AuthUser | null;
};

export async function registerUser(username: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function loginUser(username: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function logoutUser() {
  return apiRequest<{ status: string }>("/api/auth/logout", {
    method: "POST"
  });
}

export async function getMe() {
  return apiRequest<AuthMeResponse>("/api/auth/me");
}
