// Script para probar el webhook de WhatsApp localmente
// Ejecuta: node scripts/test-whatsapp-webhook.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función para enviar imagen de prueba
async function testWhatsAppWebhook() {
    console.log('🧪 Probando webhook de WhatsApp...');

    try {
        // 1. Verificar que el webhook responde
        console.log('\n1️⃣ Probando verificación del webhook...');
        const verifyUrl = `http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=1c7eba0ef1c438301a9b0f369d6e1708&hub.challenge=test123`;

        const verifyResponse = await fetch(verifyUrl);
        const verifyText = await verifyResponse.text();

        if (verifyResponse.ok && verifyText === 'test123') {
            console.log('✅ Verificación del webhook: EXITOSA');
        } else {
            console.log('❌ Verificación del webhook: FALLIDA');
            console.log('   Status:', verifyResponse.status);
            console.log('   Response:', verifyText);
            return;
        }

        // 2. Simular mensaje de WhatsApp con imagen
        console.log('\n2️⃣ Simulando mensaje de WhatsApp con imagen...');

        // Crear payload simulado de WhatsApp
        const mockWhatsAppPayload = {
            object: "whatsapp_business_account",
            entry: [{
                id: "123456789",
                changes: [{
                    value: {
                        messaging_product: "whatsapp",
                        metadata: {
                            display_phone_number: "+351123456789",
                            phone_number_id: "664728370058197"
                        },
                        contacts: [{
                            profile: {
                                name: "Usuario Test"
                            },
                            wa_id: "351123456789"
                        }],
                        messages: [{
                            id: "test_message_id",
                            from: "351123456789",
                            timestamp: new Date().toISOString(),
                            type: "image",
                            image: {
                                id: "test_image_id",
                                mime_type: "image/jpeg",
                                sha256: "test_sha256",
                                filename: "test_invoice.jpg"
                            }
                        }]
                    },
                    field: "messages"
                }]
            }]
        };

        // Enviar payload al webhook
        const webhookResponse = await fetch('http://localhost:3000/api/webhooks/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockWhatsAppPayload)
        });

        if (webhookResponse.ok) {
            console.log('✅ Webhook POST: EXITOSO');
            const responseData = await webhookResponse.json();
            console.log('   Response:', responseData);
        } else {
            console.log('❌ Webhook POST: FALLIDO');
            console.log('   Status:', webhookResponse.status);
            const errorText = await webhookResponse.text();
            console.log('   Error:', errorText);
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
}

// Función para verificar variables de entorno
function checkEnvironmentVariables() {
    console.log('🔍 Verificando variables de entorno...');

    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'WHATSAPP_ACCESS_TOKEN',
        'WHATSAPP_PHONE_NUMBER_ID',
        'WHATSAPP_BUSINESS_ACCOUNT_ID',
        'WHATSAPP_APP_ID',
        'WHATSAPP_APP_SECRET',
        'WHATSAPP_VERIFY_TOKEN',
        'GEMINI_AI_API_KEY'
    ];

    let allSet = true;

    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`   ✅ ${varName}: Configurada`);
        } else {
            console.log(`   ❌ ${varName}: NO configurada`);
            allSet = false;
        }
    });

    if (!allSet) {
        console.log('\n⚠️  Algunas variables de entorno no están configuradas');
        console.log('   Asegúrate de tener un archivo .env con todas las variables necesarias');
        return false;
    }

    console.log('\n✅ Todas las variables de entorno están configuradas');
    return true;
}

// Función principal
async function main() {
    console.log('🚀 INICIANDO PRUEBAS DEL WEBHOOK DE WHATSAPP\n');

    // Verificar variables de entorno
    if (!checkEnvironmentVariables()) {
        console.log('\n❌ No se pueden ejecutar las pruebas sin las variables de entorno');
        return;
    }

    // Probar webhook
    await testWhatsAppWebhook();

    console.log('\n🏁 Pruebas completadas');
}

// Ejecutar si se llama directamente
main().catch(console.error);
