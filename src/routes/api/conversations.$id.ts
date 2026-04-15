import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/db"
import { conversations } from "@/db/schema"
import { generateTxId } from "@/db/utils"
import { eq } from "drizzle-orm"

export const Route = createFileRoute("/api/conversations/$id")({
	// @ts-expect-error — server.handlers types lag behind runtime support
	server: {
		handlers: {
			PUT: async ({ request, params }: { request: Request; params: { id: string } }) => {
				const body = await request.json()
				let txid: number

				await db.transaction(async (tx) => {
					const { created_at, updated_at, id: _id, ...rest } = body
					await tx
						.update(conversations)
						.set({ ...rest, updated_at: new Date() })
						.where(eq(conversations.id, params.id))
					txid = await generateTxId(tx)
				})

				return Response.json({ txid: txid! })
			},
			DELETE: async ({ params }: { params: { id: string } }) => {
				let txid: number

				await db.transaction(async (tx) => {
					await tx.delete(conversations).where(eq(conversations.id, params.id))
					txid = await generateTxId(tx)
				})

				return Response.json({ txid: txid! })
			},
		},
	},
})
