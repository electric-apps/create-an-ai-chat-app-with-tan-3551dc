import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { conversationCollection } from "@/db/collections/conversations"
import { useSettings } from "@/lib/settings"
import { useEffect } from "react"
import { MessageSquare, Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const Route = createFileRoute("/")({
	ssr: false,
	component: HomePage,
})

function HomePage() {
	const navigate = useNavigate()
	const { hasApiKey } = useSettings()

	const { data: conversations = [] } = useLiveQuery((q) =>
		q
			.from({ c: conversationCollection })
			.orderBy(({ c }) => c.updated_at, "desc"),
	)

	// Redirect to most recent conversation if one exists
	useEffect(() => {
		if (conversations.length > 0) {
			navigate({
				to: "/chat/$id",
				params: { id: conversations[0].id },
				replace: true,
			})
		}
	}, [conversations, navigate])

	const handleNewChat = () => {
		const streamId = crypto.randomUUID()
		const id = crypto.randomUUID()
		conversationCollection.insert({
			id,
			title: "New Chat",
			stream_id: streamId,
			created_at: new Date(),
			updated_at: new Date(),
		})
		navigate({ to: "/chat/$id", params: { id } })
	}

	return (
		<div className="flex-1 flex items-center justify-center">
			<div className="text-center space-y-6 max-w-md px-4">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
					<MessageSquare className="h-8 w-8 text-primary" />
				</div>
				<div className="space-y-2">
					<h2 className="text-3xl font-bold tracking-tight">Welcome to Claude Chat</h2>
					<p className="text-muted-foreground">
						{hasApiKey
							? "Start a new conversation with Claude."
							: "Set your Anthropic API key in Settings to get started."}
					</p>
				</div>
				{hasApiKey ? (
					<Button onClick={handleNewChat} size="lg" className="gap-2">
						<Plus className="h-4 w-4" />
						New Chat
					</Button>
				) : (
					<p className="text-sm text-muted-foreground">
						Click the <SettingsIcon className="inline h-4 w-4" /> icon in the header to configure your API key.
					</p>
				)}
			</div>
		</div>
	)
}
