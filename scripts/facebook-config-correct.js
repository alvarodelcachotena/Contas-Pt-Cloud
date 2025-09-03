// Script con configuración correcta de Facebook Developers
// Ejecuta: node scripts/facebook-config-correct.js

import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

async function facebookConfigCorrect() {
    console.log('🔧 CONFIGURACIÓN CORRECTA DE FACEBOOK DEVELOPERS\n');

    try {
        console.log('📋 CONFIGURACIÓN EXACTA REQUERIDA:');
        console.log('\n🔑 TOKEN CORRECTO:');
        console.log('   1c7eba0ef1c438301a9b0f369d6e1708');

        console.log('\n🌐 WEBHOOK URL:');
        console.log('   https://contas-pt.netlify.app/api/webhooks/whatsapp');

        console.log('\n📱 PASOS EXACTOS EN FACEBOOK DEVELOPERS:');
        console.log('   1. Ve a: https://developers.facebook.com/apps/');
        console.log('   2. Selecciona tu aplicación de WhatsApp Business');
        console.log('   3. Ve a: WhatsApp > Configuration');
        console.log('   4. En la sección "Webhook":');
        console.log('      - Haz clic en "Add Callback URL"');
        console.log('      - URL: https://contas-pt.netlify.app/api/webhooks/whatsapp');
        console.log('      - Verify Token: 1c7eba0ef1c438301a9b0f369d6e1708');
        console.log('      - Haz clic en "Verify and Save"');
        console.log('   5. En "Webhook Fields" suscríbete a:');
        console.log('      - ✅ messages');
        console.log('      - ✅ message_deliveries');
        console.log('   6. Haz clic en "Save"');

        console.log('\n🔍 VERIFICACIÓN IMPORTANTE:');
        console.log('   1. Asegúrate de que el número de WhatsApp Business esté activo');
        console.log('   2. Verifica que el número esté verificado en Facebook');
        console.log('   3. Comprueba que tienes permisos de administrador');
        console.log('   4. El webhook debe mostrar "Verified" en verde');

        console.log('\n⚠️  PROBLEMAS COMUNES:');
        console.log('   ❌ Token incorrecto (usar el correcto arriba)');
        console.log('   ❌ URL incorrecta (usar la exacta arriba)');
        console.log('   ❌ No suscrito a eventos (messages, message_deliveries)');
        console.log('   ❌ Número de WhatsApp no activo');
        console.log('   ❌ Permisos insuficientes en la app');

        console.log('\n✅ DESPUÉS DE CONFIGURAR:');
        console.log('   1. Envía una imagen por WhatsApp');
        console.log('   2. Deberías recibir mensaje automático');
        console.log('   3. Verifica en tu aplicación > Documents');
        console.log('   4. Verifica en Webhooks Monitoring');

        console.log('\n🔧 SI NO FUNCIONA:');
        console.log('   1. Verifica logs de Netlify');
        console.log('   2. Ejecuta: node scripts/test-whatsapp-real-download.js');
        console.log('   3. Comprueba que Facebook Developers esté configurado');

    } catch (error) {
        console.error('❌ Error durante la configuración:', error);
    }
}

// Función principal
async function main() {
    await facebookConfigCorrect();
    console.log('\n🏁 Configuración completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
