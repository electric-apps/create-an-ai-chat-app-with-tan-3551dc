import { useLiveQuery } from "@tanstack/react-db"
import { conversationCollection } from "@/db/collections/conversations"
import { Plus, Trash2, MessageSquare, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

function formatRelativeTime(date: Date): string {
	const now = new Date()
	const diff = now.getTime() - date.getTime()
	const minutes = Math.floor(diff / 60000)
	if (minutes < 1) return "now"
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	if (days < 7) return `${days}d ago`
	return date.toLocaleDateString()
}

export function ConversationSidebar({ activeId }: { activeId?: string }) {
	const { data: conversations = [] } = useLiveQuery((q) =>
		q
			.from({ c: conversationCollection })
			.orderBy(({ c }) => c.updated_at, "desc"),
	)
	const navigate = useNavigate()
	const [mobileOpen, setMobileOpen] = useState(false)
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

	const confirmDelete = () => {
		if (!deleteTarget) return
		conversationCollection.delete(deleteTarget)
		if (activeId === deleteTarget) {
			navigate({ to: "/" })
		}
		setDeleteTarget(null)
	}

	const handleNewChat = async () => {
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
		setMobileOpen(false)
	}

	const handleDelete = (e: React.MouseEvent, id: string) => {
		e.stopPropagation()
		setDeleteTarget(id)
	}

	const sidebar = (
		<div className="flex flex-col h-full bg-[#161618]">
			<div className="p-3">
				<Button
					onClick={handleNewChat}
					className="w-full justify-start gap-2"
					variant="outline"
				>
					<Plus className="h-4 w-4" />
					New Chat
				</Button>
			</div>
			<div className="flex-1 overflow-y-auto px-2 pb-2">
				{conversations.map((conv) => (
					<div
						key={conv.id}
						onClick={() => {
							navigate({ to: "/chat/$id", params: { id: conv.id } })
							setMobileOpen(false)
						}}
						className={cn(
							"group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors duration-150",
							activeId === conv.id
								? "bg-secondary text-foreground"
								: "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
						)}
					>
						<MessageSquare className="h-4 w-4 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="truncate">{conv.title}</p>
							<p className="text-xs text-muted-foreground">
								{formatRelativeTime(conv.updated_at)}
							</p>
						</div>
						<button
							onClick={(e) => handleDelete(e, conv.id)}
							className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
				))}
			</div>
		</div>
	)

	return (
		<>
			{/* Delete confirmation dialog */}
			<Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Delete Conversation</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this conversation? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<div className="flex justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDelete}
							className="bg-destructive/10 text-destructive hover:bg-destructive/20"
						>
							Delete
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Mobile toggle */}
			<Button
				variant="ghost"
				size="icon"
				className="fixed top-3 left-3 z-50 md:hidden"
				onClick={() => setMobileOpen(!mobileOpen)}
			>
				{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
			</Button>

			{/* Mobile overlay */}
			{mobileOpen && (
				<div
					className="fixed inset-0 bg-black/60 z-40 md:hidden"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Mobile drawer */}
			<div
				className={cn(
					"fixed inset-y-0 left-0 z-40 w-72 transform transition-transform md:hidden",
					mobileOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{sidebar}
			</div>

			{/* Desktop sidebar */}
			<div className="hidden md:flex md:w-72 md:shrink-0 border-r border-border">
				{sidebar}
			</div>
		</>
	)
}
