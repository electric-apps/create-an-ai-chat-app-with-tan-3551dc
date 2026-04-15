import { createCollection } from "@tanstack/react-db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { conversationSelectSchema } from "@/db/zod-schemas"
import { absoluteApiUrl } from "@/lib/client-url"

export const conversationCollection = createCollection(
	electricCollectionOptions({
		id: "conversations",
		schema: conversationSelectSchema,
		getKey: (row) => row.id,
		shapeOptions: {
			url: absoluteApiUrl("/api/conversations-shape"),
			parser: {
				timestamptz: (date: string) => new Date(date),
			},
		},
		onInsert: async ({ transaction }) => {
			const { modified: newConv } = transaction.mutations[0]
			const res = await fetch("/api/conversations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: newConv.title, stream_id: newConv.stream_id }),
			})
			const data = await res.json()
			return { txid: data.txid }
		},
		onUpdate: async ({ transaction }) => {
			const { modified: updated } = transaction.mutations[0]
			const res = await fetch(`/api/conversations/${updated.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: updated.title }),
			})
			const data = await res.json()
			return { txid: data.txid }
		},
		onDelete: async ({ transaction }) => {
			const { original: deleted } = transaction.mutations[0]
			const res = await fetch(`/api/conversations/${deleted.id}`, {
				method: "DELETE",
			})
			const data = await res.json()
			return { txid: data.txid }
		},
	}),
)
