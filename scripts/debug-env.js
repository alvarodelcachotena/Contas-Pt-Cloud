#!/usr/bin/env node

/**
 * Script para debuggar as variáveis de ambiente
 */

import 'dotenv/config';

function debugEnvironment() {
    console.log('🔍 Debug das variáveis de ambiente...\n');

    // Verificar se dotenv está funcionando
    console.log('1. Status do dotenv:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
    console.log(`   PWD: ${process.env.PWD || 'não definido'}`);
    console.log(`   CWD: ${process.cwd()}\n`);

    // Verificar variáveis críticas
    console.log('2. Variáveis críticas da base de dados:');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl) {
        console.log(`   ✅ SUPABASE_URL: ${supabaseUrl.substring(0, 50)}...`);

        // Verificar formato da URL
        if (supabaseUrl.startsWith('postgresql://')) {
            console.log('   ✅ Formato correto (postgresql://)');
        } else if (supabaseUrl.startsWith('https://')) {
            console.log('   ⚠️ Formato incorreto (https://) - deve ser postgresql://');
        } else {
            console.log('   ❌ Formato desconhecido');
        }
    } else {
        console.log('   ❌ SUPABASE_URL: não configurada');
    }

    if (supabaseAnonKey) {
        console.log(`   ✅ SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 10)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 4)}`);
    } else {
        console.log('   ❌ SUPABASE_ANON_KEY: não configurada');
    }

    if (supabaseServiceKey) {
        console.log(`   ✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey.substring(0, 10)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 4)}`);
    } else {
        console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY: não configurada');
    }

    console.log('\n3. APIs de IA:');

    const googleAIKey = process.env.GOOGLE_AI_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    if (googleAIKey && !googleAIKey.includes('sua_chave')) {
        console.log(`   ✅ GOOGLE_AI_API_KEY: ${googleAIKey.substring(0, 10)}...${googleAIKey.substring(googleAIKey.length - 4)}`);
    } else {
        console.log('   ❌ GOOGLE_AI_API_KEY: não configurada ou inválida');
    }

    if (openAIKey && !openAIKey.includes('sua_chave')) {
        console.log(`   ✅ OPENAI_API_KEY: ${openAIKey.substring(0, 10)}...${openAIKey.substring(openAIKey.length - 4)}`);
    } else {
        console.log('   ❌ OPENAI_API_KEY: não configurada ou inválida');
    }

    console.log('\n4. Teste de conexão direta:');

    if (supabaseUrl) {
        console.log('   🔄 Tentando conexão direta...');

        // Simular teste de conexão
        if (supabaseUrl.includes('supabase.co')) {
            console.log('   ✅ URL parece válida (contém supabase.co)');

            // Verificar se é uma URL de conexão PostgreSQL
            if (supabaseUrl.includes('postgresql://')) {
                console.log('   ✅ Formato de conexão PostgreSQL correto');
            } else {
                console.log('   ❌ PROBLEMA: URL não é formato PostgreSQL');
                console.log('   🔧 SOLUÇÃO: Mude para formato postgresql://');
                console.log('   Exemplo correto: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres');
            }
        } else {
            console.log('   ❌ URL não parece ser do Supabase');
        }
    }

    console.log('\n📊 RESUMO:');
    console.log('=====================');

    const hasSupabaseUrl = !!supabaseUrl;
    const hasSupabaseKeys = !!(supabaseAnonKey && supabaseServiceKey);
    const hasValidFormat = supabaseUrl && supabaseUrl.startsWith('postgresql://');

    if (hasSupabaseUrl && hasSupabaseKeys && hasValidFormat) {
        console.log('✅ Configuração da base de dados parece correta');
        console.log('✅ Todas as variáveis necessárias estão configuradas');
        console.log('✅ Formato da URL está correto');

        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('1. Verifique se o Supabase está online');
        console.log('2. Teste a conectividade de rede');
        console.log('3. Execute o script de teste da base de dados');

        console.log('\n🚀 Ambiente configurado corretamente!');
    } else {
        console.log('❌ Configuração incompleta ou incorreta');

        if (!hasSupabaseUrl) {
            console.log('   ❌ SUPABASE_URL não configurada');
        }
        if (!hasSupabaseKeys) {
            console.log('   ❌ Chaves do Supabase não configuradas');
        }
        if (!hasValidFormat) {
            console.log('   ❌ Formato da URL incorreto');
        }

        console.log('\n🔧 PROBLEMAS IDENTIFICADOS:');
        if (!hasValidFormat && hasSupabaseUrl) {
            console.log('1. A SUPABASE_URL deve começar com "postgresql://"');
            console.log('2. Não use "https://" para conexão de banco de dados');
            console.log('3. Obtenha a URL de conexão do painel do Supabase');
        }

        console.log('\n🚨 AÇÕES NECESSÁRIAS:');
        console.log('1. Verifique o arquivo .env');
        console.log('2. Corrija o formato da SUPABASE_URL');
        console.log('3. Configure todas as chaves necessárias');
        console.log('4. Execute este script novamente para verificar');
    }
}

// Executar debug
debugEnvironment();
