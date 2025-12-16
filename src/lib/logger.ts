// Logger Utility - Conditional logging based on environment
// Only logs in development mode, keeps production clean

const isDev = import.meta.env.DEV;

export const logger = {
    info: (...args: unknown[]) => {
        if (isDev) console.log('[INFO]', ...args);
    },
    warn: (...args: unknown[]) => {
        if (isDev) console.warn('[WARN]', ...args);
    },
    error: (...args: unknown[]) => {
        // Always log errors
        console.error('[ERROR]', ...args);
    },
    debug: (...args: unknown[]) => {
        if (isDev) console.debug('[DEBUG]', ...args);
    },
};
