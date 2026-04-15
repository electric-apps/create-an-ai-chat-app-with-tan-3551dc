import { useState } from "react"
import { Settings, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { useSettings } from "@/lib/settings"

const MODELS = [
	{ id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
	{ id: "claude-opus-4-5", label: "Claude Opus 4.5" },
	{ id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
]

export function SettingsDialog() {
	const { settings, updateSettings } = useSettings()
	const [open, setOpen] = useState(false)
	const [apiKey, setApiKey] = useState("")
	const [model, setModel] = useState("")
	const [showKey, setShowKey] = useState(false)

	const handleOpen = (isOpen: boolean) => {
		if (isOpen) {
			setApiKey(settings.apiKey)
			setModel(settings.model)
			setShowKey(false)
		}
		setOpen(isOpen)
	}

	const handleSave = () => {
		updateSettings({ apiKey, model })
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
					<Settings className="h-5 w-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 py-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="api-key">Anthropic API Key</Label>
						<div className="relative">
							<Input
								id="api-key"
								type={showKey ? "text" : "password"}
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder="sk-ant-..."
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowKey(!showKey)}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
							>
								{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="model">Model</Label>
						<Select value={model} onValueChange={setModel}>
							<SelectTrigger>
								<SelectValue placeholder="Select a model" />
							</SelectTrigger>
							<SelectContent>
								{MODELS.map((m) => (
									<SelectItem key={m.id} value={m.id}>
										{m.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
