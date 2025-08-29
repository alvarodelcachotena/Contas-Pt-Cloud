#!/usr/bin/env node

import 'dotenv/config';

console.log('🔍 Mostrando variáveis de ambiente...\n');

// Mostrar SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL;
console.log('SUPABASE_URL:');
if (supabaseUrl) {
    console.log(`   ${supabaseUrl}`);

    if (supabaseUrl.startsWith('postgresql://')) {
        console.log('   ✅ Formato correto');
    } else if (supabaseUrl.startsWith('https://')) {
        console.log('   ❌ PROBLEMA: Formato incorreto (https://)');
        console.log('   🔧 Deve ser postgresql:// para conexão de banco');
    } else {
        console.log('   ❌ Formato desconhecido');
    }
} else {
    console.log('   ❌ Não configurada');
}

console.log('');

// Mostrar outras variáveis
console.log('Outras variáveis:');
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
console.log(`GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);

console.log('\n💡 Para corrigir problemas:');
console.log('1. A SUPABASE_URL deve começar com postgresql://');
console.log('2. Não use https:// para conexão de banco');
console.log('3. Obtenha a URL correta do painel do Supabase');
