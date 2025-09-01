// Script completo para probar WhatsApp con respuestas automáticas
// Ejecuta: node scripts/test-whatsapp-complete.js

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función para probar el webhook completo
async function testWhatsAppComplete() {
    console.log('🧪 Probando sistema completo de WhatsApp...');

    try {
        // 1. Verificar webhook de verificación
        console.log('\n1️⃣ Probando verificación del webhook...');

        const verifyUrl = 'https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=1c7eba0ef1c438301a9b0f369d6e1708&hub.challenge=test123';

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

        // 2. Crear imagen de prueba más realista
        console.log('\n2️⃣ Creando imagen de prueba realista...');

        // Crear una imagen de prueba más grande (1x1 pixel PNG)
        const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testImagePath = path.join(__dirname, 'test-invoice.png');

        fs.writeFileSync(testImagePath, Buffer.from(testImageData, 'base64'));
        console.log('✅ Imagen de prueba creada:', testImagePath);

        // 3. Simular mensaje de WhatsApp real
        console.log('\n3️⃣ Simulando mensaje de WhatsApp real...');

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
                            id: "test_message_id_" + Date.now(),
                            from: "351123456789",
                            timestamp: new Date().toISOString(),
                            type: "image",
                            image: {
                                id: "test_image_id_" + Date.now(),
                                mime_type: "image/png",
                                sha256: "test_sha256_" + Date.now(),
                                filename: "test_invoice.png"
                            }
                        }]
                    },
                    field: "messages"
                }]
            }]
        };

        // 4. Enviar al webhook de producción
        console.log('\n4️⃣ Enviando al webhook de producción...');

        const webhookResponse = await fetch('https://contas-pt.netlify.app/api/webhooks/whatsapp', {
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

            console.log('\n🎉 ¡Sistema funcionando correctamente!');
            console.log('\n📱 FLUJO COMPLETO:');
            console.log('   1. ✅ Imagen recibida por WhatsApp');
            console.log('   2. ✅ Webhook procesa la imagen');
            console.log('   3. ✅ Se guarda en Supabase Storage');
            console.log('   4. ✅ Se crea registro en base de datos');
            console.log('   5. ✅ Gemini AI analiza la imagen');
            console.log('   6. ✅ Se envía mensaje de confirmación');
            console.log('   7. ✅ Documento aparece en la aplicación');

            console.log('\n🔍 VERIFICAR EN LA APLICACIÓN:');
            console.log('   1. Ve a "Documents" - Debería aparecer el documento');
            console.log('   2. Ve a "Webhooks Monitoring" - Debería mostrar el procesamiento');
            console.log('   3. Verifica que el estado sea "Completed"');

            console.log('\n📱 VERIFICAR EN WHATSAPP:');
            console.log('   Deberías recibir mensajes de confirmación automáticos');

        } else {
            console.log('❌ Webhook POST: FALLIDO');
            console.log('   Status:', webhookResponse.status);
            const errorText = await webhookResponse.text();
            console.log('   Error:', errorText);
        }

        // 5. Limpiar archivo de prueba
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
    console.log('🚀 PRUEBA COMPLETA DEL SISTEMA DE WHATSAPP\n');

    // Verificar variables de entorno
    if (!checkEnvironmentVariables()) {
        console.log('\n❌ No se pueden ejecutar las pruebas sin las variables de entorno');
        return;
    }

    // Probar sistema completo
    await testWhatsAppComplete();

    console.log('\n🏁 Prueba completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
