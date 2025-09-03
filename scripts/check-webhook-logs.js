// Script para verificar logs del webhook en tiempo real
// Ejecuta: node scripts/check-webhook-logs.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkWebhookLogs() {
    console.log('🔍 VERIFICANDO LOGS DEL WEBHOOK EN TIEMPO REAL\n');

    try {
        // 1. Verificar que el webhook esté funcionando
        console.log('1️⃣ VERIFICANDO ESTADO DEL WEBHOOK:');

        const webhookUrl = 'https://contas-pt.netlify.app/api/webhooks/whatsapp';
        const response = await fetch(webhookUrl, { method: 'GET' });

        if (response.ok) {
            console.log('   ✅ Webhook está respondiendo');
        } else {
            console.log('   ❌ Webhook no responde');
            console.log(`      Status: ${response.status}`);
            return;
        }

        // 2. Verificar logs de Netlify
        console.log('\n2️⃣ VERIFICANDO LOGS DE NETLIFY:');
        console.log('   📋 Ve a tu dashboard de Netlify:');
        console.log('   🔍 https://app.netlify.com/sites/contas-pt');
        console.log('   📊 Ve a: Functions > Logs');
        console.log('   🔍 Busca logs del webhook de WhatsApp');

        // 3. Verificar logs de Supabase
        console.log('\n3️⃣ VERIFICANDO LOGS DE SUPABASE:');
        console.log('   📋 Ve a tu dashboard de Supabase:');
        console.log('   🔍 Ve a: Logs > Database');
        console.log('   🔍 Busca inserciones en la tabla "documents"');

        // 4. Verificar que el webhook esté configurado en Facebook
        console.log('\n4️⃣ CONFIGURACIÓN EN FACEBOOK DEVELOPERS:');
        console.log('   📱 IMPORTANTE: El webhook debe estar configurado en Facebook');
        console.log('   🔗 URL del webhook: https://contas-pt.netlify.app/api/webhooks/whatsapp');
        console.log('   🔑 Verify Token: Debe coincidir con WHATSAPP_VERIFY_TOKEN en .env');
        console.log('   📋 Eventos suscritos: messages, message_deliveries');

        // 5. Instrucciones paso a paso
        console.log('\n5️⃣ PASOS PARA CONFIGURAR WEBHOOK:');
        console.log('   📋 1. Ve a: https://developers.facebook.com/apps');
        console.log('   🔍 2. Selecciona tu app de WhatsApp Business');
        console.log('   ⚙️  3. Ve a: WhatsApp > Configuration');
        console.log('   🔗 4. En "Webhook" haz clic en "Configure"');
        console.log('   📝 5. URL: https://contas-pt.netlify.app/api/webhooks/whatsapp');
        console.log('   🔑 6. Verify Token: (el valor de WHATSAPP_VERIFY_TOKEN)');
        console.log('   📱 7. Suscribe eventos: messages, message_deliveries');
        console.log('   ✅ 8. Haz clic en "Verify and Save"');

        // 6. Verificar que el número esté activo
        console.log('\n6️⃣ VERIFICAR NÚMERO DE WHATSAPP:');
        console.log('   📞 Asegúrate de que tu número de WhatsApp Business esté:');
        console.log('      ✅ Verificado');
        console.log('      ✅ Activo');
        console.log('      ✅ Con permisos para recibir mensajes');

        // 7. Prueba de envío
        console.log('\n7️⃣ PRUEBA DE ENVÍO:');
        console.log('   📱 Envía una imagen por WhatsApp AHORA MISMO');
        console.log('   🔍 Luego ejecuta: node scripts/test-whatsapp-complete.js');
        console.log('   📊 Verifica en Netlify Functions > Logs');

    } catch (error) {
        console.error('❌ Error verificando logs:', error);
    }
}

// Función principal
async function main() {
    await checkWebhookLogs();
    console.log('\n🏁 Verificación completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
