// Script para cambiar el Verify Token a uno más simple
// Ejecuta: node scripts/change-verify-token.js

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function changeVerifyToken() {
    console.log('🔑 CAMBIANDO VERIFY TOKEN A UNO MÁS SIMPLE\n');

    try {
        // 1. Leer archivo .env actual
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        // 2. Crear nuevo Verify Token simple
        const newVerifyToken = 'test123456';

        // 3. Reemplazar el Verify Token
        const oldVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

        if (envContent.includes(`WHATSAPP_VERIFY_TOKEN=${oldVerifyToken}`)) {
            envContent = envContent.replace(
                `WHATSAPP_VERIFY_TOKEN=${oldVerifyToken}`,
                `WHATSAPP_VERIFY_TOKEN=${newVerifyToken}`
            );

            // 4. Guardar archivo .env
            fs.writeFileSync(envPath, envContent);

            console.log('✅ Verify Token cambiado exitosamente');
            console.log(`   🔑 Anterior: ${oldVerifyToken}`);
            console.log(`   🔑 Nuevo: ${newVerifyToken}`);

            // 5. Verificar que el cambio se aplicó
            console.log('\n🔍 VERIFICANDO CAMBIO...');

            // Recargar variables de entorno
            dotenv.config();

            if (process.env.WHATSAPP_VERIFY_TOKEN === newVerifyToken) {
                console.log('   ✅ Verify Token actualizado correctamente');

                console.log('\n📋 AHORA CONFIGURA EN FACEBOOK DEVELOPERS:');
                console.log('   1. Ve a: https://developers.facebook.com/apps');
                console.log('   2. Selecciona tu app de WhatsApp Business');
                console.log('   3. Ve a: WhatsApp > Configuration');
                console.log('   4. En "Webhook" configura:');
                console.log(`      URL: https://contas-pt.netlify.app/api/webhooks/whatsapp`);
                console.log(`      Verify Token: ${newVerifyToken}`);
                console.log('   5. Haz clic en "Verify and Save"');

                console.log('\n🧪 DESPUÉS DE CONFIGURAR, PRUEBA:');
                console.log('   node scripts/test-whatsapp-complete.js');

            } else {
                console.log('   ❌ Error: Verify Token no se actualizó');
            }

        } else {
            console.log('❌ No se encontró el Verify Token en .env');
            console.log('   Verifica que el archivo .env tenga la línea correcta');
        }

    } catch (error) {
        console.error('❌ Error cambiando Verify Token:', error);
    }
}

// Función principal
async function main() {
    await changeVerifyToken();
    console.log('\n🏁 Proceso completado');
}

// Ejecutar si se llama directamente
main().catch(console.error);
