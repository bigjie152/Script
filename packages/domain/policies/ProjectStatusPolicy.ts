export const PROJECT_STATUSES = [
  "DRAFT",
  "TRUTH_LOCKED",
  "PUBLISHED",
  "ARCHIVED"
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const STATUS_ALIASES: Record<string, ProjectStatus> = {
  DRAFT: "DRAFT",
  TRUTH_LOCKED: "TRUTH_LOCKED",
  TRUTHLOCKED: "TRUTH_LOCKED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED"
};

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ["TRUTH_LOCKED"],
  TRUTH_LOCKED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: []
};

export function normalizeProjectStatus(
  input: string | null | undefined
): ProjectStatus | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "_");
  return STATUS_ALIASES[normalized] ?? null;
}

export function getAllowedNextStatuses(
  current: ProjectStatus
): ProjectStatus[] {
  return TRANSITIONS[current] ?? [];
}

export function canTransitionProjectStatus(
  current: ProjectStatus,
  next: ProjectStatus
) {
  return getAllowedNextStatuses(current).includes(next);
}
