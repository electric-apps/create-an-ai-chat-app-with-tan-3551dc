import { createContext, useContext, useState, useCallback, useEffect } from "react"

export interface Settings {
	apiKey: string
	model: string
}

export interface SettingsContextValue {
	settings: Settings
	updateSettings: (updates: Partial<Settings>) => void
	hasApiKey: boolean
}

const DEFAULT_MODEL = "claude-sonnet-4-5"

function loadSettings(): Settings {
	if (typeof window === "undefined") {
		return { apiKey: "", model: DEFAULT_MODEL }
	}
	return {
		apiKey: localStorage.getItem("anthropic_api_key") || "",
		model: localStorage.getItem("preferred_model") || DEFAULT_MODEL,
	}
}

export const SettingsContext = createContext<SettingsContextValue>({
	settings: { apiKey: "", model: DEFAULT_MODEL },
	updateSettings: () => {},
	hasApiKey: false,
})

export function useSettings() {
	return useContext(SettingsContext)
}

export function useSettingsState(): SettingsContextValue {
	const [settings, setSettings] = useState<Settings>(loadSettings)

	useEffect(() => {
		setSettings(loadSettings())
	}, [])

	const updateSettings = useCallback((updates: Partial<Settings>) => {
		setSettings((prev) => {
			const next = { ...prev, ...updates }
			if (updates.apiKey !== undefined) {
				localStorage.setItem("anthropic_api_key", updates.apiKey)
			}
			if (updates.model !== undefined) {
				localStorage.setItem("preferred_model", updates.model)
			}
			return next
		})
	}, [])

	return {
		settings,
		updateSettings,
		hasApiKey: settings.apiKey.length > 0,
	}
}
