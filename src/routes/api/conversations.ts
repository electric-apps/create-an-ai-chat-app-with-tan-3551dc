import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/db"
import { conversations } from "@/db/schema"
import { parseDates, generateTxId } from "@/db/utils"

export const Route = createFileRoute("/api/conversations")({
	// @ts-expect-error — server.handlers types lag behind runtime support
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const body = parseDates(await request.json())
				let txid: number
				let id: string

				await db.transaction(async (tx) => {
					const [row] = await tx
						.insert(conversations)
						.values({
							title: body.title || "New Chat",
							stream_id: body.stream_id,
						})
						.returning({ id: conversations.id })
					id = row.id
					txid = await generateTxId(tx)
				})

				return Response.json({ id: id!, txid: txid! })
			},
		},
	},
})
