import { describe, it, expect } from "vitest"
import { generateValidRow, parseDates } from "./helpers/schema-test-utils"
import { conversationSelectSchema } from "@/db/zod-schemas"

describe("conversation collection validation", () => {
	it("validates a complete row", () => {
		const row = generateValidRow(conversationSelectSchema)
		expect(conversationSelectSchema.safeParse(row).success).toBe(true)
	})

	it("JSON round-trip: parseDates + schema validation", () => {
		const row = generateValidRow(conversationSelectSchema)
		const serialized = JSON.parse(JSON.stringify(row))
		const restored = parseDates(serialized)
		expect(conversationSelectSchema.safeParse(restored).success).toBe(true)
	})

	it("coerces ISO date strings to Date objects", () => {
		const row = {
			id: crypto.randomUUID(),
			title: "Test Chat",
			stream_id: crypto.randomUUID(),
			created_at: "2024-01-01T00:00:00.000Z",
			updated_at: "2024-01-01T00:00:00.000Z",
		}
		const result = conversationSelectSchema.safeParse(row)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.created_at).toBeInstanceOf(Date)
		}
	})
})
