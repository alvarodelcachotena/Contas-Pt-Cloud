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
