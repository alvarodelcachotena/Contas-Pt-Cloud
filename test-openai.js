import OpenAI from 'openai';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

console.log('🔧 Probando conexión con OpenAI...');
console.log('📝 API Key configurada:', process.env.OPENAI_API_KEY ? 'SÍ' : 'NO');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('🚀 Enviando petición de prueba...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Dime hola en português" }
      ],
      max_tokens: 50,
    });

    console.log('✅ Respuesta de OpenAI:', completion.choices[0]?.message?.content);
    console.log('🎉 ¡API de OpenAI funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error al conectar con OpenAI:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Tipo:', error.type);
    
    if (error.code === 'invalid_api_key') {
      console.log('\n🔑 Solución: Verifica tu clave API en https://platform.openai.com/account/api-keys');
    } else if (error.code === 'insufficient_quota') {
      console.log('\n💰 Solución: Tu cuenta de OpenAI no tiene créditos suficientes');
    }
  }
}

testOpenAI(); 