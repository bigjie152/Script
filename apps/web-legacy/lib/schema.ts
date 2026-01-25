import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  meta: text("meta", { mode: "json" }),
  ownerId: text("owner_id"),
  isPublic: integer("is_public").notNull().default(0),
  publishedAt: text("published_at"),
  communitySummary: text("community_summary", { mode: "json" }),
  aiStatus: text("ai_status", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const truths = sqliteTable("truths", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  status: text("status").notNull(),
  content: text("content", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const truthSnapshots = sqliteTable("truth_snapshots", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  truthId: text("truth_id").notNull(),
  version: integer("version").notNull(),
  content: text("content", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  truthSnapshotId: text("truth_snapshot_id").notNull(),
  name: text("name").notNull(),
  summary: text("summary"),
  meta: text("meta", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const issues = sqliteTable("issues", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  truthSnapshotId: text("truth_snapshot_id").notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  refs: text("refs", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const moduleDocuments = sqliteTable("module_documents", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  module: text("module").notNull(),
  content: text("content", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  content: text("content").notNull(),
  type: text("type"),
  meta: text("meta", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const aiRequestLogs = sqliteTable("ai_request_logs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  truthSnapshotId: text("truth_snapshot_id"),
  actionType: text("action_type").notNull(),
  provider: text("provider").notNull(),
  model: text("model"),
  meta: text("meta", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const ratings = sqliteTable("ratings", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  score: integer("score").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  parentId: text("parent_id"),
  content: text("content").notNull(),
  isSuggestion: integer("is_suggestion").notNull().default(0),
  status: text("status").notNull().default("normal"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const likes = sqliteTable("likes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }),
  isRead: integer("is_read").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
