import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testOpenAI() {
    try {
        console.log('🔍 Iniciando prueba de OpenAI...');

        const openai = new OpenAI({
            apiKey: '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'
        });

        console.log('🔄 Probando llamada simple...');
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: "Test connection" }],
            max_tokens: 5
        });

        console.log('✅ Test exitoso:', response.choices[0].message);

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
        console.error('Detalles:', error.message);
    }
}

testOpenAI();
