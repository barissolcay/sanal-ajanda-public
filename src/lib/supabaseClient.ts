// Supabase Client Configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
function validateConfig(): void {
    if (!supabaseUrl || !supabaseAnonKey) {
        const missing = [];
        if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
        if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

        throw new Error(
            `Supabase yapılandırması eksik!\n` +
            `Eksik değişkenler: ${missing.join(', ')}\n` +
            `Lütfen .env dosyasında bu değişkenleri tanımlayın.`
        );
    }
}

// Validate on module load
validateConfig();

export const supabase: SupabaseClient = createClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    }
);

// Development mode logging
if (import.meta.env.DEV) {
    console.log('[Supabase] Bağlantı hazır:', supabaseUrl);
}
