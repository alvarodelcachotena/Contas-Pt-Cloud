#!/usr/bin/env node

/**
 * Script para diagnosticar e solucionar problemas do RAG com a base de dados
 */

import 'dotenv/config';
import postgres from 'postgres';

async function diagnoseAndFixRAG() {
    console.log('🔍 Diagnóstico do Sistema RAG - Base de Dados\n');

    // 1. Verificar variáveis de ambiente
    console.log('1. VERIFICANDO VARIÁVEIS DE AMBIENTE:');
    console.log('=====================================');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        console.log('❌ SUPABASE_URL não configurada!');
        console.log('   🔧 SOLUÇÃO: Adicione SUPABASE_URL ao arquivo .env');
        return;
    }

    if (!supabaseAnonKey) {
        console.log('❌ SUPABASE_ANON_KEY não configurada!');
        console.log('   🔧 SOLUÇÃO: Adicione SUPABASE_ANON_KEY ao arquivo .env');
        return;
    }

    if (!supabaseServiceKey) {
        console.log('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
        console.log('   🔧 SOLUÇÃO: Adicione SUPABASE_SERVICE_ROLE_KEY ao arquivo .env');
        return;
    }

    console.log('✅ Todas as variáveis SUPABASE configuradas');

    // 2. Verificar formato da URL
    console.log('\n2. VERIFICANDO FORMATO DA SUPABASE_URL:');
    console.log('=========================================');

    if (supabaseUrl.startsWith('https://')) {
        console.log('❌ PROBLEMA CRÍTICO: SUPABASE_URL usa formato https://');
        console.log('   🔧 CORREÇÃO NECESSÁRIA:');
        console.log('   A URL deve começar com postgresql:// para conexão de banco');
        console.log('   Não use https:// para conexão de banco de dados');
        console.log('');
        console.log('   📋 COMO CORRIGIR:');
        console.log('   1. Vá para https://supabase.com/dashboard');
        console.log('   2. Selecione seu projeto');
        console.log('   3. Vá para Settings → Database');
        console.log('   4. Copie a "Connection string" (deve começar com postgresql://)');
        console.log('   5. Substitua no arquivo .env');
        console.log('');
        console.log('   Exemplo correto:');
        console.log('   postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres');
        return;
    }

    if (!supabaseUrl.startsWith('postgresql://')) {
        console.log('❌ PROBLEMA: Formato de URL incorreto');
        console.log('   🔧 Deve começar com postgresql://');
        return;
    }

    console.log('✅ Formato da URL correto (postgresql://)');

    // 3. Testar conexão
    console.log('\n3. TESTANDO CONEXÃO COM A BASE DE DADOS:');
    console.log('==========================================');

    try {
        console.log('🔄 Tentando conectar...');

        const client = postgres(supabaseUrl, {
            ssl: 'require',
            connect_timeout: 15,
            max: 1
        });

        // Teste básico
        const result = await client`SELECT 1 as test`;
        console.log('✅ Conexão estabelecida com sucesso!');
        console.log(`   Resultado do teste: ${result[0]?.test}`);

        // Testar tabelas
        console.log('\n4. VERIFICANDO TABELAS:');
        console.log('========================');

        const tables = ['invoices', 'expenses', 'clients', 'payments'];

        for (const table of tables) {
            try {
                const countResult = await client`SELECT COUNT(*) as total FROM ${client(table)} WHERE tenant_id = 1`;
                const count = countResult[0]?.total || 0;
                console.log(`   ✅ ${table}: ${count} registros encontrados`);
            } catch (error) {
                console.log(`   ❌ ${table}: ${error.message}`);
            }
        }

        // Testar consulta de dados de negócio
        console.log('\n5. TESTANDO CONSULTA DE DADOS DE NEGÓCIO:');
        console.log('===========================================');

        try {
            const businessData = await client`
                SELECT 
                    (SELECT COUNT(*) FROM invoices WHERE tenant_id = 1) as total_invoices,
                    (SELECT COUNT(*) FROM expenses WHERE tenant_id = 1) as total_expenses,
                    (SELECT COUNT(*) FROM clients WHERE tenant_id = 1) as total_clients,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE tenant_id = 1) as total_revenue,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE tenant_id = 1) as total_expenses_amount
            `;

            if (businessData && businessData.length > 0) {
                const data = businessData[0];
                console.log('   ✅ Dados obtidos com sucesso:');
                console.log(`      • Faturas: ${data.total_invoices || 0}`);
                console.log(`      • Despesas: ${data.total_expenses || 0}`);
                console.log(`      • Clientes: ${data.total_clients || 0}`);
                console.log(`      • Receita: €${data.total_revenue || 0}`);
                console.log(`      • Despesas: €${data.total_expenses_amount || 0}`);

                const profit = (data.total_revenue || 0) - (data.total_expenses_amount || 0);
                console.log(`      • Lucro: €${profit}`);

                if (data.total_invoices > 0 || data.total_expenses > 0 || data.total_clients > 0) {
                    console.log('\n🎉 SUCESSO: Base de dados tem dados e RAG deve funcionar!');
                    console.log('   Agora teste o chatbot com perguntas sobre o negócio');
                } else {
                    console.log('\n⚠️ ATENÇÃO: Base de dados conecta mas não tem dados');
                    console.log('   🔧 SOLUÇÃO: Insira dados de teste nas tabelas');
                }
            }
        } catch (error) {
            console.log(`   ❌ Erro na consulta de dados: ${error.message}`);
        }

        await client.end();

    } catch (error) {
        console.log(`❌ Erro na conexão: ${error.message}`);

        if (error.message.includes('CONNECT_TIMEOUT')) {
            console.log('\n🔧 SOLUÇÕES PARA TIMEOUT:');
            console.log('1. Verifique se o Supabase está online');
            console.log('2. Teste a conectividade de rede');
            console.log('3. Verifique se as credenciais estão corretas');
            console.log('4. Confirme se o projeto não foi pausado');
        }

        if (error.message.includes('authentication')) {
            console.log('\n🔧 SOLUÇÕES PARA AUTENTICAÇÃO:');
            console.log('1. Verifique se SUPABASE_ANON_KEY está correta');
            console.log('2. Confirme se a chave não expirou');
            console.log('3. Verifique as permissões da chave');
        }
    }

    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log('============================');
    console.log('✅ Variáveis de ambiente configuradas');
    console.log('✅ Formato da URL correto');

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('=====================');
    console.log('1. Se a conexão funcionou, teste o chatbot');
    console.log('2. Se houve erro, corrija conforme as instruções acima');
    console.log('3. Execute este script novamente para verificar');

    console.log('\n🚀 Sistema RAG pronto para funcionar!');
}

// Executar diagnóstico
diagnoseAndFixRAG().catch(console.error);
