// Script para probar el webhook de producción directamente
// Ejecuta: node scripts/test-production-webhook.js

async function testProductionWebhook() {
    console.log('🧪 PROBANDO WEBHOOK DE PRODUCCIÓN DIRECTAMENTE\n');

    try {
        // 1. Probar verificación con token correcto
        console.log('1️⃣ Probando verificación con token correcto...');

        const verifyUrl = 'https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test123456&hub.challenge=test123';
        console.log(`   🔗 URL: ${verifyUrl}`);

        const verifyResponse = await fetch(verifyUrl);
        const verifyText = await verifyResponse.text();

        console.log(`   📊 Status: ${verifyResponse.status}`);
        console.log(`   📋 Response: ${verifyText}`);

        if (verifyResponse.ok && verifyText === 'test123') {
            console.log('   ✅ Verificación: EXITOSA');
            console.log('\n🎉 ¡El webhook está funcionando en producción!');
            console.log('\n📱 AHORA CONFIGURA EN FACEBOOK DEVELOPERS:');
            console.log('   1. Ve a: https://developers.facebook.com/apps');
            console.log('   2. Selecciona tu app de WhatsApp Business');
            console.log('   3. Ve a: WhatsApp > Configuration');
            console.log('   4. En "Webhook" configura:');
            console.log('      URL: https://contas-pt.netlify.app/api/webhooks/whatsapp');
            console.log('      Verify Token: test123456');
            console.log('   5. Haz clic en "Verify and Save"');

        } else {
            console.log('   ❌ Verificación: FALLIDA');

            if (verifyResponse.status === 403) {
                console.log('\n🔍 DIAGNÓSTICO: Status 403 - Forbidden');
                console.log('   ❌ El webhook no está configurado correctamente');
                console.log('   📋 Verifica en Netlify que las variables estén activas');
                console.log('   🔄 Haz un nuevo deploy en Netlify');

            } else if (verifyResponse.status === 404) {
                console.log('\n🔍 DIAGNÓSTICO: Status 404 - Not Found');
                console.log('   ❌ La URL del webhook no existe');
                console.log('   📋 Verifica que la ruta sea correcta');

            } else if (verifyResponse.status === 500) {
                console.log('\n🔍 DIAGNÓSTICO: Status 500 - Internal Error');
                console.log('   ❌ Error interno del servidor');
                console.log('   📋 Revisa los logs de Netlify');
            }
        }

        // 2. Probar POST al webhook
        console.log('\n2️⃣ Probando POST al webhook...');

        const mockPayload = {
            object: "whatsapp_business_account",
            entry: [{
                id: "123456789",
                changes: [{
                    value: {
                        messaging_product: "whatsapp",
                        metadata: {
                            phone_number_id: "664728370058197"
                        },
                        messages: [{
                            id: "test_message",
                            from: "351123456789",
                            timestamp: new Date().toISOString(),
                            type: "text",
                            text: { body: "Test message" }
                        }]
                    },
                    field: "messages"
                }]
            }]
        };

        const postResponse = await fetch('https://contas-pt.netlify.app/api/webhooks/whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockPayload)
        });

        console.log(`   📊 POST Status: ${postResponse.status}`);

        if (postResponse.ok) {
            const postData = await postResponse.json();
            console.log(`   ✅ POST Response:`, postData);
        } else {
            const postError = await postResponse.text();
            console.log(`   ❌ POST Error: ${postError}`);
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
}

// Función principal
async function main() {
    await testProductionWebhook();
    console.log('\n🏁 Prueba completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
