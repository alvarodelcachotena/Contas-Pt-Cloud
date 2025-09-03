// Script de diagnóstico para WhatsApp Webhook
// Ejecuta: node scripts/diagnose-whatsapp-webhook.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function diagnoseWhatsAppWebhook() {
    console.log('🔍 DIAGNÓSTICO DEL WEBHOOK DE WHATSAPP\n');

    try {
        // 1. Verificar variables de entorno
        console.log('1️⃣ VERIFICANDO VARIABLES DE ENTORNO:');
        const credentials = {
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
            appId: process.env.WHATSAPP_APP_ID,
            appSecret: process.env.WHATSAPP_APP_SECRET,
            verifyToken: process.env.WHATSAPP_VERIFY_TOKEN
        };

        Object.entries(credentials).forEach(([key, value]) => {
            if (value) {
                console.log(`   ✅ ${key}: ${value.substring(0, 20)}...`);
            } else {
                console.log(`   ❌ ${key}: NO configurada`);
            }
        });

        // 2. Verificar webhook de verificación
        console.log('\n2️⃣ VERIFICANDO WEBHOOK DE VERIFICACIÓN:');
        const verifyUrl = `https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${credentials.verifyToken}&hub.challenge=test123`;

        console.log(`   URL de verificación: ${verifyUrl}`);

        const verifyResponse = await fetch(verifyUrl);
        const verifyText = await verifyResponse.text();

        if (verifyResponse.ok && verifyText === 'test123') {
            console.log('   ✅ Verificación: EXITOSA');
        } else {
            console.log('   ❌ Verificación: FALLIDA');
            console.log(`      Status: ${verifyResponse.status}`);
            console.log(`      Response: ${verifyText}`);
        }

        // 3. Verificar que el webhook esté activo
        console.log('\n3️⃣ VERIFICANDO ESTADO DEL WEBHOOK:');

        // Intentar obtener información del webhook
        const webhookInfoUrl = `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/subscribed_apps`;

        try {
            const webhookResponse = await fetch(webhookInfoUrl, {
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`
                }
            });

            if (webhookResponse.ok) {
                const webhookData = await webhookResponse.json();
                console.log('   ✅ Webhook activo en Facebook');
                console.log(`      Apps suscritas: ${webhookData.data?.length || 0}`);
            } else {
                console.log('   ❌ No se pudo verificar estado del webhook');
                console.log(`      Status: ${webhookResponse.status}`);
            }
        } catch (error) {
            console.log('   ❌ Error verificando webhook:', error.message);
        }

        // 4. Verificar logs del webhook
        console.log('\n4️⃣ VERIFICANDO LOGS DEL WEBHOOK:');
        console.log('   📱 Envía una imagen por WhatsApp AHORA MISMO');
        console.log('   🔍 Luego ejecuta: node scripts/check-webhook-logs.js');

        // 5. Instrucciones para configurar en Facebook Developers
        console.log('\n5️⃣ CONFIGURACIÓN EN FACEBOOK DEVELOPERS:');
        console.log('   📋 Ve a: https://developers.facebook.com/apps');
        console.log('   🔍 Busca tu app de WhatsApp Business');
        console.log('   ⚙️  Ve a: WhatsApp > Configuration');
        console.log('   🔗 En "Webhook" configura:');
        console.log(`      URL: https://contas-pt.netlify.app/api/webhooks/whatsapp`);
        console.log(`      Verify Token: ${credentials.verifyToken}`);
        console.log('   📱 Suscribe los eventos: messages, message_deliveries');

        // 6. Verificar que el número esté verificado
        console.log('\n6️⃣ VERIFICANDO NÚMERO DE TELÉFONO:');
        console.log(`   📞 Número ID: ${credentials.phoneNumberId}`);
        console.log(`   🏢 Business Account: ${credentials.businessAccountId}`);
        console.log('   ✅ Asegúrate de que el número esté verificado en WhatsApp Business');

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
    }
}

// Función principal
async function main() {
    await diagnoseWhatsAppWebhook();
    console.log('\n🏁 Diagnóstico completado');
}

// Ejecutar si se llama directamente
main().catch(console.error);
