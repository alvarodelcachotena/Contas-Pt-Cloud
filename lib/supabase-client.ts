import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

export function getSupabaseClient() {
    if (supabaseClient) {
        return supabaseClient;
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('tu_supabase_url_aqui')) {
            console.warn('⚠️ Supabase credentials not properly configured');
            return null;
        }

        supabaseClient = createClient(supabaseUrl, supabaseKey);
        return supabaseClient;
    } catch (error) {
        console.warn('⚠️ Failed to initialize Supabase client:', error);
        return null;
    }
}

export function isSupabaseConfigured(): boolean {
    const client = getSupabaseClient();
    return client !== null;
}
