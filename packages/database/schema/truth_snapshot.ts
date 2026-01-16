import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const truthSnapshots = sqliteTable("truth_snapshots", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  truthId: text("truth_id").notNull(),
  version: integer("version").notNull(),
  content: text("content", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
