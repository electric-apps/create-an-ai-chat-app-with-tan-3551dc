import { useState, useRef, useEffect } from "react"
import { Send, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MessageInput({
	onSend,
	onStop,
	isLoading,
	disabled,
}: {
	onSend: (message: string) => void
	onStop: () => void
	isLoading: boolean
	disabled: boolean
}) {
	const [input, setInput] = useState("")
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto"
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
		}
	}, [input])

	const handleSubmit = () => {
		if (!input.trim() || disabled) return
		onSend(input.trim())
		setInput("")
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSubmit()
		}
	}

	return (
		<div className="border-t border-border bg-[#161618] p-4">
			<div className="max-w-3xl mx-auto flex gap-2 items-end">
				<textarea
					ref={textareaRef}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={disabled ? "Set your API key in Settings to start chatting" : "Type a message..."}
					disabled={disabled}
					rows={1}
					className="flex-1 resize-none rounded-lg border border-input bg-secondary px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
				/>
				{isLoading ? (
					<Button
						onClick={onStop}
						variant="outline"
						size="icon"
						className="shrink-0 h-11 w-11"
					>
						<Square className="h-4 w-4" />
					</Button>
				) : (
					<Button
						onClick={handleSubmit}
						disabled={!input.trim() || disabled}
						size="icon"
						className="shrink-0 h-11 w-11"
					>
						<Send className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	)
}
