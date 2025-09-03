// Script para verificar variables de entorno en producción
// Ejecuta: node scripts/check-env-production.js

async function checkEnvironmentProduction() {
    console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO EN PRODUCCIÓN\n');

    try {
        // 1. Probar diferentes tokens para ver cuál funciona
        console.log('1️⃣ Probando diferentes tokens de verificación...');

        const tokens = [
            'test123456',
            '1c7eba0ef1c438301a9b0f369d6e1708',
            'test123',
            'whatsapp123'
        ];

        for (const token of tokens) {
            console.log(`\n   🔑 Probando token: ${token}`);

            const verifyUrl = `https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=test123`;

            try {
                const response = await fetch(verifyUrl);
                const text = await response.text();

                console.log(`      Status: ${response.status}`);
                console.log(`      Response: ${text}`);

                if (response.ok && text === 'test123') {
                    console.log(`      ✅ ¡TOKEN FUNCIONA: ${token}!`);
                    console.log(`\n🎉 ¡Encontramos el token correcto!`);
                    console.log(`\n📱 AHORA CONFIGURA EN FACEBOOK DEVELOPERS:`);
                    console.log(`   Verify Token: ${token}`);
                    console.log(`   URL: https://contas-pt.netlify.app/api/webhooks/whatsapp`);
                    return;
                }
            } catch (error) {
                console.log(`      ❌ Error: ${error.message}`);
            }
        }

        console.log('\n❌ Ningún token funcionó');

        // 2. Verificar si el webhook está respondiendo
        console.log('\n2️⃣ Verificando si el webhook responde...');

        try {
            const basicResponse = await fetch('https://contas-pt.netlify.app/api/webhooks/whatsapp');
            console.log(`   Status: ${basicResponse.status}`);
            console.log(`   Response: ${await basicResponse.text()}`);
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        // 3. Instrucciones para solucionar
        console.log('\n3️⃣ SOLUCIÓN RECOMENDADA:');
        console.log('   📋 Ve a Netlify > Site settings > Environment variables');
        console.log('   🔑 Verifica que WHATSAPP_VERIFY_TOKEN = test123456');
        console.log('   🔄 Haz un nuevo deploy forzado');
        console.log('   📱 Luego configura en Facebook Developers');

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
}

// Función principal
async function main() {
    await checkEnvironmentProduction();
    console.log('\n🏁 Verificación completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
