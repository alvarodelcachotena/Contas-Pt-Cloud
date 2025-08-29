import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { SUPABASE_URL } from './config';
import * as schema from '../shared/schema';

// Configuração melhorada da conexão
const connectionString = SUPABASE_URL!;

// Configurar cliente postgres com opções otimizadas
const client = postgres(connectionString, {
    max: 10, // Máximo de conexões
    idle_timeout: 20, // Timeout de conexões ociosas
    connect_timeout: 10, // Timeout de conexão
    max_lifetime: 60 * 30, // Vida máxima da conexão (30 minutos)
    ssl: 'require', // SSL obrigatório para Supabase
    prepare: false, // Desabilitar prepared statements para melhor performance
    debug: process.env.NODE_ENV === 'development' // Debug apenas em desenvolvimento
});

// Criar instância da base de dados
export const db = drizzle(client, { schema });

// Função para testar a conexão
export async function testConnection() {
    try {
        const result = await client`SELECT 1 as test`;
        console.log('✅ Conexão com base de dados estabelecida com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão com base de dados:', error);
        return false;
    }
}

// Função para fechar conexões (útil para testes)
export async function closeConnection() {
    try {
        await client.end();
        console.log('✅ Conexões da base de dados fechadas');
    } catch (error) {
        console.error('❌ Erro ao fechar conexões:', error);
    }
}

// Verificar conexão na inicialização
if (process.env.NODE_ENV === 'development') {
    testConnection().catch(console.error);
}

