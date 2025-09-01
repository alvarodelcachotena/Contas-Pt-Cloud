// Script para probar WhatsApp con imagen real
// Ejecuta: node scripts/test-whatsapp-real.js

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función para simular envío de imagen por WhatsApp
async function testWhatsAppWithRealImage() {
    console.log('🧪 Probando WhatsApp con imagen real...');

    try {
        // 1. Crear una imagen de prueba (factura simulada)
        console.log('\n1️⃣ Creando imagen de prueba...');

        // Crear un archivo de imagen de prueba (base64 simple)
        const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testImagePath = path.join(__dirname, 'test-invoice.png');

        // Guardar imagen de prueba
        fs.writeFileSync(testImagePath, Buffer.from(testImageData, 'base64'));
        console.log('✅ Imagen de prueba creada:', testImagePath);

        // 2. Simular mensaje de WhatsApp con la imagen real
        console.log('\n2️⃣ Simulando mensaje de WhatsApp con imagen...');

        // Crear payload realista de WhatsApp
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

        // 3. Enviar al webhook de producción (Netlify)
        console.log('\n3️⃣ Enviando al webhook de producción...');

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

            console.log('\n🎉 ¡Mensaje enviado exitosamente!');
            console.log('📱 Ahora ve a tu aplicación y verifica:');
            console.log('   1. Ve a "Documents" - Debería aparecer el documento');
            console.log('   2. Ve a "Webhooks Monitoring" - Debería mostrar el procesamiento');
            console.log('   3. Verifica que el estado sea "Completed"');

        } else {
            console.log('❌ Webhook POST: FALLIDO');
            console.log('   Status:', webhookResponse.status);
            const errorText = await webhookResponse.text();
            console.log('   Error:', errorText);
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
    console.log('🚀 PROBANDO WHATSAPP CON IMAGEN REAL\n');

    // Verificar variables de entorno
    if (!checkEnvironmentVariables()) {
        console.log('\n❌ No se pueden ejecutar las pruebas sin las variables de entorno');
        return;
    }

    // Probar webhook con imagen real
    await testWhatsAppWithRealImage();

    console.log('\n🏁 Prueba completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
