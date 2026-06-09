export type AppSettings = {
    autoAdd: boolean
    readingMode: "continuous" | "single"
    theme: "dark" | "light"
}

const settingsKey = "settings"

export const defaultSettings: AppSettings = {
    autoAdd: true,
    readingMode: "continuous",
    theme: "dark"
}

export async function getSettings(): Promise<AppSettings> {
    const stored = await browser.storage.local.get(settingsKey)
    return { ...defaultSettings, ...(stored[settingsKey] as Partial<AppSettings> | undefined) }
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const settings = { ...(await getSettings()), ...patch }
    await browser.storage.local.set({ [settingsKey]: settings })
    return settings
}
