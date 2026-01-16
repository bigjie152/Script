import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
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
