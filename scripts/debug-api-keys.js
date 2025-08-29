#!/usr/bin/env node

/**
 * Script para debugar as chaves de API
 */

import 'dotenv/config';

console.log('🔍 Debug das Chaves de API...\n');

console.log('📋 Variáveis de ambiente:');
console.log('==========================');
console.log(`   GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);

if (process.env.GOOGLE_AI_API_KEY) {
    console.log(`   Google AI Key: ${process.env.GOOGLE_AI_API_KEY.substring(0, 20)}...`);

    // Testar se a chave é válida
    if (process.env.GOOGLE_AI_API_KEY.includes('AIzaSy')) {
        console.log('   ✅ Formato da chave Google AI parece correto');
    } else {
        console.log('   ⚠️ Formato da chave Google AI pode estar incorreto');
    }
}

if (process.env.OPENAI_API_KEY) {
    console.log(`   OpenAI Key: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);

    // Testar se a chave é válida
    if (process.env.OPENAI_API_KEY.includes('sk-')) {
        console.log('   ✅ Formato da chave OpenAI parece correto');
    } else {
        console.log('   ⚠️ Formato da chave OpenAI pode estar incorreto');
    }
}

console.log('\n🧪 Testando inicialização dos clientes...');
console.log('==========================================');

try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const OpenAI = await import('openai');

    const googleAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;
    const openai = process.env.OPENAI_API_KEY ? new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY }) : null;

    console.log(`   Google AI Client: ${googleAI ? '✅ Inicializado' : '❌ NULL'}`);
    console.log(`   OpenAI Client: ${openai ? '✅ Inicializado' : '❌ NULL'}`);

    if (!googleAI && !openai) {
        console.log('\n❌ PROBLEMA: Ambos os clientes estão NULL!');
        console.log('   Isso significa que as chaves não estão sendo lidas corretamente.');
        console.log('\n💡 SOLUÇÕES:');
        console.log('1. Verifique se o arquivo .env está na raiz do projeto');
        console.log('2. Verifique se as chaves estão escritas corretamente');
        console.log('3. Reinicie o servidor após as correções');
    }

} catch (error) {
    console.log('❌ Erro ao testar inicialização:', error.message);
}

console.log('\n🚀 Debug concluído!');
