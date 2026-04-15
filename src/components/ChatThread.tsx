import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { UIMessage } from "@tanstack/ai-react"
import { Bot, User } from "lucide-react"

export function ChatThread({
	messages,
	isLoading,
}: {
	messages: UIMessage[]
	isLoading: boolean
}) {
	const bottomRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages, isLoading])

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center space-y-3">
					<Bot className="h-12 w-12 mx-auto text-muted-foreground" />
					<p className="text-lg text-muted-foreground">Ask Claude anything...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex-1 overflow-y-auto px-4 py-6">
			<div className="max-w-3xl mx-auto space-y-6">
				{messages.map((message) => (
					<div
						key={message.id}
						className={cn(
							"flex gap-3",
							message.role === "user" ? "justify-end" : "justify-start",
						)}
					>
						{message.role === "assistant" && (
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
								<Bot className="h-4 w-4 text-primary" />
							</div>
						)}
						<div
							className={cn(
								"rounded-xl px-4 py-3 max-w-[80%] text-sm leading-relaxed",
								message.role === "user"
									? "bg-primary text-primary-foreground"
									: "bg-card border border-border",
							)}
						>
							{message.parts.map((part, i) => {
								if (part.type === "text" && part.content) {
									return (
										<p key={i} className="whitespace-pre-wrap">
											{part.content}
										</p>
									)
								}
								return null
							})}
						</div>
						{message.role === "user" && (
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
								<User className="h-4 w-4 text-muted-foreground" />
							</div>
						)}
					</div>
				))}
				{isLoading && (
					<div className="flex gap-3">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
							<Bot className="h-4 w-4 text-primary" />
						</div>
						<div className="bg-card border border-border rounded-xl px-4 py-3">
							<div className="flex gap-1">
								<span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
								<span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.2s]" />
								<span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:0.4s]" />
							</div>
						</div>
					</div>
				)}
				<div ref={bottomRef} />
			</div>
		</div>
	)
}
