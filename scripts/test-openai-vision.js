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
