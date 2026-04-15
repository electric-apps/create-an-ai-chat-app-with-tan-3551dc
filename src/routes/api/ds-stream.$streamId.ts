import { createFileRoute } from "@tanstack/react-router"

const HOP_BY_HOP = new Set([
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade",
	"host",
	"content-encoding",
	"content-length",
])

async function proxyDurableStream(request: Request, streamId: string): Promise<Response> {
	const dsServiceId = process.env.DS_SERVICE_ID
	const dsSecret = process.env.DS_SECRET
	const electricUrl = process.env.ELECTRIC_URL || "https://api.electric-sql.cloud"

	const requestUrl = new URL(request.url)
	const targetUrl = new URL(`${electricUrl}/v1/stream/${dsServiceId}/${streamId}`)

	for (const [key, value] of requestUrl.searchParams) {
		if (key === "stream_path") continue
		targetUrl.searchParams.set(key, value)
	}

	const response = await fetch(targetUrl.toString(), {
		method: request.method,
		headers: {
			Authorization: `Bearer ${dsSecret}`,
		},
	})

	// Stream doesn't exist yet (created on first message send).
	// Return an empty SSE response so the client doesn't log a console error.
	if (response.status === 404) {
		return new Response("", {
			status: 200,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache, no-store, must-revalidate",
			},
		})
	}

	const forwardedHeaders = new Headers()
	for (const [key, value] of response.headers) {
		if (HOP_BY_HOP.has(key.toLowerCase())) continue
		forwardedHeaders.set(key, value)
	}
	if (!forwardedHeaders.has("cache-control")) {
		forwardedHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate")
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: forwardedHeaders,
	})
}

export const Route = createFileRoute("/api/ds-stream/$streamId")({
	// @ts-expect-error — server.handlers types lag behind runtime support
	server: {
		handlers: {
			GET: ({ request, params }: { request: Request; params: { streamId: string } }) =>
				proxyDurableStream(request, params.streamId),
		},
	},
})
