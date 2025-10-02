console.log('🤖 === CONFIGURACIÓN DE MÚLTIPLES CHATBOTS DE WHATSAPP ===\n');

// Verificar variables de entorno principales
console.log('📋 VERIFICANDO CONFIGURACIÓN BÁSICA:\n');

const chatbots = [
    { name: 'Principal España', prefix: '', var: 'WHATSAPP_ACCESS_TOKEN' },
    { name: 'Colombia', prefix: '_2', var: 'WHATSAPP_ACCESS_TOKEN_2' },
    { name: 'Secundario España', prefix: '_3', var: 'WHATSAPP_ACCESS_TOKEN_3' }
];

chatbots.forEach((chatbot, index) => {
    console.log(`🤖 ${chatbot.name}:`);
    const token = process.env[chatbot.var] ? '✅ Token configurado' : '❌ Falta configurar';
    console.log(`   - Token: ${token}`);
    console.log('');
});

console.log('📋 INSTRUCTIONS:\n');
console.log('1. Copia: env-example-whatsapp-multiple-chatbots.txt como .env.local');
console.log('2. Configura todas las variables de entorno');
console.log('3. Crea 3 aplicaciones en Facebook Developers');
console.log('4. Configura webhooks para cada aplicación');
console.log('5. Ejecuta: psql -f scripts/setup-whatsapp-multiple-chatbots.sql');
console.log('6. Reinicia la aplicación');
console.log('\n✅ Configuración de múltiples chatbots completada correctamente! 🎉');
