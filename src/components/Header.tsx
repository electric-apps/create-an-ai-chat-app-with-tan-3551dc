import { MessageSquare } from "lucide-react"
import { SettingsDialog } from "@/components/SettingsDialog"

export function Header() {
	return (
		<header className="h-14 border-b border-border sticky top-0 z-50 bg-[#161618]">
			<div className="h-full flex items-center justify-between px-4">
				<div className="flex items-center gap-2">
					<MessageSquare className="h-5 w-5 text-primary" />
					<h1 className="text-lg font-medium">Claude Chat</h1>
				</div>
				<SettingsDialog />
			</div>
		</header>
	)
}
