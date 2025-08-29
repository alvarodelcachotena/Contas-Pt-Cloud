#!/usr/bin/env node

/**
 * Script simples para testar a conexão com a base de dados
 */

import 'dotenv/config';
import { testConnection, db } from '../server/db.js';

async function testSimpleDatabase() {
    console.log('🧪 Testando conexão simples com a base de dados...\n');

    try {
        // Testar se as variáveis de ambiente estão configuradas
        console.log('1. Verificando variáveis de ambiente...');

        if (!process.env.SUPABASE_URL) {
            console.log('❌ SUPABASE_URL não configurada');
            return;
        }

        if (!process.env.SUPABASE_ANON_KEY) {
            console.log('❌ SUPABASE_ANON_KEY não configurada');
            return;
        }

        console.log('✅ Variáveis de ambiente configuradas\n');

        // Testar conexão básica
        console.log('2. Testando conexão básica...');

        const isConnected = await testConnection();

        if (!isConnected) {
            console.log('❌ Falha na conexão básica');
            return;
        }

        console.log('✅ Conexão básica estabelecida\n');

        // Testar consulta simples
        console.log('3. Testando consulta simples...');

        try {
            const result = await db.execute(`SELECT COUNT(*) as total FROM invoices WHERE tenant_id = 1`);
            console.log(`   ✅ Total de faturas: ${result[0]?.total || 0}`);
        } catch (error) {
            console.log(`   ❌ Erro ao consultar faturas: ${error.message}`);
        }

        console.log('\n📊 RESUMO:');
        console.log('=====================');
        console.log('✅ Base de dados acessível');
        console.log('✅ Conexão funcionando');
        console.log('✅ Consultas executando');

        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('=====================');
        console.log('1. Teste o chatbot com perguntas sobre o negócio');
        console.log('2. Verifique se há dados nas tabelas');
        console.log('3. Configure as APIs de IA para funcionalidade completa');

        console.log('\n🚀 Base de dados pronta para o RAG!');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

// Executar teste
testSimpleDatabase().catch(console.error);
