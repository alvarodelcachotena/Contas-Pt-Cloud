import { drizzle } from 'drizzle-orm/postgres-js';
import { Pool } from 'pg';  // Cambiamos el import
import { SUPABASE_URL } from './config';
import * as schema from '../shared/schema';

// Configuración mejorada de la conexión
const connectionString = SUPABASE_URL!;

// Configurar cliente postgres con opciones optimizadas
const client = new Pool({  // Cambiamos a Pool de pg
    connectionString,
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    maxUses: 7200, // equivalente a max_lifetime
    ssl: {
        rejectUnauthorized: false // o true si tienes certificados SSL configurados
    }
});

// Crear instancia de la base de datos
export const db = drizzle(client);

// Función para testar la conexión
export async function testConnection() {
    try {
        const result = await client.query('SELECT 1 as test');
        console.log('✅ Conexión con base de datos establecida con suceso');
        return true;
    } catch (error) {
        console.error('❌ Error en la conexión con base de datos:', error);
        return false;
    }
}

// Función para cerrar conexiones (útil para tests)
export async function closeConnection() {
    try {
        await client.end();
        console.log('✅ Conexiones de base de datos cerradas');
    } catch (error) {
        console.error('❌ Error al cerrar conexiones:', error);
    }
}

// Verificar conexión en la inicialización
if (process.env.NODE_ENV === 'development') {
    testConnection().catch(console.error);
}

