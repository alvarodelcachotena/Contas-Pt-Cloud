#!/usr/bin/env node

/**
 * Script para testar as APIs de IA
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

async function testAPIs() {
    console.log('🧪 Testando APIs de IA...\n');

    // 1. Testar Google AI (Gemini)
    console.log('1. TESTANDO GOOGLE AI (GEMINI):');
    console.log('================================');

    const googleAIKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleAIKey) {
        console.log('❌ GOOGLE_AI_API_KEY não configurada');
    } else {
        console.log(`✅ Chave configurada: ${googleAIKey.substring(0, 20)}...`);

        try {
            const genAI = new GoogleGenerativeAI(googleAIKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            console.log('🔄 Enviando teste para Google AI...');

            const result = await model.generateContent("Diga apenas 'Teste funcionando' em português");
            const response = result.response.text();

            console.log('✅ Google AI funcionando!');
            console.log(`   Resposta: ${response}`);

        } catch (error) {
            console.log('❌ Erro na Google AI:');
            console.log(`   Código: ${error.code || 'N/A'}`);
            console.log(`   Mensagem: ${error.message}`);

            if (error.message.includes('API key not valid')) {
                console.log('   🔧 PROBLEMA: Chave da API inválida');
                console.log('   SOLUÇÃO: Verifique se a chave está correta');
            } else if (error.message.includes('quota')) {
                console.log('   🔧 PROBLEMA: Cota excedida');
                console.log('   SOLUÇÃO: Aguarde ou verifique o uso da API');
            }
        }
    }

    console.log('');

    // 2. Testar OpenAI
    console.log('2. TESTANDO OPENAI:');
    console.log('====================');

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
        console.log('❌ OPENAI_API_KEY não configurada');
    } else {
        console.log(`✅ Chave configurada: ${openAIKey.substring(0, 20)}...`);

        try {
            const openai = new OpenAI({ apiKey: openAIKey });

            console.log('🔄 Enviando teste para OpenAI...');

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "user", content: "Diga apenas 'Teste funcionando' em português" }
                ],
                max_tokens: 50,
                temperature: 0.7,
            });

            const response = completion.choices[0]?.message?.content;

            console.log('✅ OpenAI funcionando!');
            console.log(`   Resposta: ${response}`);

        } catch (error) {
            console.log('❌ Erro na OpenAI:');
            console.log(`   Código: ${error.code || 'N/A'}`);
            console.log(`   Mensagem: ${error.message}`);

            if (error.message.includes('Incorrect API key')) {
                console.log('   🔧 PROBLEMA: Chave da API incorreta');
                console.log('   SOLUÇÃO: Verifique se a chave está correta');
            } else if (error.message.includes('quota')) {
                console.log('   🔧 PROBLEMA: Cota excedida');
                console.log('   SOLUÇÃO: Aguarde ou verifique o uso da API');
            }
        }
    }

    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('=======================');

    // Verificar se as chaves estão no formato correto
    if (googleAIKey && !googleAIKey.includes('AIzaSy')) {
        console.log('⚠️ GOOGLE_AI_API_KEY pode estar em formato incorreto');
    }

    if (openAIKey && !openAIKey.includes('sk-')) {
        console.log('⚠️ OPENAI_API_KEY pode estar em formato incorreto');
    }

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('=====================');
    console.log('1. Se ambas as APIs funcionaram, o problema está no chatbot');
    console.log('2. Se uma falhou, corrija a chave correspondente');
    console.log('3. Execute o chatbot novamente após as correções');

    console.log('\n🚀 Teste das APIs concluído!');
}

// Executar teste
testAPIs().catch(console.error);
