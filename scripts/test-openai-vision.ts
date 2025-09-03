import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

async function testOpenAI() {
    try {
        console.log('🔍 Iniciando prueba de OpenAI Vision...');

        const openai = new OpenAI({
            apiKey: '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',
            baseURL: 'https://api.openai.com/v1', // Asegurarnos de usar la URL correcta
        });

        // Primero probar una llamada simple
        console.log('🔄 Probando llamada simple...');
        const simpleResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: "Test connection" }],
            max_tokens: 5
        });
        console.log('✅ Llamada simple exitosa:', simpleResponse.choices[0].message);

        // Luego probar con una imagen
        console.log('🔄 Probando análisis de imagen...');
        const testImage = fs.readFileSync(path.join(process.cwd(), 'test-image.jpg')); // Asegúrate de tener una imagen de prueba
        const base64Image = testImage.toString('base64');

        const visionResponse = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What's in this image?" },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300
        });

        console.log('✅ Análisis de imagen exitoso:', visionResponse.choices[0].message);

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
        if (error && typeof error === 'object' && 'response' in error) {
            const err = error as any;
            console.error('Detalles del error:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data
            });
        }
    }
};

testOpenAI();
