# 🤖 Configuración de Múltiples Chatbots de WhatsApp

## 📋 Resumen

Tu sistema ahora puede manejar **3 chatbots de WhatsApp simultáneamente**, cada uno con su propia configuración independiente.

## 🔢 Chatbots Configurados

1. **Chatbot Principal España**: `+34613881071`
2. **Chatbot Colombia**: `+573014241183`  
3. **Chatbot Secundario España**: `+34661613025`

## 🚀 Pasos de Configuración Completa

### Paso 1: Configurar Variables de Entorno

1. **Copia el archivo de configuración**:
   ```bash
   cp env-example-whatsapp-multiple-chatbots.txt .env.local
   ```

2. **Configura TODAS las variables marcadas como `tu_*_aqui`** con los valores reales de cada aplicación de Facebook Developers.

3. **Variables críticas que debes configurar**:
   - `WHATSAPP_ACCESS_TOKEN` (Chatbot Principal)
   - `WHATSAPP_ACCESS_TOKEN_2` (Chatbot Colombia)
   - `WHATSAPP_ACCESS_TOKEN_3` (Chatbot Secundario España)
   - Y todas las demás variables `_2` y `_3`

### Paso 2: Crear Aplicaciones en Facebook Developers

**IMPORTANTE**: Necesitas crear **3 aplicaciones separadas**, una para cada número de WhatsApp Business.

#### 🔧 Para Cada Chatbot:

1. **Ve a**: https://developers.facebook.com/
2. **Crea una nueva aplicación** para cada chatbot
3. **Tipo de aplicación**: Business
4. **Agrega WhatsApp** como producto

#### 📱 Configuración por Chatbot:

| Chatbot | Aplicación | URL Webhook |
|---------|------------|-------------|
| Principal España (+34613881071) | App 1 | `https://contas-pt.netlify.app/api/webhooks/whatsapp` |
| Colombia (+573014241183) | App 2 | `https://contas-pt.netlify.app/api/webhooks/whatsapp` |
| Secundario España (+34661613025) | App 3 | `https://contas-pt.netlify.app/api/webhooks/whatsapp` |

### Paso 3: Configurar Webhooks

#### Para CADA aplicación, configura:

1. **Callback URL**: `https://contas-pt.netlify.app/api/webhooks/whatsapp`
2. **Verify Token**: 
   - App 1 (Principal): `1c7eba0ef1c438301a9b0f369d6e1708`
   - App 2 (Colombia): `1c7eba0ef1c438301a9b0f369d6e1709`
   - App 3 (Secundario): `1c7eba0ef1c438301a9b0f369d6e1710`
3. **Webhook Fields**: `messages`, `message_deliveries`

### Paso 4: Obtener Credenciales

Para cada aplicación, obtén de Facebook Developers:
- ✅ Access Token
- ✅ Phone Number ID  
- ✅ Business Account ID
- ✅ App ID
- ✅ App Secret

### Paso 5: Actualizar Variables de Entorno

Reemplaza todos los valores `tu_*_aqui` en tu archivo `.env.local` con los valores reales:

```bash
# Ejemplo de configuración real:
WHATSAPP_ACCESS_TOKEN=EAABwzLixnjYBO... (App 1)
WHATSAPP_ACCESS_TOKEN_2=EAAB... (App 2)  
WHATSAPP_ACCESS_TOKEN_3=EAAB... (App 3)
# ... y así para todas las demás variables
```

### Paso 6: Configurar Base de Datos

```bash
# Ejecutar el script SQL
psql -f scripts/setup-whatsapp-multiple-chatbots.sql
```

### Paso 7: Reiniciar Aplicación

```bash
# Reiniciar para cargar nuevas configuraciones
npm run dev
# o si está en producción:
# Reinicia tu servicio
```

## 🧪 Verificación de Configuración

### Ejecutar Script de Verificación

```bash
node scripts/verify-multiple-chatbots.js
```

### Probar Cada Chatbot

1. **Envía un mensaje de texto** a `+34613881071`
2. **Envía un mensaje de texto** a `+573014241183`
3. **Envía un mensaje de texto** a `+34661613025`
4. **Envía una imagen** a cada número para probar el procesamiento de documentos

## 📊 Sistema de Autenticación

### Números Autorizados

Los siguientes números pueden usar cualquiera de los 3 chatbots:

| Con prefijo | Sin prefijo | Chatbot asignado |
|-------------|-------------|------------------|
| +34613881071 | 34613881071 | Principal España |
| +573014241183 | 573014241183 | Colombia |
| +34661613025 | 34661613025 | Secundario España |

### Comportamiento para números no autorizados

- ❌ **Números no autorizados**: Reciben mensaje de error con lista de números autorizados
- ✅ **Números autorizados**: Acceso completo a todas las funcionalidades del chatbot

## 🔄 Funcionamiento del Sistema

### Sistema Inteligente de Enrutamiento

1. **Recepción**: El webhook recibe mensajes de cualquiera de los 3 números
2. **Verificación**: El sistema verifica que el número enviensea esté autorizado
3. **Configuración**: Usa automáticamente la configuración correcta para ese número específico
4. **Procesamiento**: Procesa el mensaje usando el chatbot correspondiente
5. **Respuesta**: Envía la respuesta desde el mismo número que recibió el mensaje

### Logs de Diagnóstico

El sistema registra información detallada:

```
📱 Usando configuración para +34613881071: +34613881071
📤 Enviando mensaje desde +34613881071 a +34613881071
✅ Mensaje enviado exitosamente desde +34613881071
```

## 🛠️ Mantenimiento y Resolución de Problemas

### Comandos Útiles

```bash
# Verificar configuración
node scripts/verify-multiple-chatbots.js

# Probar conectividad
curl -X GET "https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=[TOKEN]&hub.challenge=test"

# Ver logs en tiempo real
tail -f logs/whatsapp-webhook.log
```

### Problemas Comunes

#### ❌ Webhook no verifica
- **Causa**: Verify Token incorrecto
- **Solución**: Verifica que el token en Facebook Developers coincida con el `.env.local`

#### ❌ Mensaje no procesado
- **Causa**: Número no autorizado  
- **Solución**: Agrega el número a la lista de números autorizados

#### ❌ Error 500 en webhook
- **Causa**: Token de acceso inválido o expirado
- **Solución**: Renueva el Access Token en Facebook Developers

### Estructura de Archivos Modificados

```
app/api/webhooks/whatsapp/route.ts          # ✅ Actualizado para múltiples números
scripts/setup-whatsapp-multiple-chatbots.sql # ✅ Nuevo script de configuración
scripts/verify-multiple-chatbots.js         # ✅ Nuevo script de verificación
env-example-whatsapp-multiple-chatbots.txt  # ✅ Plantilla de configuración
```

## 🎯 Características Especiales

### Ventajas del Sistema Multi-Chatbot

1. **Redundancia**: Si un chatbot falla, los otros siguen funcionando
2. **Separación**: Cada número mantiene su propia identidad
3. **Escalabilidad**: Fácil agregar más números en el futuro
4. **Auditoría**: Logs separados por número de origen
5. **Flexibilidad**: Diferentes configuraciones por región/país

### Funcionalidades Comunes

Todos los chatbots comparten las mismas funcionalidades:
- 📄 Procesamiento de documentos con IA
- 💬 Respuestas automáticas
- 📊 Consultas de base de datos
- 📤 Envío de documentos a Dropbox
- 🧠 Aprendizaje continuo
- 💾 Almacenamiento en Supabase

## ✅ Checklist de Implementación

- [ ] Variables de entorno configuradas para los 3 chatbots
- [ ] 3 aplicaciones creadas en Facebook Developers
- [ ] 3 webhooks configurados correctamente
- [ ] Base de datos configurada con el script SQL
- [ ] Aplicación reiniciada
- [ ] Script de verificación ejecutado sin errores
- [ ] Mensajes de prueba enviados y recibidos correctamente
- [ ] Documentos procesados en cada chatbot
- [ ] Logs verificados para confirmar funcionamiento

¡Tu sistema de múltiples chatbots está listo! 🎉
