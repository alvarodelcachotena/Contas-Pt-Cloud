#!/usr/bin/env node

/**
 * Script de Verificación de Configuración WhatsApp Múltiples Números
 * 
 * Este script verifica que todas las configuraciones necesarias estén en su lugar
 * para el funcionamiento del chatbot de WhatsApp con múltiples números.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de WhatsApp para múltiples números...\n');

// Verificar archivos necesarios
const requiredFiles = [
    'app/api/webhooks/whatsapp/route.ts',
    'scripts/setup-whatsapp-authorized-users.sql',
    'env-example-whatsapp-multiple.txt',
    'infoUser.txt'
];

console.log('📁 Verificando archivos necesarios:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - NO ENCONTRADO`);
    }
});

// Verificar variables de entorno necesarias
console.log('\n🔧 Variables de entorno necesarias:');
const requiredEnvVars = [
    // Número Principal
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_APP_ID',
    'WHATSAPP_APP_SECRET',
    'WHATSAPP_VERIFY_TOKEN',
    'WHATSAPP_WEBHOOK_URL',

    // Número Secundario (Colombia)
    'WHATSAPP_ACCESS_TOKEN_2',
    'WHATSAPP_PHONE_NUMBER_ID_2',
    'WHATSAPP_BUSINESS_ACCOUNT_ID_2',
    'WHATSAPP_APP_ID_2',
    'WHATSAPP_APP_SECRET_2',
    'WHATSAPP_VERIFY_TOKEN_2',
    'WHATSAPP_WEBHOOK_URL_2',

    // Número Terciario (España)
    'WHATSAPP_ACCESS_TOKEN_3',
    'WHATSAPP_PHONE_NUMBER_ID_3',
    'WHATSAPP_BUSINESS_ACCOUNT_ID_3',
    'WHATSAPP_APP_ID_3',
    'WHATSAPP_APP_SECRET_3',
    'WHATSAPP_VERIFY_TOKEN_3',
    'WHATSAPP_WEBHOOK_URL_3',

    // Variables generales
    'GEMINI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
        console.log(`  ✅ ${envVar}`);
    } else {
        console.log(`  ❌ ${envVar} - NO CONFIGURADA`);
    }
});

// Verificar configuración del webhook
console.log('\n📱 Configuración del webhook:');
const webhookFile = 'app/api/webhooks/whatsapp/route.ts';
if (fs.existsSync(webhookFile)) {
    const webhookContent = fs.readFileSync(webhookFile, 'utf8');

    const checks = [
        { name: 'Función getWhatsAppCredentials con parámetro phoneNumberId', pattern: /function getWhatsAppCredentials\(phoneNumberId\?/ },
        { name: 'Configuración para múltiples números', pattern: /whatsappConfigs = \{/ },
        { name: 'Verificación de usuarios autorizados', pattern: /whatsapp_authorized_users/ },
        { name: 'Mensaje de error para números no autorizados', pattern: /no está autorizado para usar este servicio/ },
        { name: 'Números autorizados en mensaje de error', pattern: /\+34613881071/ },
        { name: 'Números autorizados en mensaje de error', pattern: /\+573014241183/ },
        { name: 'Números autorizados en mensaje de error', pattern: /\+34661613025/ }
    ];

    checks.forEach(check => {
        if (check.pattern.test(webhookContent)) {
            console.log(`  ✅ ${check.name}`);
        } else {
            console.log(`  ❌ ${check.name} - NO ENCONTRADO`);
        }
    });
} else {
    console.log('  ❌ Archivo del webhook no encontrado');
}

// Verificar script SQL
console.log('\n🗄️ Script SQL de configuración:');
const sqlFile = 'scripts/setup-whatsapp-authorized-users.sql';
if (fs.existsSync(sqlFile)) {
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    const sqlChecks = [
        { name: 'Tabla whatsapp_authorized_users', pattern: /CREATE TABLE.*whatsapp_authorized_users/ },
        { name: 'Número principal (+34613881071)', pattern: /\+34613881071/ },
        { name: 'Número Colombia (+573014241183)', pattern: /\+573014241183/ },
        { name: 'Número secundario España (+34661613025)', pattern: /\+34661613025/ },
        { name: 'Función de verificación', pattern: /is_whatsapp_number_authorized/ },
        { name: 'Función de configuración', pattern: /get_whatsapp_config_by_number/ },
        { name: 'Vista para consultas', pattern: /whatsapp_users_view/ }
    ];

    sqlChecks.forEach(check => {
        if (check.pattern.test(sqlContent)) {
            console.log(`  ✅ ${check.name}`);
        } else {
            console.log(`  ❌ ${check.name} - NO ENCONTRADO`);
        }
    });
} else {
    console.log('  ❌ Script SQL no encontrado');
}

// Verificar documentación
console.log('\n📚 Documentación actualizada:');
const docFile = 'infoUser.txt';
if (fs.existsSync(docFile)) {
    const docContent = fs.readFileSync(docFile, 'utf8');

    const docChecks = [
        { name: 'Sección del chatbot actualizada', pattern: /17\. Chatbot de WhatsApp/ },
        { name: 'Números autorizados documentados', pattern: /Números de WhatsApp Disponibles/ },
        { name: 'Sistema de autorización explicado', pattern: /Sistema de Autorización/ },
        { name: 'Configuración de variables de entorno', pattern: /WHATSAPP_ACCESS_TOKEN_\[1,2,3\]/ }
    ];

    docChecks.forEach(check => {
        if (check.pattern.test(docContent)) {
            console.log(`  ✅ ${check.name}`);
        } else {
            console.log(`  ❌ ${check.name} - NO ENCONTRADO`);
        }
    });
} else {
    console.log('  ❌ Documentación no encontrada');
}

// Instrucciones finales
console.log('\n📋 Próximos pasos:');
console.log('1. 📝 Configura las variables de entorno usando env-example-whatsapp-multiple.txt');
console.log('2. 🗄️ Ejecuta el script SQL: scripts/setup-whatsapp-authorized-users.sql');
console.log('3. 🔧 Configura los webhooks en Facebook Developers para cada número');
console.log('4. 🚀 Reinicia la aplicación');
console.log('5. 📱 Prueba enviando mensajes a cada número autorizado');
console.log('6. ❌ Verifica que números no autorizados reciban el mensaje de error');

console.log('\n📞 Números configurados:');
console.log('  🇪🇸 +34613881071 (Principal España)');
console.log('  🇨🇴 +573014241183 (Colombia)');
console.log('  🇪🇸 +34661613025 (Secundario España)');

console.log('\n✅ Verificación completada!');
