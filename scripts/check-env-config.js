#!/usr/bin/env node

/**
 * Script para verificar a configuração do arquivo .env
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

function checkEnvironmentConfig() {
    console.log('🔍 Verificando configuração do ambiente...\n');

    // Verificar se o arquivo .env existe
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.log('❌ Arquivo .env não encontrado!');
        console.log('   Crie um arquivo .env baseado no env-example.txt');
        return;
    }
    console.log('✅ Arquivo .env encontrado\n');

    // Verificar variáveis críticas
    const criticalVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    console.log('1. Verificando variáveis críticas da base de dados:');

    let allCriticalVarsSet = true;

    for (const varName of criticalVars) {
        const value = process.env[varName];
        if (!value) {
            console.log(`   ❌ ${varName}: Não configurada`);
            allCriticalVarsSet = false;
        } else {
            const displayValue = varName.includes('KEY') || varName.includes('SECRET')
                ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
                : value;
            console.log(`   ✅ ${varName}: ${displayValue}`);
        }
    }

    if (!allCriticalVarsSet) {
        console.log('\n❌ PROBLEMA: Variáveis críticas da base de dados não configuradas!');
        console.log('\n🔧 SOLUÇÃO:');
        console.log('1. Copie o arquivo env-example.txt para .env');
        console.log('2. Preencha as variáveis SUPABASE_* com valores reais');
        console.log('3. Obtenha as credenciais do seu projeto Supabase');
        return;
    }

    console.log('\n2. Verificando formato da SUPABASE_URL:');
    const supabaseUrl = process.env.SUPABASE_URL;

    if (supabaseUrl) {
        if (supabaseUrl.includes('supabase.co')) {
            console.log('   ✅ Formato da URL parece correto (contém supabase.co)');
        } else {
            console.log('   ⚠️ Formato da URL pode estar incorreto');
        }

        if (supabaseUrl.startsWith('postgresql://')) {
            console.log('   ✅ URL usa formato postgresql:// (correto)');
        } else if (supabaseUrl.startsWith('https://')) {
            console.log('   ⚠️ URL usa https:// (deve ser postgresql://)');
            console.log('   🔧 CORREÇÃO: Mude para formato postgresql://');
        } else {
            console.log('   ❌ Formato de URL desconhecido');
        }
    }

    console.log('\n3. Verificando APIs de IA:');
    const googleAIKey = process.env.GOOGLE_AI_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    if (googleAIKey && !googleAIKey.includes('sua_chave')) {
        console.log('   ✅ Google AI API Key configurada');
    } else {
        console.log('   ❌ Google AI API Key não configurada ou inválida');
    }

    if (openAIKey && !openAIKey.includes('sua_chave')) {
        console.log('   ✅ OpenAI API Key configurada');
    } else {
        console.log('   ❌ OpenAI API Key não configurada ou inválida');
    }

    console.log('\n📊 RESUMO:');
    console.log('=====================');

    if (allCriticalVarsSet) {
        console.log('✅ Configuração da base de dados parece correta');
        console.log('✅ Arquivo .env configurado');

        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('1. Verifique se o Supabase está online');
        console.log('2. Teste a conectividade de rede');
        console.log('3. Execute o script de teste da base de dados');

        console.log('\n🚀 Ambiente configurado corretamente!');
    } else {
        console.log('❌ Configuração incompleta');
        console.log('❌ Base de dados não acessível');

        console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
        console.log('1. Variáveis SUPABASE não configuradas');
        console.log('2. Arquivo .env pode estar vazio ou incorreto');
        console.log('3. Credenciais do Supabase não fornecidas');

        console.log('\n🔧 AÇÕES NECESSÁRIAS:');
        console.log('1. Configure o arquivo .env com credenciais reais');
        console.log('2. Obtenha as credenciais do seu projeto Supabase');
        console.log('3. Verifique se o projeto Supabase está ativo');
    }
}

// Executar verificação
checkEnvironmentConfig();
