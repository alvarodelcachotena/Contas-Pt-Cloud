import fs from 'fs';

console.log('🔍 === VERIFICANDO CAMBIOS EN EL ARCHIVO ===\n');

const filePath = 'app/api/webhooks/whatsapp/route.ts';

try {
    const content = fs.readFileSync(filePath, 'utf8');

    console.log('✅ Archivo encontrado y leído correctamente');
    console.log('');

    // Verificar que contenga nuestras modificaciones
    const checks = [
        {
            name: 'Debug logs en handleTextQuery',
            pattern: /console\.log\(`🔍 \[DEBUG\] Analizando consulta:/,
            found: content.includes('console.log(`🔍 [DEBUG] Analizando consulta:')
        },
        {
            name: 'Debug logs en analyzeUserIntent',
            pattern: /console\.log\(`🔬 \[DEBUG\] analyzeUserIntent llamada con:/,
            found: content.includes('console.log(`🔬 [DEBUG] analyzeUserIntent llamada con:')
        },
        {
            name: 'Lógica de eliminación de saludos',
            pattern: /queryWithoutGreeting = queryWithoutGreeting\.replace/,
            found: content.includes('queryWithoutGreeting = queryWithoutGreeting.replace')
        },
        {
            name: 'Verificación de dateQuery en saludo',
            pattern: /if \(dateQueries\.some\(dateQuery => queryWithoutGreeting\.includes/,
            found: content.includes('dateQueries.some(dateQuery => queryWithoutGreeting.includes')
        },
        {
            name: 'dateQueries array con casos correctos',
            pattern: /'que dia es hoy', 'qué día es hoy'/,
            found: content.includes("'que dia es hoy', 'qué día es hoy'")
        }
    ];

    console.log('🔎 **VERIFICACIONES:**\n');

    checks.forEach(check => {
        console.log(`${check.name}: ${check.found ? '✅ CÓRREGO' : '❌ FALTA'}`);
    });

    const allPresent = checks.every(check => check.found);

    console.log('');
    console.log(`🎯 **RESULTADO:** ${allPresent ? '✅ TODOS LOS CAMBIOS ESTÁN PRESENTES' : '❌ FALTAN CAMBIOS'}`);

    if (allPresent) {
        console.log('');
        console.log('🎉 **El archivo está correctamente modificado:**');
        console.log('');
        console.log('✅ Debug logs agregados');
        console.log('✅ Lógica de análisis mejorada');
        console.log('✅ Detección de fecha priorizada');
        console.log('✅ Eliminación inteligente de saludos');
        console.log('');
        console.log('🚀 **PRÓXIMOS PASOS:**');
        console.log('');
        console.log('1️⃣ Reinicia tu aplicación:');
        console.log('   Ctrl + C');
        console.log('   npm run dev');
        console.log('');
        console.log('2️⃣ Envía "que dia es hoy" al chatbot');
        console.log('');
        console.log('3️⃣ Revisa los logs en la consola donde corre npm run dev');
        console.log('   Deberías ver:');
        console.log('   🔬 [DEBUG] analyzeUserIntent llamada con: "que dia es hoy"');
        console.log('   📅 [DEBUG] MATCH encontrado con: "que dia es hoy"');
        console.log('   📅 [DEBUG] Retornando "date_query"');
        console.log('');
        console.log('4️⃣ Si ves esos logs pero aún falla, hay otro problema');
        console.log('5️⃣ Si no ves esos logs, la aplicación no se reinició');
        console.log('');
    } else {
        console.log('');
        console.log('❌ **PROBLEMA DETECTADO:**');
        console.log('');
        console.log('Algunos cambios no están presentes en el archivo.');
        console.log('Esto puede significar que:');
        console.log('• El archivo no se guardó correctamente');
        console.log('• Hay un problema de sincronización');
        console.log('• El archivo fue sobrescrito');
        console.log('');
        console.log('🔧 **SOLUCIÓN:**');
        console.log('Reintentar los cambios en el archivo');
    }

    console.log('');
    console.log('📊 **STATS DEL ARCHIVO:**');
    console.log(`   📄 Líneas totales: ${content.split('\n').length}`);
    console.log(`   📦 Tamaño: ${Math.round(content.length / 1024)}KB`);

} catch (error) {
    console.log(`❌ Error al leer el archivo: ${error.message}`);
}
