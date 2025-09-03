// Script para probar WhatsApp con descarga real de archivos
// Ejecuta: node scripts/test-whatsapp-real-download.js

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testWhatsAppRealDownload() {
    console.log('📥 PROBANDO WHATSAPP CON DESCARGA REAL DE ARCHIVOS\n');

    try {
        // 1. Verificar que el webhook esté funcionando
        console.log('1️⃣ Verificando webhook...');

        const verifyUrl = 'https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=1c7eba0ef1c438301a9b0f369d6e1708&hub.challenge=test123';
        const verifyResponse = await fetch(verifyUrl);

        if (verifyResponse.ok) {
            console.log('   ✅ Webhook funcionando correctamente');
        } else {
            console.log('   ❌ Webhook no funciona');
            return;
        }

        // 2. Crear una imagen real de prueba
        console.log('\n2️⃣ Creando imagen real de prueba...');

        // Crear una imagen PNG más realista (factura simulada)
        const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const testImagePath = path.join(__dirname, 'test-invoice-real.png');

        fs.writeFileSync(testImagePath, Buffer.from(testImageData, 'base64'));
        console.log('   ✅ Imagen de prueba creada:', testImagePath);

        // 3. Simular mensaje de WhatsApp con datos más realistas
        console.log('\n3️⃣ Simulando mensaje de WhatsApp realista...');

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
                                name: "Usuario Real"
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

        // 4. Enviar al webhook
        console.log('\n4️⃣ Enviando imagen al webhook...');

        const webhookResponse = await fetch('https://contas-pt.netlify.app/api/webhooks/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockWhatsAppPayload)
        });

        console.log(`   📊 Status: ${webhookResponse.status}`);

        if (webhookResponse.ok) {
            const responseData = await webhookResponse.json();
            console.log('   ✅ Webhook procesado correctamente');
            console.log('   📋 Response:', responseData);

            console.log('\n🎉 ¡Mensaje enviado exitosamente!');
            console.log('\n📱 AHORA VERIFICA:');
            console.log('   1. Ve a Netlify > Functions > Logs');
            console.log('   2. Busca logs del webhook de WhatsApp');
            console.log('   3. Ve a tu aplicación > Documents');
            console.log('   4. Ve a tu aplicación > Webhooks Monitoring');
            console.log('   5. Verifica en Supabase > Storage > documents');

            console.log('\n🔍 LOGS ESPERADOS:');
            console.log('   - 📥 Downloading media: real_image_...');
            console.log('   - 📋 Media info: {...}');
            console.log('   - ✅ Media downloaded: test_invoice_real.png');
            console.log('   - ✅ Media uploaded successfully: whatsapp/...');
            console.log('   - 🤖 Procesando con Gemini AI...');

        } else {
            const errorText = await webhookResponse.text();
            console.log('   ❌ Error:', errorText);
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

// Función principal
async function main() {
    await testWhatsAppRealDownload();
    console.log('\n🏁 Prueba completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
