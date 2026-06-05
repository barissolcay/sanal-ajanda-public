// useSettings Hook - Settings management for React components
import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/types';
import * as settingsRepository from '../data/settingsRepository';

export interface UseSettingsReturn {
    settings: Settings;
    loading: boolean;
    error: Error | null;
    updateSettings: (updates: Partial<Omit<Settings, 'id'>>) => Promise<void>;
    resetSettings: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Load settings
    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const loaded = await settingsRepository.getSettings();
            setSettings(loaded);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load settings'));
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Update settings
    const updateSettings = useCallback(async (updates: Partial<Omit<Settings, 'id'>>) => {
        try {
            const updated = await settingsRepository.saveSettings(updates);
            setSettings(updated);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to save settings'));
        }
    }, []);

    // Reset settings
    const resetSettings = useCallback(async () => {
        try {
            const reset = await settingsRepository.resetSettings();
            setSettings(reset);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to reset settings'));
        }
    }, []);

    return {
        settings,
        loading,
        error,
        updateSettings,
        resetSettings,
    };
}
