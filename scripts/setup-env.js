#!/usr/bin/env node

/**
 * Script para configurar o arquivo .env
 */

import fs from 'fs';
import path from 'path';

function setupEnvironmentFile() {
    console.log('🔧 Configurando arquivo .env...\n');

    const envPath = path.join(process.cwd(), '.env');
    const examplePath = path.join(process.cwd(), 'env-example.txt');

    // Verificar se o arquivo .env já existe
    if (fs.existsSync(envPath)) {
        console.log('⚠️ Arquivo .env já existe!');
        console.log('   Se você quiser recriar, delete o arquivo atual primeiro.');
        return;
    }

    // Verificar se o arquivo de exemplo existe
    if (!fs.existsSync(examplePath)) {
        console.log('❌ Arquivo env-example.txt não encontrado!');
        return;
    }

    try {
        // Ler o arquivo de exemplo
        const exampleContent = fs.readFileSync(examplePath, 'utf8');

        // Criar o arquivo .env
        fs.writeFileSync(envPath, exampleContent);

        console.log('✅ Arquivo .env criado com sucesso!');
        console.log(`   Localização: ${envPath}`);

        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('=====================');
        console.log('1. Abra o arquivo .env em um editor de texto');
        console.log('2. Substitua os valores de exemplo pelas suas credenciais reais');
        console.log('3. Salve o arquivo');
        console.log('4. Execute o script de verificação novamente');

        console.log('\n🔑 CREDENCIAIS NECESSÁRIAS:');
        console.log('=====================');
        console.log('• SUPABASE_URL: URL de conexão do seu projeto Supabase');
        console.log('• SUPABASE_ANON_KEY: Chave anônima do Supabase');
        console.log('• SUPABASE_SERVICE_ROLE_KEY: Chave de serviço do Supabase');
        console.log('• GOOGLE_AI_API_KEY: Chave da API do Google AI (Gemini)');
        console.log('• OPENAI_API_KEY: Chave da API do OpenAI');

        console.log('\n🌐 ONDE OBTER AS CREDENCIAIS:');
        console.log('=====================');
        console.log('• Supabase: https://supabase.com/dashboard');
        console.log('• Google AI: https://makersuite.google.com/app/apikey');
        console.log('• OpenAI: https://platform.openai.com/api-keys');

        console.log('\n⚠️ IMPORTANTE:');
        console.log('=====================');
        console.log('• Nunca compartilhe suas credenciais');
        console.log('• O arquivo .env está no .gitignore (não será commitado)');
        console.log('• Mantenha suas chaves seguras');

        console.log('\n🚀 Após configurar, execute:');
        console.log('   node scripts/check-env-config.js');

    } catch (error) {
        console.error('❌ Erro ao criar arquivo .env:', error.message);
    }
}

// Executar configuração
setupEnvironmentFile();
