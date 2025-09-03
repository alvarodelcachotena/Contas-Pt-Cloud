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
            // apiKey: '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'
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
