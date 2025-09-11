#!/usr/bin/env node

console.log(`
🔧 LOGS DE DEBUG AGREGADOS PARA INVESTIGAR EL PROBLEMA
=====================================================

✅ LOGS AGREGADOS EN processExpense():

🔍 Validación de datos críticos:
   - "🔍 VALIDACIÓN DE DATOS:"
   - "   - vendorName: \"{nombre}\""
   - "   - amount: {importe}"
   - "   - vatAmount: {iva}"
   - "   - vatRate: {porcentaje}"
   - "   - description: \"{descripción}\""
   - "   - expenseDate: \"{fecha}\""
   - "   - receiptNumber: \"{número}\""

⚠️ Advertencias:
   - "⚠️ ADVERTENCIA: Nombre de proveedor no encontrado"
   - "⚠️ ADVERTENCIA: Importe inválido: {importe}"

💾 Preparación de inserción:
   - "💾 PREPARANDO INSERCIÓN EN BASE DE DATOS:"
   - "📋 Datos a insertar: {JSON completo}"

🔧 CORRECCIONES DE TYPESCRIPT:

✅ Error handling mejorado:
   - "error instanceof Error ? error.message : 'Unknown error'"
   - "error instanceof Error ? error.stack : 'No stack trace'"

📋 QUÉ BUSCAR EN LOS LOGS:

1. 🔍 Verificar que todos los datos se extraigan correctamente
2. ⚠️ Identificar advertencias sobre datos faltantes
3. 💾 Confirmar que los datos se preparen correctamente para inserción
4. ❌ Buscar errores específicos en la inserción
5. 🎯 Identificar exactamente dónde falla el proceso

🎯 DIFERENCIA CLAVE IDENTIFICADA:

Caso 1 (NO se guarda): "Tipo: Gasto" → processExpense()
Caso 2 (SÍ se guarda): "Tipo: Factura (gasto que pagaste)" → processInvoice()

🔍 POSIBLES CAUSAS:

1. 🤖 Inconsistencia de la AI en detectar tipos
2. 🔧 Error silencioso en processExpense()
3. 📊 Datos faltantes o inválidos
4. 🚫 Problema de permisos o RLS

📋 PRÓXIMOS PASOS:

1. 📱 Enviar otra imagen similar a la primera (tipo "Gasto")
2. 📝 Revisar logs del servidor para ver los nuevos logs de debug
3. 🔍 Buscar errores específicos en processExpense()
4. 🎯 Identificar exactamente dónde falla el primer caso

🚀 ¡Ahora tendremos visibilidad completa del proceso de processExpense()!
`)

process.exit(0)
