import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const conversations = pgTable("conversations", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull().default("New Chat"),
	stream_id: text("stream_id").notNull().unique(),
	created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
