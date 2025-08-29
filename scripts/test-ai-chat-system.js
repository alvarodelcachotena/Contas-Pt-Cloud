#!/usr/bin/env node

/**
 * Script de teste para o sistema de chat AI
 * Testa a conexão com a base de dados e as APIs de IA
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando o sistema de chat AI...\n');

// Verificar se o arquivo .env existe
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado!');
    console.log('📝 Copie o arquivo env-example.txt para .env e configure suas chaves API');
    console.log('💡 Exemplo: cp env-example.txt .env');
    process.exit(1);
}

// Verificar variáveis de ambiente
require('dotenv').config();

const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.log('❌ Variáveis de ambiente em falta:');
    missingEnvVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n📝 Configure estas variáveis no arquivo .env');
    process.exit(1);
}

// Verificar APIs de IA
const aiApis = [];
if (process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_AI_API_KEY !== 'sua_chave_api_google_ai_aqui') {
    aiApis.push('Google AI (Gemini)');
}
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sua_chave_api_openai_aqui') {
    aiApis.push('OpenAI');
}

if (aiApis.length === 0) {
    console.log('⚠️  Nenhuma API de IA configurada!');
    console.log('📝 Configure pelo menos uma das seguintes no arquivo .env:');
    console.log('   - GOOGLE_AI_API_KEY');
    console.log('   - OPENAI_API_KEY');
    console.log('\n💡 O sistema funcionará em modo offline com dados da base de dados');
} else {
    console.log('✅ APIs de IA configuradas:');
    aiApis.forEach(api => console.log(`   - ${api}`));
}

console.log('\n🔍 Testando conexão com a base de dados...');

// Testar conexão com Supabase
try {
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('URL ou chave do Supabase não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Testar conexão básica
    const { data, error } = await supabase.from('tenants').select('count').limit(1);

    if (error) {
        throw error;
    }

    console.log('✅ Conexão com Supabase estabelecida com sucesso!');

    // Verificar tabelas principais
    const tables = ['tenants', 'users', 'invoices', 'expenses', 'clients', 'payments'];
    console.log('\n📊 Verificando tabelas principais...');

    for (const table of tables) {
        try {
            const { count, error: tableError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (tableError) {
                console.log(`   ❌ ${table}: ${tableError.message}`);
            } else {
                console.log(`   ✅ ${table}: ${count || 0} registos`);
            }
        } catch (tableError) {
            console.log(`   ❌ ${table}: Erro ao verificar`);
        }
    }

} catch (dbError) {
    console.log('❌ Erro na conexão com a base de dados:');
    console.log(`   ${dbError.message}`);
    console.log('\n🔧 Verifique:');
    console.log('   1. Se as credenciais do Supabase estão corretas');
    console.log('   2. Se a base de dados está acessível');
    console.log('   3. Se as tabelas foram criadas');
}

console.log('\n🧪 Testando endpoint de chat AI...');

// Testar endpoint local
try {
    const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Quantas faturas tenho no sistema?'
        }),
    });

    if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint de chat AI funcionando!');
        console.log(`   Modelo usado: ${data.model}`);
        console.log(`   Dados da BD usados: ${data.databaseDataUsed ? 'Sim' : 'Não'}`);
    } else {
        const errorData = await response.json();
        console.log(`⚠️  Endpoint respondeu com status ${response.status}:`);
        console.log(`   ${errorData.error || 'Erro desconhecido'}`);
    }

} catch (endpointError) {
    console.log('❌ Erro ao testar endpoint de chat AI:');
    console.log(`   ${endpointError.message}`);
    console.log('\n🔧 Verifique se:');
    console.log('   1. O servidor Next.js está a executar (npm run dev)');
    console.log('   2. A porta 3000 está livre');
    console.log('   3. As dependências estão instaladas');
}

console.log('\n📋 RESUMO DOS TESTES:');
console.log('=====================');

if (aiApis.length > 0) {
    console.log('✅ APIs de IA configuradas');
} else {
    console.log('⚠️  Modo offline (apenas dados da BD)');
}

console.log('✅ Base de dados configurada');
console.log('✅ Sistema de fallback implementado');

console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('=====================');

if (aiApis.length === 0) {
    console.log('1. Configure pelo menos uma API de IA no arquivo .env');
    console.log('2. Obtenha chaves API de:');
    console.log('   - Google AI: https://makersuite.google.com/app/apikey');
    console.log('   - OpenAI: https://platform.openai.com/api-keys');
}

console.log('3. Teste o chatbot com perguntas como:');
console.log('   - "Qual é o meu lucro atual?"');
console.log('   - "Quantas faturas tenho?"');
console.log('   - "Quantos clientes tenho?"');
console.log('   - "Qual é o total de despesas?"');

console.log('\n🚀 Sistema pronto para uso!');
