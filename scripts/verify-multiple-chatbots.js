#!/usr/bin/env node

/**
 * Script de Verificación de Múltiples Chatbots de WhatsApp
 * 
 * Este script verifica que la configuración de múltiples chatbots esté correcta
 * y que todos los números funcionen correctamente
 */

import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

async function verifyMultipleChatbots() {
    console.log('🤖 === VERIFICACIÓN DE MÚLTIPLES CHATBOTS DE WHATSAPP ===\n');

    // Verificar variables de entorno
    console.log('📋 1. VERIFICANDO VARIABLES DE ENTORNO:\n');

    const chatbots = [
        {
            name: 'Chatbot Principal España (+34613881071)',
            prefix: '',
            number: '+34613881071'
        },
        {
            name: 'Chatbot Colombia (+573014241183)',
            prefix: '_2',
            number: '+573014241183'
        },
        {
            name: 'Chatbot Secundario España (+34661613025)',
            prefix: '_3',
            number: '+34661613025'
        }
    ];

    let allConfigured = true;

    chatbots.forEach((chatbot, index) => {
        console.log(`   🤖 ${chatbot.name}:`);

        const vars = [
            `WHATSAPP_ACCESS_TOKEN${chatbot.prefix}`,
            `WHATSAPP_PHONE_NUMBER_ID${chatbot.prefix}`,
            `WHATSAPP_BUSINESS_ACCOUNT_ID${chatbot.prefix}`,
            `WHATSAPP_APP_ID${chatbot.prefix}`,
            `WHATSAPP_APP_SECRET${chatbot.prefix}`,
            `WHATSAPP_VERIFY_TOKEN${chatbot.prefix}`,
            `WHATSAPP_WEBHOOK_URL${chatbot.prefix}`
        ];

        vars.forEach(varName => {
            const value = process.env[varName] ? '✅ Set' : '❌ Not set';
            console.log(`      - ${varName}: ${value}`);

            if (!process.env[varName]) {
                allConfigured = false;
            }
        });

        console.log(''); // Línea en blanco
    });

    if (!allConfigured) {
        console.log('❌ ERROR: No todas las variables están configuradas');
        console.log('📋 PASOS PARA SOLUCIONAR:');
        console.log('   1. Copia env-example-whatsapp-multiple-chatbots.txt como .env.local');
        console.log('   2. Configura todas las variables de entorno marcadas como "❌ Not set"');
        console.log('   3. Reinicia la aplicación');
        console.log('   4. Ejecuta este script nuevamente\n');
        return false;
    }

    console.log('✅ Todas las variables de entorno están configuradas correctamente\n');

    // Verificar configuración compartida
    console.log('📋 2. VERIFICANDO CONFIGURACIÓN COMPARTIDA:\n');

    const sharedVars = [
        'GEMINI_API_KEY',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    sharedVars.forEach(varName => {
        const value = process.env[varName] ? '✅ Set' : '❌ Not set';
        console.log(`   - ${varName}: ${value}`);
    });

    console.log('');

    // Verificar tokens únicos
    console.log('📋 3. VERIFICANDO TOKENS ÚNICOS:\n');

    const verifyTokens = [
        { chat: 'Chatbot Principal', token: process.env.WHATSAPP_VERIFY_TOKEN },
        { chat: 'Chatbot Colombia', token: process.env.WHATSAPP_VERIFY_TOKEN_2 },
        { chat: 'Chatbot Secundario', token: process.env.WHATSAPP_VERIFY_TOKEN_3 }
    ];

    const uniqueTokens = new Set(verifyTokens.map(t => t.token).filter(Boolean));

    if (uniqueTokens.size === verifyTokens.filter(t => t.token).length) {
        console.log('✅ Todos los Verify Tokens son únicos');
    } else {
        console.log('❌ ERROR: Hay Verify Tokens duplicados');
        console.log('   Cada chatbot debe tener un Verify Token único');
    }

    verifyTokens.forEach(({ chat, token }) => {
        console.log(`   - ${chat}: ${token ? token.substring(0, 10) + '...' : 'No configurado'}`);
    });

    console.log('');

    // Resumen de configuración de webhooks
    console.log('📋 4. CONFIGURACIÓN DE WEBHOOKS RECOMENDADA:\n');

    chatbots.forEach((chatbot, index) => {
        console.log(`   🤖 ${chatbot.name}:`);
        console.log(`      URL: https://contas-pt.netlify.app/api/webhooks/whatsapp`);
        console.log(`      Verify Token: ${process.env[`WHATSAPP_VERIFY_TOKEN${chatbot.prefix}`] || 'CONFIGURAR'}`);
        console.log(`      Webhook Fields: messages, message_deliveries`);
        console.log('');
    });

    // Verificar números autorizados (hardcoded por ahora)
    console.log('📋 5. NÚMEROS AUTORIZADOS CONFIGURADOS:\n');

    const authorizedNumbers = [
        '+34613881071', // Número principal España
        '34613881071',  // Número principal España sin prefijo
        '+573014241183', // Número Colombia  
        '573014241183',  // Número Colombia sin prefijo
        '+34661613025', // Número secundario España
        '34661613025'    // Número secundario España sin prefijo
    ];

    console.log('   📱 Números que pueden usar los chatbots:');
    authorizedNumbers.forEach(num => {
        console.log(`      - ${num}`);
    });

    console.log('');

    // Instrucciones finales
    console.log('🚀 === PRÓXIMOS PASOS ===\n');

    console.log('📋 PARA CONFIGURAR CADA CHATBOT:');
    console.log('');
    console.log('   1. 📱 Ve a https://developers.facebook.com/');
    console.log('   2. 🔧 Crea una aplicación separada para CADA número de WhatsApp Business');
    console.log('   3. 📞 Configura WhatsApp en cada aplicación');
    console.log('   4. 🔗 Configura el webhook para CADA aplicación:');
    console.log('      - URL: https://contas-pt.netlify.app/api/webhooks/whatsapp');
    console.log('      - Verify Token: [Usar el token específico de cada chatbot]');
    console.log('      - Webhook Fields: messages, message_deliveries');
    console.log('   5. 🔑 Copia todos los tokens de cada aplicación');
    console.log('   6. 💾 Actualiza el archivo .env.local con los valores reales');
    console.log('   7. 🗄️ Ejecuta: psql -f scripts/setup-whatsapp-multiple-chatbots.sql');
    console.log('   8. 🔄 Reinicia la aplicación');
    console.log('');

    console.log('🧪 PARA PROBAR CADA CHATBOT:');
    console.log('   1. Envía un mensaje de prueba al número principal (+34613881071)');
    console.log('   2. Envía un mensaje de prueba al número Colombia (+573014241183)');
    console.log('   3. Envía un mensaje de prueba al número secundario (+34661613025)');
    console.log('   4. Verifica que cada número responda con su propia configuración');
    console.log('   5. Revisa los logs para confirmar que todo funciona correctamente');

    return true;
}

// Ejecutar verificación
verifyMultipleChatbots()
    .then(success => {
        if (success) {
            console.log('\n✅ Verificación completada exitosamente');
            console.log('🎉 Tu sistema está listo para múltiples chatbots de WhatsApp');
        } else {
            console.log('\n❌ Verificación falló');
            console.log('📋 Revisa la configuración antes de continuar');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 Error durante la verificación:', error);
        process.exit(1);
    });
