import { createFileRoute } from "@tanstack/react-router"
import { chat } from "@tanstack/ai"
import { anthropicText } from "@tanstack/ai-anthropic"
import { toDurableChatSessionResponse } from "@durable-streams/tanstack-ai-transport"

function buildStreamUrl(streamId: string): string {
	const dsServiceId = process.env.DS_SERVICE_ID
	const electricUrl = process.env.ELECTRIC_URL || "https://api.electric-sql.cloud"
	return `${electricUrl}/v1/stream/${dsServiceId}/${streamId}`
}

function getWriteHeaders(): Record<string, string> {
	const dsSecret = process.env.DS_SECRET
	return {
		Authorization: `Bearer ${dsSecret}`,
		"Content-Type": "application/json",
	}
}

export const Route = createFileRoute("/api/chat")({
	// @ts-expect-error — server.handlers types lag behind runtime support
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const body = await request.json()
				const { messages, id, model } = body

				const apiKey = request.headers.get("x-api-key")
				if (!apiKey) {
					return Response.json({ error: "Missing API key" }, { status: 401 })
				}

				process.env.ANTHROPIC_API_KEY = apiKey

				const latestUserMessage = messages.findLast(
					(m: { role: string }) => m.role === "user",
				)

				const responseStream = chat({
					adapter: anthropicText(model || "claude-sonnet-4-5"),
					messages,
					maxTokens: 4096,
				})

				return await toDurableChatSessionResponse({
					stream: {
						writeUrl: buildStreamUrl(`chat/${id}`),
						headers: getWriteHeaders(),
						createIfMissing: true,
					},
					newMessages: latestUserMessage ? [latestUserMessage] : [],
					responseStream,
					mode: "await",
				})
			},
		},
	},
})
