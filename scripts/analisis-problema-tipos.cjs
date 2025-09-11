#!/usr/bin/env node

console.log(`
🔍 ANÁLISIS DEL PROBLEMA - DIFERENCIA EN TIPOS DE DOCUMENTO
===========================================================

📊 COMPARACIÓN DE LOS DOS CASOS:

Caso 1 (NO se guarda):
✅ Documento procesado exitosamente!
📄 Tipo: Gasto
🎯 Confianza: 95.0%
📊 Datos extraídos: 12 campos
📋 Datos extraídos:
• Invoice Number: FT 3A2501/573
• Description: Sangria Moët Chandon, Mojito, Água 75cl, Café
• Subtotal: 184.02
• Importe IVA: €29.98
💳 Tipo de pago: Crédito (Tarjeta)
💰 Guardado en Despesas (no se creó cliente)

Caso 2 (SÍ se guarda):
✅ Documento procesado exitosamente!
📄 Tipo: Factura (gasto que pagaste)
🎯 Confianza: 95.0%
📊 Datos extraídos: 11 campos
📋 Datos extraídos:
• Invoice Number: AUTO-1757491187415
• Description: ENSALADA TOMATE, MARISCADA X2, BOTELLA VERDEJO...
• Subtotal: 113.73
• Importe IVA: €11.37
💰 Guardado en Faturas Y Despesas (no se creó cliente)

🎯 DIFERENCIA CLAVE:

Caso 1: "Tipo: Gasto" → document_type = 'expense' → processExpense()
Caso 2: "Tipo: Factura (gasto que pagaste)" → document_type = 'invoice' → processInvoice()

🔍 POSIBLES CAUSAS:

1. 🤖 Inconsistencia de la AI:
   - La AI detecta diferentes tipos para documentos similares
   - Podría ser por diferencias en el formato de la imagen/PDF

2. 🔧 Diferencia en el procesamiento:
   - processExpense() podría tener un error que no se muestra
   - processInvoice() funciona correctamente

3. 📊 Datos faltantes:
   - Los datos extraídos podrían no tener todos los campos requeridos
   - Algún campo obligatorio podría estar faltando

🔧 SOLUCIÓN PROPUESTA:

1. 🔍 Revisar logs del servidor para ver errores específicos
2. 🧪 Probar ambos tipos de documento manualmente
3. 🔧 Agregar más validación en processExpense()
4. 📊 Verificar que todos los campos requeridos estén presentes

📋 PRÓXIMOS PASOS:

1. 📱 Enviar otra imagen similar a la primera
2. 📝 Revisar logs del servidor para ver errores
3. 🔍 Buscar mensajes de error en processExpense()
4. 🎯 Identificar exactamente dónde falla el primer caso
`)

process.exit(0)
