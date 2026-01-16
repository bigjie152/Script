import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  truthSnapshotId: text("truth_snapshot_id").notNull(),
  name: text("name").notNull(),
  summary: text("summary"),
  meta: text("meta", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
