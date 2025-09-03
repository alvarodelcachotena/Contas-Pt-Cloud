// Script para verificar variables de entorno en producción
// Ejecuta: node scripts/check-production-env.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkProductionEnvironment() {
    console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO EN PRODUCCIÓN\n');

    try {
        // 1. Verificar variables locales
        console.log('1️⃣ VARIABLES LOCALES (.env):');
        const localVars = {
            'WHATSAPP_VERIFY_TOKEN': process.env.WHATSAPP_VERIFY_TOKEN,
            'WHATSAPP_ACCESS_TOKEN': process.env.WHATSAPP_ACCESS_TOKEN,
            'WHATSAPP_PHONE_NUMBER_ID': process.env.WHATSAPP_PHONE_NUMBER_ID,
            'GEMINI_AI_API_KEY': process.env.GEMINI_AI_API_KEY
        };

        Object.entries(localVars).forEach(([key, value]) => {
            if (value) {
                console.log(`   ✅ ${key}: ${value.substring(0, 20)}...`);
            } else {
                console.log(`   ❌ ${key}: NO configurada`);
            }
        });

        // 2. Verificar webhook de verificación con token local
        console.log('\n2️⃣ VERIFICANDO WEBHOOK CON TOKEN LOCAL:');
        const localToken = process.env.WHATSAPP_VERIFY_TOKEN;

        if (localToken) {
            const verifyUrl = `https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${localToken}&hub.challenge=test123`;
            console.log(`   🔗 URL: ${verifyUrl}`);

            const verifyResponse = await fetch(verifyUrl);
            const verifyText = await verifyResponse.text();

            if (verifyResponse.ok && verifyText === 'test123') {
                console.log('   ✅ Verificación: EXITOSA');
            } else {
                console.log('   ❌ Verificación: FALLIDA');
                console.log(`      Status: ${verifyResponse.status}`);
                console.log(`      Response: ${verifyText}`);
            }
        } else {
            console.log('   ❌ No hay token local para probar');
        }

        // 3. Verificar que el webhook esté configurado en Facebook
        console.log('\n3️⃣ CONFIGURACIÓN EN FACEBOOK DEVELOPERS:');
        console.log('   📋 IMPORTANTE: Verifica en Facebook Developers que:');
        console.log('      ✅ URL: https://contas-pt.netlify.app/api/webhooks/whatsapp');
        console.log(`      ✅ Verify Token: ${localToken || 'NO CONFIGURADO'}`);
        console.log('      ✅ Eventos suscritos: messages, message_deliveries');

        // 4. Instrucciones para configurar en Netlify
        console.log('\n4️⃣ CONFIGURAR EN NETLIFY:');
        console.log('   📋 Ve a: https://app.netlify.com/sites/contas-pt');
        console.log('   ⚙️  Ve a: Site settings > Environment variables');
        console.log('   🔑 Asegúrate de tener:');
        console.log(`      WHATSAPP_VERIFY_TOKEN = ${localToken || 'test123456'}`);
        console.log('      WHATSAPP_ACCESS_TOKEN = (tu token de acceso)');
        console.log('      WHATSAPP_PHONE_NUMBER_ID = (tu ID de número)');
        console.log('      GEMINI_AI_API_KEY = (tu clave de Gemini)');

        // 5. Después de configurar
        console.log('\n5️⃣ DESPUÉS DE CONFIGURAR:');
        console.log('   🔄 Haz un nuevo deploy en Netlify');
        console.log('   🧪 Prueba: node scripts/test-whatsapp-complete.js');
        console.log('   📱 Envía una imagen real por WhatsApp');

    } catch (error) {
        console.error('❌ Error verificando entorno:', error);
    }
}

// Función principal
async function main() {
    await checkProductionEnvironment();
    console.log('\n🏁 Verificación completada');
}

// Ejecutar si se llama directamente
main().catch(console.error);
