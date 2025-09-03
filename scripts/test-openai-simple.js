import OpenAI from 'openai';

async function testOpenAI() {
    try {
        console.log('🔍 Iniciando prueba de OpenAI...');

        const openai = new OpenAI({
            apiKey: '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',
            baseURL: 'https://api.openai.com/v1'
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
        if (error && typeof error === 'object' && 'response' in error) {
            console.error('Detalles del error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
        }
    }
}

testOpenAI();
