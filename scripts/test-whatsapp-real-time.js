// Script para probar WhatsApp en tiempo real
// Ejecuta: node scripts/test-whatsapp-real-time.js

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testWhatsAppRealTime() {
    console.log('🧪 PRUEBA DE WHATSAPP EN TIEMPO REAL\n');

    try {
        // 1. Crear imagen de prueba real
        console.log('1️⃣ Creando imagen de prueba...');

        // Crear una imagen PNG real (1x1 pixel)
        const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testImagePath = path.join(__dirname, 'test-invoice-real.png');

        fs.writeFileSync(testImagePath, Buffer.from(testImageData, 'base64'));
        console.log('✅ Imagen de prueba creada:', testImagePath);

        // 2. Simular mensaje de WhatsApp real
        console.log('\n2️⃣ Simulando mensaje de WhatsApp real...');

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
                                name: "Usuario Test Real"
                            },
                            wa_id: "351123456789"
                        }],
                        messages: [{
                            id: "real_message_" + Date.now(),
                            from: "351123456789",
                            timestamp: new Date().toISOString(),
                            type: "image",
                            image: {
                                id: "real_image_" + Date.now(),
                                mime_type: "image/png",
                                sha256: "real_sha256_" + Date.now(),
                                filename: "test_invoice_real.png"
                            }
                        }]
                    },
                    field: "messages"
                }]
            }]
        };

        // 3. Enviar al webhook de producción
        console.log('\n3️⃣ Enviando al webhook de producción...');
        console.log('   🔗 URL: https://contas-pt.netlify.app/api/webhooks/whatsapp');

        const webhookResponse = await fetch('https://contas-pt.netlify.app/api/webhooks/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WhatsApp-Webhook-Test/1.0'
            },
            body: JSON.stringify(mockWhatsAppPayload)
        });

        console.log('\n4️⃣ RESPUESTA DEL WEBHOOK:');
        console.log(`   📊 Status: ${webhookResponse.status}`);
        console.log(`   📋 Headers:`, Object.fromEntries(webhookResponse.headers.entries()));

        if (webhookResponse.ok) {
            const responseData = await webhookResponse.json();
            console.log('   ✅ Response:', responseData);

            console.log('\n🎉 ¡Webhook funcionando!');
            console.log('\n📱 AHORA VERIFICA:');
            console.log('   1. Ve a Netlify > Functions > Logs');
            console.log('   2. Busca logs del webhook de WhatsApp');
            console.log('   3. Ve a tu aplicación > Documents');
            console.log('   4. Ve a tu aplicación > Webhooks Monitoring');

        } else {
            const errorText = await webhookResponse.text();
            console.log('   ❌ Error:', errorText);

            console.log('\n🔍 DIAGNÓSTICO:');
            if (webhookResponse.status === 403) {
                console.log('   ❌ 403 Forbidden: El webhook no está configurado en Facebook');
                console.log('   📋 Ve a Facebook Developers > WhatsApp > Configuration');
                console.log('   🔗 Configura el webhook con la URL correcta');
            } else if (webhookResponse.status === 404) {
                console.log('   ❌ 404 Not Found: La URL del webhook no existe');
                console.log('   📋 Verifica que la URL sea correcta');
            } else if (webhookResponse.status === 500) {
                console.log('   ❌ 500 Internal Error: Error en el servidor');
                console.log('   📋 Revisa los logs de Netlify');
            }
        }

        // 4. Limpiar archivo de prueba
        try {
            fs.unlinkSync(testImagePath);
            console.log('\n🧹 Archivo de prueba eliminado');
        } catch (error) {
            console.log('⚠️  No se pudo eliminar archivo de prueba');
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
}

// Función principal
async function main() {
    await testWhatsAppRealTime();
    console.log('\n🏁 Prueba completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
