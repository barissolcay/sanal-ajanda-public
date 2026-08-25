// Settings Repository - LocalStorage Implementation
import type { Settings } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/types';

const SETTINGS_KEY = 'sanal_ajandam_settings';

/**
 * Get settings (creates default if not exists)
 */
export async function getSettings(): Promise<Settings> {
    const stored = localStorage.getItem(SETTINGS_KEY);

    if (!stored) {
        // Create default settings
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
    }

    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

/**
 * Save settings (upsert)
 */
export async function saveSettings(settings: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
    const current = await getSettings();

    const updated: Settings = {
        ...current,
        ...settings,
        id: 1, // Always use id 1
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<Settings> {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
}
