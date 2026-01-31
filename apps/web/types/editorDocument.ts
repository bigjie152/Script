export type EditorModuleKey =
  | "overview"
  | "truth"
  | "story"
  | "roles"
  | "clues"
  | "timeline"
  | "dm";

export type DocumentModuleKey = Exclude<EditorModuleKey, "truth">;

export type EditorDocument = {
  projectId: string;
  module: EditorModuleKey;
  content: Record<string, unknown>;
  text: string;
  updatedAt?: string | null;
};
