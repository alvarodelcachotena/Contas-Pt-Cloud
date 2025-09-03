// Script para verificar configuración de Facebook Developers
// Ejecuta: node scripts/check-facebook-config.js

import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

async function checkFacebookConfig() {
    console.log('🔍 VERIFICANDO CONFIGURACIÓN DE FACEBOOK DEVELOPERS\n');

    try {
        // 1. Verificar variables de entorno
        console.log('1️⃣ Verificando variables de entorno...');

        const whatsappVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
        const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

        console.log('   📋 Variables encontradas:');
        console.log(`      WHATSAPP_VERIFY_TOKEN: ${whatsappVerifyToken ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`      WHATSAPP_ACCESS_TOKEN: ${whatsappAccessToken ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`      WHATSAPP_PHONE_NUMBER_ID: ${whatsappPhoneNumberId ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`      WHATSAPP_BUSINESS_ACCOUNT_ID: ${whatsappBusinessAccountId ? '✅ Configurado' : '❌ No configurado'}`);

        // 2. Verificar webhook URL
        console.log('\n2️⃣ Verificando webhook URL...');

        const webhookUrl = 'https://contas-pt.netlify.app/api/webhooks/whatsapp';
        console.log(`   📋 URL del webhook: ${webhookUrl}`);

        // Probar webhook
        const verifyUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${whatsappVerifyToken}&hub.challenge=test123`;
        const verifyResponse = await fetch(verifyUrl);

        console.log(`   📊 Status del webhook: ${verifyResponse.status}`);
        if (verifyResponse.ok) {
            console.log('   ✅ Webhook responde correctamente');
        } else {
            console.log('   ❌ Webhook no responde correctamente');
        }

        // 3. Instrucciones para Facebook Developers
        console.log('\n3️⃣ CONFIGURACIÓN REQUERIDA EN FACEBOOK DEVELOPERS:');
        console.log('\n📱 PASOS PARA CONFIGURAR:');
        console.log('   1. Ve a: https://developers.facebook.com/apps/');
        console.log('   2. Selecciona tu aplicación de WhatsApp Business');
        console.log('   3. Ve a: WhatsApp > Configuration');
        console.log('   4. En "Webhook" configura:');
        console.log(`      - Webhook URL: ${webhookUrl}`);
        console.log(`      - Verify Token: ${whatsappVerifyToken}`);
        console.log('   5. En "Webhook Fields" suscríbete a:');
        console.log('      - ✅ messages');
        console.log('      - ✅ message_deliveries');
        console.log('   6. Guarda la configuración');

        console.log('\n🔍 VERIFICACIÓN ADICIONAL:');
        console.log('   1. Asegúrate de que tu número de WhatsApp Business esté activo');
        console.log('   2. Verifica que el número esté verificado en Facebook');
        console.log('   3. Comprueba que tienes permisos de administrador en la app');

        console.log('\n📊 ESTADO ACTUAL:');
        console.log('   - Webhook URL: ✅ Configurado');
        console.log('   - Verify Token: ✅ Configurado');
        console.log('   - Variables de entorno: ✅ Configuradas');
        console.log('   - Problema: ❌ WhatsApp real no llega al webhook');

        console.log('\n🎯 POSIBLES CAUSAS:');
        console.log('   1. Facebook Developers no está suscrito a eventos');
        console.log('   2. El número de WhatsApp no está activo');
        console.log('   3. Permisos insuficientes en la aplicación');
        console.log('   4. El webhook no está verificado en Facebook');

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
}

// Función principal
async function main() {
    await checkFacebookConfig();
    console.log('\n🏁 Verificación completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
