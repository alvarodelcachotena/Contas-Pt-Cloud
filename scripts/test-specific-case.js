console.log('🎯 === PROBANDO CASO ESPECÍFICO REAL ===\n');

// Simulamos exactamente la función analyzeUserIntent tal como está en el código
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

        console.log(`🔍 Query original: "${query}"`);
        console.log(`🔍 Query sin saludo: "${queryWithoutGreeting}"`);

        // Re-evaluar la consulta sin el saludo para casos específicos
        if (dateQueries.some(dateQuery => queryWithoutGreeting.includes(dateQuery))) {
            console.log(`✅ Encontrada fecha en query sin saludo`);
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

// Casos específicos que el usuario reportó
const userReportedCases = [
    'que dia es hoy',
    'qué día es hoy',
    'que dia es hoy?',
    'hola, que dia es hoy',
    'buenos días, que dia es hoy'
];

console.log('🧪 **CASOS REPORTADOS POR EL USUARIO:**\n');

userReportedCases.forEach(query => {
    console.log(`📝 Consulta: "${query}"`);
    const result = analyzeUserIntent(query);
    console.log(`🎯 Resultado: ${result}`);

    if (result === 'date_query') {
        console.log(`✅ CORRECTO: Detectado como consulta de fecha`);
    } else {
        console.log(`❌ PROBLEMA: Debería ser 'date_query' pero es '${result}'`);
    }
    console.log('');
});

console.log('🎯 **CASOS SIMPLES:**\n');

const simpleCases = ['hola', 'como estas', 'ayuda'];
simpleCases.forEach(query => {
    const result = analyzeUserIntent(query);
    console.log(`📝 "${query}" → ${result}`);
});

console.log('\n🏗️ **ESTRUCTURA DE ANÁLISIS:**\n');
console.log('1️⃣ Primero: Detección de consultas de fecha');
console.log('2️⃣ Segundo: Detección de consultas sobre chatbot');
console.log('3️⃣ Tercero: Análisis de saludos combinados');
console.log('4️⃣ Cuarto: Detección de ayuda');
console.log('5️⃣ Quinto: Análisis financiero');

console.log('\n🎪 **CASO ESPECÍFICO PROBLEMÁTICO:**\n');
const problematicCase = 'que dia es hoy';
console.log(`🔍 Analizando: "${problematicCase}"`);

const result = analyzeUserIntent(problematicCase);
console.log(`🎯 Resultado: ${result}`);

if (result === 'date_query') {
    console.log('🎉 ¡FUNCIONA CORRECTAMENTE!');
} else {
    console.log('😞 ¡HAY UN PROBLEMA EN LA LÓGICA!');
    console.log('🔍 Revisemos paso a paso lo que está pasando...');
}

console.log('\n📋 **Si el cliente aún reporta problemas:**\n');
console.log('1️⃣ Verificar que los cambios se guardaron correctamente');
console.log('2️⃣ Verificar que se reinició la aplicación');
console.log('3️⃣ Verificar que no hay cache en el navegador/aplicación');
console.log('4️⃣ Verificar que la función analyzeUserIntent se está llamando');

console.log('\n🚨 **DEBUGGING ADICIONAL:**\n');
console.log('Si el problema persiste, necesitamos:');
console.log('• Agregar console.log en el código real');
console.log('• Verificar que la función se está ejecutando');
console.log('• Revisar si hay código que sobrescribe la detección');
