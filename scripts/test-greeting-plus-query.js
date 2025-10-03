console.log('🎯 === PROBANDO CASOS SALUDO + CONSULTA ===\n');

// Simulamos la función analyzeUserIntent mejorada
function analyzeUserIntent(queryText) {
    const query = queryText.toLowerCase().trim()

    // PRIMERO detectar consultas específicas que necesitan respuestas inmediatas

    // Consultas de fecha específicas - estas necesitan respuesta inmediata
    const dateQueries = ['que dia es hoy', 'qué día es hoy', 'que fecha es hoy', 'qué fecha es hoy', 'fecha actual', 'hoy qué día es']
    if (dateQueries.some(dateQuery => query.includes(dateQuery))) {
        return 'date_query'
    }

    // Consultas sobre el chatbot específicas
    const aboutQueries = ['como estas', 'cómo estás', 'como te llamas', 'cómo te llamas']
    if (aboutQueries.some(aboutQuery => query.includes(aboutQuery))) {
        return 'about_query'
    }

    // DESPUÉS detectar saludos - solo saludos puros sin otras palabras
    const greetings = ['hola', 'hello', 'hi', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'hey']
    //if (greetings.some(greeting => query === greeting)) {
    //  return 'greeting'
    //}

    // Consultas de ayuda específicas
    const helpQueries = ['ayuda', 'help', 'info', 'información']
    if (helpQueries.some(helpQuery => query === helpQuery)) {
        return 'help_query'
    }

    // Detectar consultas financieras específicas
    const financialKeywords = [
        'factura', 'facturas', 'gasto', 'gastos', 'invoice', 'invoices',
        'cuántos', 'cuántas', 'cuanto', 'cuanta', 'totales', 'total',
        'ingreso', 'ingresos', 'revenue', 'beneficio', 'beneficios',
        'cliente', 'clientes', 'resumen', 'summary', 'estadística',
        'últimos', 'ultimos', 'recientes', 'show', 'mostrar',
        'dinero', 'euros', '€', '$', 'pesos'
    ]

    // Debe tener múltiples palabras para ser una consulta real
    const words = query.split(' ').filter(word => word.length > 2)
    const financialWords = words.filter(word => financialKeywords.some(keyword =>
        word.includes(keyword) || keyword.includes(word)
    ))

    // Si tiene saludo combinado con otras palabras, encontrar la intención principal
    if (greetings.some(greeting => query.includes(greeting))) {
        // Eliminar el saludo para evaluar el resto de la consulta
        let queryWithoutGreeting = query
        greetings.forEach(greeting => {
            queryWithoutGreeting = queryWithoutGreeting.replace(greeting, '').trim()
        })

        // Re-evaluar la consulta sin el saludo para casos específicos
        if (dateQueries.some(dateQuery => queryWithoutGreeting.includes(dateQuery))) {
            return 'date_query'
        }

        if (aboutQueries.some(aboutQuery => queryWithoutGreeting.includes(aboutQuery))) {
            return 'about_query'
        }

        if (helpQueries.some(helpQuery => queryWithoutGreeting.includes(helpQuery))) {
            return 'help_query'
        }

        // Solo después evaluar si es consulta financiera
        if (financialWords.length > 0 && words.length >= 2) {
            return 'financial_query'
        }

        // Si no hay más contenido, es solo saludo
        return 'greeting'
    }

    // Si tiene palabras financieras y es una pregunta real
    if (financialWords.length >= 1 && (query.includes('¿') || query.includes('?') || words.length >= 2)) {
        return 'financial_query'
    }

    // Si tiene palabras financieras pero es muy corto/simple, podría ser saludo
    if (financialWords.length === 1 && words.length <= 3 && !query.includes('¿') && !query.includes('?')) {
        const possibleGreetings = ['gastos', 'facturas', 'dinero']
        if (possibleGreetings.some(g => query.includes(g)) && words.length <= 2) {
            return 'ambiguous'
        }
    }

    // Default a consulta financiera si hay palabras financieras
    return financialWords.length > 0 ? 'financial_query' : 'general'
}

// Casos de prueba problemáticos
const problematicCases = [
    // CASOS QUE DEBERÍAN SER FECHA PERO FALLAN
    { input: 'hola, que dia es hoy', expected: 'date_query', testName: '🗓️ Saludo + fecha (PROBLEMÁTICO)' },
    { input: 'buenos días, que dia es hoy', expected: 'date_query', testName: '🗓️ Saludo formal + fecha' },
    { input: 'hola, qué día es hoy?', expected: 'date_query', testName: '🗓️ Saludo + fecha con tilde' },

    // CASOS QUE DEBERÍAN SER ABOUT QUERY
    { input: 'hola, como estas', expected: 'about_query', testName: '🤖 Saludo + estado' },
    { input: 'buenos días, cómo estás', expected: 'about_query', testName: '🤖 Saludo formal + estado' },
    { input: 'hola, como te llamas', expected: 'about_query', testName: '🤖 Saludo + nombre' },

    // CASOS QUE DEBERÍAN SER AYUDA
    { input: 'hola, ayuda', expected: 'help_query', testName: '📋 Saludo + ayuda' },
    { input: 'buenos días, información', expected: 'help_query', testName: '📋 Saludo + info' },

    // CASOS QUE DEBERÍAN SER CONSULTAS FINANCIERAS
    { input: 'hola, cuantos gastos tengo', expected: 'financial_query', testName: '💰 Saludo + consulta financiera' },
    { input: 'buenos días, muestra mis facturas', expected: 'financial_query', testName: '💰 Saludo + facturas' },

    // CASOS QUE DEBERÍAN SER SOLO SALUDOS
    { input: 'hola', expected: 'greeting', testName: '👋 Solo saludo' },
    { input: 'buenos días', expected: 'greeting', testName: '👋 Solo saludo formal' },

    // CASOS DE FECHA SIN SALUDO (deberían seguir funcionando)
    { input: 'que dia es hoy', expected: 'date_query', testName: '🗓️ Solo fecha' },
    { input: 'qué día es hoy?', expected: 'date_query', testName: '🗓️ Solo fecha con tilde' }
];

console.log('🧪 **CASOS PROBLEMÁTICOS:**\n');

let passedTests = 0;
let totalTests = problematicCases.length;

problematicCases.forEach(testCase => {
    const result = analyzeUserIntent(testCase.input);
    const passed = result === testCase.expected;

    console.log(`${testCase.testName}:`);
    console.log(`   Entrada: "${testCase.input}"`);
    console.log(`   Esperado: ${testCase.expected}`);
    console.log(`   Obtenido: ${result}`);
    console.log(`   Estado: ${passed ? '✅ CORRECTO' : '❌ FALLÓ'}`);

    if (!passed) {
        console.log(`   💔 PROBLEMA: Debería ser ${testCase.expected} pero es ${result}`);
    }
    console.log('');

    if (passed) passedTests++;
});

console.log(`📊 **RESULTADO FINAL:**`);
console.log(`   ✅ Correctos: ${passedTests}/${totalTests}`);
console.log(`   ❌ Fallos: ${totalTests - passedTests}/${totalTests}`);
console.log(`   📈 Precisión: ${(passedTests / totalTests * 100).toFixed(1)}%`);

console.log('\n🎯 **CASO ESPECÍFICO PROBLEMÁTICO:**\n');

// Test específico del caso reportado por el usuario
const problematicCase = 'hola, que dia es hoy';
const result = analyzeUserIntent(problematicCase);
console.log(`🔍 Entrada: "${problematicCase}"`);
console.log(`🤖 Detectado como: ${result}`);
console.log(`📅 Debería ser: date_query`);
console.log(`✅ Corrección: ${result === 'date_query' ? 'FUNCIONA' : 'FALLA'}`);
console.log('');

if (result === 'date_query') {
    console.log('🎉 **¡CORRECCIÓN EXITOSA!**');
    console.log('');
    console.log('✅ Ahora "hola, que dia es hoy" será detectado como date_query');
    console.log('✅ No aparecerá mensaje de "Procesando consulta"');
    console.log('✅ Responderá inmediatamente con la fecha');
} else {
    console.log('❌ **CORRECCIÓN FALLA**');
    console.log('');
    console.log('😞 El caso aún no funciona correctamente');
    console.log('🔧 Necesitamos ajustar más la lógica de detección');
}

console.log('\n🚀 **COMPORTAMIENTO ESPERADO CORREGIDO:**\n');
console.log('👤 Usuario: "hola, que dia es hoy"');
console.log('🎯 Sistema: Detecta como "date_query"');
console.log('⚡ Acción: Respuesta inmediata (sin "Procesando consulta")');
console.log('🤖 Respuesta: "📅 Hoy es [fecha completa]"');
console.log('✅ Resultado: Sin mensaje de procesamiento innecesario');

console.log('\n🎯 **PRUEBA DE OTROS CASOS:**\n');
console.log('👤 Usuario: "hola, cuantos gastos tengo"');
console.log('🎯 Sistema: Detecta como "financial_query"');
console.log('⚡ Acción: Procesa con IA');
console.log('🤖 Respuesta: Datos financieros específicos');

console.log('\n👤 Usuario: "hola, como estas"');
console.log('🎯 Sistema: Detecta como "about_query"');
console.log('⚡ Acción: Respuesta inmediata');
console.log('🤖 Respuesta: Información sobre el chatbot');

console.log('\n🎉 **¡Corrección implementada!**');
console.log('');
console.log('Reinicia tu aplicación y prueba "hola, que dia es hoy"');
