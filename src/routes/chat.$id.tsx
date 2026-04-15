import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useEffect, useRef } from "react"
import { useChat } from "@tanstack/ai-react"
import { durableStreamConnection } from "@durable-streams/tanstack-ai-transport"
import { ChatThread } from "@/components/ChatThread"
import { MessageInput } from "@/components/MessageInput"
import { useSettings } from "@/lib/settings"
import { conversationCollection } from "@/db/collections/conversations"
import { useLiveQuery, eq } from "@tanstack/react-db"

export const Route = createFileRoute("/chat/$id")({
	ssr: false,
	component: ChatPage,
})

function ChatPage() {
	const { id } = Route.useParams()
	const { settings, hasApiKey } = useSettings()
	const titleUpdatedRef = useRef(false)

	const { data: conversations = [] } = useLiveQuery((q) =>
		q
			.from({ c: conversationCollection })
			.where(({ c }) => eq(c.id, id)),
	)
	const conversation = conversations[0]

	const connection = useMemo(
		() =>
			durableStreamConnection({
				sendUrl: `/api/chat?id=${encodeURIComponent(id)}`,
				readUrl: `/api/ds-stream/chat/${id}`,
			}),
		[id],
	)

	const { messages, sendMessage, isLoading, stop } = useChat({
		id,
		connection,
		live: true,
		headers: {
			"x-api-key": settings.apiKey,
		},
		body: {
			model: settings.model,
			id,
		},
	})

	// Auto-title after first assistant message
	useEffect(() => {
		if (titleUpdatedRef.current) return
		const assistantMsg = messages.find((m) => m.role === "assistant")
		if (!assistantMsg || !conversation) return

		const textPart = assistantMsg.parts.find(
			(p) => p.type === "text" && p.content,
		)
		if (!textPart || textPart.type !== "text" || !textPart.content) return

		if (conversation.title === "New Chat") {
			titleUpdatedRef.current = true
			const title = textPart.content.slice(0, 60).replace(/\n/g, " ").trim()
			conversationCollection.update(id, (draft) => {
				draft.title = title || "New Chat"
				draft.updated_at = new Date()
			})
		}
	}, [messages, conversation, id])

	const handleSend = (text: string) => {
		if (!hasApiKey) return
		sendMessage(text)
		// Update conversation timestamp
		if (conversation) {
			conversationCollection.update(id, (draft) => {
				draft.updated_at = new Date()
			})
		}
	}

	return (
		<div className="flex flex-col h-full">
			<ChatThread messages={messages} isLoading={isLoading} />
			<MessageInput
				onSend={handleSend}
				onStop={stop}
				isLoading={isLoading}
				disabled={!hasApiKey}
			/>
		</div>
	)
}
