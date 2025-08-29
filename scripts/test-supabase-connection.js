#!/usr/bin/env node

/**
 * Script para testar diferentes formatos de conexão Supabase
 */

import 'dotenv/config';
import { Client } from 'pg';

async function testSupabaseConnection() {
    console.log('🔍 Testando diferentes formatos de conexão Supabase...\n');

    // URLs de prueba
    const testUrls = [
        // Tu URL actual
        'postgresql://postgres:mattyykenet1@db.ylhevsvsquuqhcluurfl.supabase.co:5432/postgres',

        // URL con pooler (recomendada) - NUEVA URL DEL USUARIO
        'postgresql://postgres.ylhevsvsquuqhcluurfl:Mattyykenet1@aws-1-eu-north-1.pooler.supabase.com:6543/postgres',

        // URL alternativa con pooler
        'postgresql://postgres.ylhevsvsquuqhcluurfl:mattyykenet1@db.ylhevsvsquuqhcluurfl.supabase.co:6543/postgres',

        // URL con formato estándar
        'postgresql://postgres:mattyykenet1@ylhevsvsquuqhcluurfl.supabase.co:5432/postgres'
    ];

    for (let i = 0; i < testUrls.length; i++) {
        const url = testUrls[i];
        console.log(`🧪 Testando URL ${i + 1}:`);
        console.log(`   ${url}`);

        try {
            const client = new Client({
                connectionString: url,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 10000,
                query_timeout: 10000
            });

            console.log('   🔄 Tentando conectar...');
            await client.connect();
            console.log('   ✅ Conexão bem-sucedida!');

            // Testar consulta simples
            try {
                const result = await client.query('SELECT COUNT(*) as total FROM invoices WHERE tenant_id = 1');
                console.log(`   📊 Total de faturas: ${result.rows[0]?.total || 0}`);

                // Si funciona, probar más consultas
                const clientsResult = await client.query('SELECT COUNT(*) as total FROM clients WHERE tenant_id = 1');
                const expensesResult = await client.query('SELECT COUNT(*) as total FROM expenses WHERE tenant_id = 1');

                console.log(`   👥 Total de clientes: ${clientsResult.rows[0]?.total || 0}`);
                console.log(`   💰 Total de despesas: ${expensesResult.rows[0]?.total || 0}`);

                await client.end();

                console.log('\n🎯 URL FUNCIONANDO! Use esta URL no seu .env:');
                console.log(`   SUPABASE_URL=${url}`);
                return;

            } catch (queryError) {
                console.log(`   ⚠️ Conexão OK, mas erro na consulta: ${queryError.message}`);
                await client.end();
            }

        } catch (error) {
            console.log(`   ❌ Falha na conexão: ${error.code || 'N/A'} - ${error.message}`);
        }

        console.log('');
    }

    console.log('❌ Nenhuma das URLs funcionou.');
    console.log('\n💡 SOLUÇÕES:');
    console.log('1. Verifique se a senha está correta');
    console.log('2. Verifique se o projeto está ativo no Supabase');
    console.log('3. Tente usar a URL do pooler no dashboard do Supabase');
}

// Executar teste
testSupabaseConnection().catch(console.error);

