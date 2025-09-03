import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL no está configurada');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
}

// Crear cliente de Supabase
export const supabase = createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    }
);

// Función para testar la conexión
export async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('count')
            .single();
            
        if (error) throw error;
        console.log('✅ Conexión con base de datos establecida con éxito');
        return true;
    } catch (error) {
        console.error('❌ Error en la conexión con base de datos:', error);
        return false;
    }
}

// No necesitamos closeConnection con Supabase
export async function closeConnection() {
    return Promise.resolve();
}

// Verificar conexión en la inicialización
if (process.env.NODE_ENV === 'development') {
    testConnection().catch(console.error);
}

