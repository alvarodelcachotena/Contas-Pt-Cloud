// Script para verificar logs de Netlify
// Ejecuta: node scripts/check-netherlify-logs.js

import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

async function checkNetlifyLogs() {
    console.log('🔍 VERIFICANDO LOGS DE NETLIFY\n');

    try {
        console.log('1️⃣ INSTRUCCIONES PARA VERIFICAR LOGS:');
        console.log('\n📱 PASOS PARA VER LOGS:');
        console.log('   1. Ve a: https://app.netlify.com/sites/contas-pt');
        console.log('   2. Ve a: Functions > Logs');
        console.log('   3. Busca logs del webhook de WhatsApp');
        console.log('   4. Filtra por: whatsapp');

        console.log('\n2️⃣ QUÉ BUSCAR EN LOS LOGS:');
        console.log('   - Errores 403 o 401');
        console.log('   - Mensajes de verificación fallida');
        console.log('   - Errores de autenticación');
        console.log('   - Problemas con variables de entorno');

        console.log('\n3️⃣ POSIBLES ERRORES:');
        console.log('   ❌ "Verification failed"');
        console.log('   ❌ "Invalid token"');
        console.log('   ❌ "Unauthorized"');
        console.log('   ❌ "Environment variables not found"');

        console.log('\n4️⃣ SOLUCIÓN INMEDIATA:');
        console.log('   🔧 Verificar que el token en Facebook Developers sea:');
        console.log('      test123456');
        console.log('   🔧 No: 1c7eba0ef1c438301a9b0f369d6e1708');

        console.log('\n5️⃣ CONFIGURACIÓN CORRECTA:');
        console.log('   📋 En Facebook Developers:');
        console.log('      - Webhook URL: https://contas-pt.netlify.app/api/webhooks/whatsapp');
        console.log('      - Verify Token: test123456');
        console.log('      - Webhook Fields: messages, message_deliveries');

        console.log('\n6️⃣ VERIFICACIÓN RÁPIDA:');
        console.log('   🔍 Ejecuta: node scripts/test-whatsapp-complete.js');
        console.log('   🔍 Si funciona, el problema está en Facebook Developers');
        console.log('   🔍 Si no funciona, el problema está en Netlify');

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
}

// Función principal
async function main() {
    await checkNetlifyLogs();
    console.log('\n🏁 Verificación completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
