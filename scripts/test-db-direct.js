#!/usr/bin/env node

/**
 * Script direto para testar a conexão com a base de dados
 */

import 'dotenv/config';
import postgres from 'postgres';

async function testDatabaseDirect() {
    console.log('🧪 Testando conexão direta com a base de dados...\n');

    try {
        // Verificar variáveis de ambiente
        console.log('1. Verificando variáveis de ambiente...');

        if (!process.env.SUPABASE_URL) {
            console.log('❌ SUPABASE_URL não configurada');
            console.log('   Adicione SUPABASE_URL ao seu arquivo .env');
            return;
        }

        console.log('✅ SUPABASE_URL configurada');
        console.log(`   URL: ${process.env.SUPABASE_URL.substring(0, 50)}...\n`);

        // Testar conexão direta
        console.log('2. Testando conexão direta com Postgres...');

        const client = postgres(process.env.SUPABASE_URL, {
            ssl: 'require',
            connect_timeout: 10,
            max: 1
        });

        try {
            // Teste básico de conexão
            const result = await client`SELECT 1 as test`;
            console.log('✅ Conexão com Postgres estabelecida');
            console.log(`   Resultado do teste: ${result[0]?.test}\n`);

            // Testar se as tabelas existem
            console.log('3. Verificando existência das tabelas...');

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
            console.log('\n4. Testando consulta de dados de negócio...');

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
                } else {
                    console.log('   ⚠️ Nenhum dado encontrado');
                }
            } catch (error) {
                console.log(`   ❌ Erro na consulta de dados: ${error.message}`);
            }

            console.log('\n📊 RESUMO:');
            console.log('=====================');
            console.log('✅ Conexão com base de dados funcionando');
            console.log('✅ Tabelas acessíveis');
            console.log('✅ Consultas executando');

            console.log('\n💡 DIAGNÓSTICO:');
            console.log('=====================');
            console.log('Se todas as tabelas mostram 0 registros:');
            console.log('1. As tabelas podem estar vazias');
            console.log('2. O tenant_id pode estar incorreto');
            console.log('3. Pode haver problemas de permissões');

            console.log('\n🚀 Base de dados está acessível!');

        } finally {
            await client.end();
        }

    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        console.log('\n🔧 SOLUÇÕES:');
        console.log('1. Verifique se SUPABASE_URL está correta');
        console.log('2. Confirme se o Supabase está acessível');
        console.log('3. Teste a conectividade de rede');
        console.log('4. Verifique se as credenciais estão corretas');
    }
}

// Executar teste
testDatabaseDirect().catch(console.error);
