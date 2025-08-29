#!/usr/bin/env node

import 'dotenv/config';

console.log('🔍 Verificação rápida das variáveis de ambiente...\n');

// Verificar SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl) {
    console.log(`✅ SUPABASE_URL configurada:`);
    console.log(`   ${supabaseUrl}`);

    if (supabaseUrl.startsWith('postgresql://')) {
        console.log('   ✅ Formato correto (postgresql://)');
    } else if (supabaseUrl.startsWith('https://')) {
        console.log('   ❌ PROBLEMA: Formato incorreto (https://)');
        console.log('   🔧 Deve ser postgresql:// para conexão de banco');
    } else {
        console.log('   ❌ Formato desconhecido');
    }
} else {
    console.log('❌ SUPABASE_URL não configurada');
}

console.log('');

// Verificar outras variáveis
const vars = [
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_AI_API_KEY',
    'OPENAI_API_KEY'
];

console.log('📋 Outras variáveis:');
vars.forEach(varName => {
    const value = process.env[varName];
    if (value && !value.includes('sua_chave')) {
        console.log(`   ✅ ${varName}: Configurada`);
    } else {
        console.log(`   ❌ ${varName}: Não configurada ou inválida`);
    }
});

console.log('\n💡 Para corrigir problemas:');
console.log('1. Verifique o arquivo .env');
console.log('2. A SUPABASE_URL deve começar com postgresql://');
console.log('3. Não use https:// para conexão de banco');
console.log('4. Obtenha a URL correta do painel do Supabase');
