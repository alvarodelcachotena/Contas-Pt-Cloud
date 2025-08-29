#!/usr/bin/env node

/**
 * Script para testar a conexão com a base de dados
 */

import 'dotenv/config';
import { Client } from 'pg';

async function testDatabaseConnection() {
    console.log('🔍 Testando conexão com a base de dados...\n');

    // Verificar variáveis de ambiente
    console.log('📋 Variáveis de ambiente:');
    console.log('==========================');
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Não configurada'}`);

    if (!process.env.SUPABASE_URL) {
        console.log('\n❌ SUPABASE_URL não configurada!');
        console.log('   Adicione SUPABASE_URL no arquivo .env');
        return;
    }

    // Verificar formato da URL
    console.log('\n🔗 Análise da URL:');
    console.log('==================');
    const url = process.env.SUPABASE_URL;
    console.log(`   URL completa: ${url}`);

    if (url.startsWith('https://')) {
        console.log('   ⚠️ PROBLEMA: URL começa com https://');
        console.log('   🔧 SOLUÇÃO: Deve ser postgresql:// para conexão direta');
        console.log('   💡 Exemplo correto: postgresql://postgres:[password]@[host]:5432/postgres');
    } else if (url.startsWith('postgresql://')) {
        console.log('   ✅ Formato correto: postgresql://');
    } else {
        console.log('   ❌ Formato desconhecido');
    }

    // Tentar conexão direta se for postgresql://
    if (url.startsWith('postgresql://')) {
        console.log('\n🔄 Tentando conexão direta...');

        try {
            const client = new Client({
                connectionString: url,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 10000,
                query_timeout: 10000
            });

            await client.connect();
            console.log('✅ Conexão direta bem-sucedida!');

            // Testar consultas simples
            console.log('\n🧪 Testando consultas...');

            // Teste 1: Contar faturas
            try {
                const result1 = await client.query('SELECT COUNT(*) as total FROM invoices WHERE tenant_id = 1');
                console.log(`   📄 Total de faturas: ${result1.rows[0]?.total || 0}`);
            } catch (e) {
                console.log(`   ❌ Erro ao contar faturas: ${e.message}`);
            }

            // Teste 2: Contar despesas
            try {
                const result2 = await client.query('SELECT COUNT(*) as total FROM expenses WHERE tenant_id = 1');
                console.log(`   💰 Total de despesas: ${result2.rows[0]?.total || 0}`);
            } catch (e) {
                console.log(`   ❌ Erro ao contar despesas: ${e.message}`);
            }

            // Teste 3: Contar clientes
            try {
                const result3 = await client.query('SELECT COUNT(*) as total FROM clients WHERE tenant_id = 1');
                console.log(`   👥 Total de clientes: ${result3.rows[0]?.total || 0}`);
            } catch (e) {
                console.log(`   ❌ Erro ao contar clientes: ${e.message}`);
            }

            await client.end();

        } catch (error) {
            console.log('❌ Erro na conexão direta:');
            console.log(`   Código: ${error.code || 'N/A'}`);
            console.log(`   Mensagem: ${error.message}`);

            if (error.code === 'ETIMEDOUT') {
                console.log('   🔧 PROBLEMA: Timeout na conexão');
                console.log('   SOLUÇÃO: Verifique se a URL está correta');
            } else if (error.code === 'ECONNREFUSED') {
                console.log('   🔧 PROBLEMA: Conexão recusada');
                console.log('   SOLUÇÃO: Verifique se o servidor está ativo');
            }
        }
    }

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('=====================');
    console.log('1. Se a URL começa com https://, corrija para postgresql://');
    console.log('2. Verifique se as credenciais estão corretas');
    console.log('3. Teste novamente após as correções');

    console.log('\n🚀 Teste da base de dados concluído!');
}

// Executar teste
testDatabaseConnection().catch(console.error);
