import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  content: text("content").notNull(),
  type: text("type"),
  meta: text("meta", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
