import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

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
