# 🔧 **SOLUCIÓN COMPLETA DE PROBLEMAS DE WHATSAPP**

## 🚨 **PROBLEMAS IDENTIFICADOS**

1. **Supabase Storage no tiene bucket `documents`**
2. **WhatsApp no se conecta con la app**
3. **El análisis de imágenes no funciona**

## 🚀 **SOLUCIÓN PASO A PASO**

### **PASO 1: Configurar Supabase Storage**

#### **Opción A: Usando el script automático (RECOMENDADO)**

1. **Ejecuta el script de configuración:**
   ```bash
   node scripts/setup-supabase-storage.js
   ```

2. **Verifica que el bucket se creó:**
   - Ve a tu dashboard de Supabase
   - Storage > Buckets
   - Deberías ver el bucket `documents`

#### **Opción B: Configuración manual**

1. **Ve a tu dashboard de Supabase**
2. **Storage > Buckets**
3. **Create new bucket**
4. **Nombre:** `documents`
5. **Public:** `false`
6. **File size limit:** `50MB`
7. **Allowed MIME types:** Selecciona todos los tipos de imagen y documento

### **PASO 2: Verificar Variables de Entorno**

Asegúrate de que tu archivo `.env` tenga **TODAS** estas variables:

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# WhatsApp
WHATSAPP_ACCESS_TOKEN=tu_access_token_aqui
WHATSAPP_PHONE_NUMBER_ID=664728370058197
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id_aqui
WHATSAPP_APP_ID=tu_app_id_aqui
WHATSAPP_APP_SECRET=tu_app_secret_aqui
WHATSAPP_VERIFY_TOKEN=1c7eba0ef1c438301a9b0f369d6e1708
WHATSAPP_WEBHOOK_URL=https://contas-pt.netlify.app/api/webhooks/whatsapp

# Gemini AI
GEMINI_API_KEY=tu_api_key_de_gemini_aqui
```

### **PASO 3: Configurar Gemini AI**

1. **Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)**
2. **Inicia sesión con tu cuenta de Google**
3. **Haz clic en "Get API key"**
4. **Copia la API key generada**
5. **Agrega la variable en tu `.env`:**
   ```env
   GEMINI_API_KEY=AIzaSyC...
   ```

### **PASO 4: Verificar Webhook en Facebook Developers**

1. **Ve a [Facebook Developers](https://developers.facebook.com/)**
2. **Selecciona tu aplicación**
3. **WhatsApp > Getting Started**
4. **En "Webhook" configura:**
   - **URL:** `https://contas-pt.netlify.app/api/webhooks/whatsapp`
   - **Verify Token:** `1c7eba0ef1c438301a9b0f369d6e1708`
5. **Haz clic en "Verify and Save"**

### **PASO 5: Probar el Sistema**

#### **Prueba 1: Verificar Webhook**
1. **Abre tu navegador**
2. **Ve a:** `https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=1c7eba0ef1c438301a9b0f369d6e1708&hub.challenge=test123`
3. **Deberías ver:** `test123`

#### **Prueba 2: Usar Script de Prueba**
1. **Ejecuta el script de prueba:**
   ```bash
   node scripts/test-whatsapp-webhook.js
   ```
2. **Verifica que no hay errores**

#### **Prueba 3: Enviar Imagen por WhatsApp**
1. **Abre WhatsApp en tu teléfono**
2. **Envía una imagen de factura** a tu número de WhatsApp Business
3. **Verifica en tu terminal** que aparezcan logs
4. **Verifica en la app** que el documento aparezca en Documents

### **PASO 6: Monitorear y Debuggear**

#### **Verificar Logs en Terminal**
Cuando envíes una imagen, deberías ver en tu terminal:

```
📥 WhatsApp webhook received
📱 Processing WhatsApp message: [ID] from [número]
📎 Media message detected: [tipo]
🔍 Environment variables:
  - WHATSAPP_ACCESS_TOKEN: ✅ Set
  - WHATSAPP_VERIFY_TOKEN: ✅ Set
  ...
🤖 Procesando con Gemini AI...
📊 Resultado del análisis: [datos]
✅ Document processing completed
```

#### **Verificar en la App**
1. **Ve a Documents** - Debería aparecer el documento
2. **Ve a Webhooks Monitoring** - Debería mostrar el procesamiento
3. **Verifica el estado** - Debería ser "Completed"

## 🔍 **SOLUCIÓN DE PROBLEMAS COMUNES**

### **Problema: "Verification failed"**
**Solución:**
- Verifica que `WHATSAPP_VERIFY_TOKEN` en `.env` sea exactamente `1c7eba0ef1c438301a9b0f369d6e1708`
- Verifica que el token en Facebook Developers sea el mismo

### **Problema: No se crea el bucket en Supabase**
**Solución:**
- Ejecuta `node scripts/setup-supabase-storage.js`
- Verifica que tienes `SUPABASE_SERVICE_ROLE_KEY` configurada
- Verifica que tienes permisos de administrador en Supabase

### **Problema: Error de Gemini AI**
**Solución:**
- Verifica que `GEMINI_API_KEY` esté configurada
- Verifica que la API key sea válida
- Verifica que tengas créditos en Google AI Studio

### **Problema: WhatsApp no envía mensajes al webhook**
**Solución:**
- Verifica que el webhook esté verificado en Facebook Developers
- Verifica que la URL del webhook sea accesible
- Verifica que tu aplicación esté funcionando

## 📋 **CHECKLIST DE VERIFICACIÓN**

- [ ] Bucket `documents` creado en Supabase Storage
- [ ] Variables de entorno configuradas en `.env`
- [ ] Gemini AI API key configurada
- [ ] Webhook verificado en Facebook Developers
- [ ] Webhook responde correctamente (muestra `test123`)
- [ ] Script de prueba ejecutado sin errores
- [ ] Imagen enviada por WhatsApp se procesa correctamente
- [ ] Documento aparece en la vista de Documents
- [ ] Análisis de IA funciona y extrae datos

## 🆘 **SI NADA FUNCIONA**

1. **Ejecuta todos los scripts de prueba:**
   ```bash
   node scripts/setup-supabase-storage.js
   node scripts/test-whatsapp-webhook.js
   ```

2. **Verifica los logs en tu terminal** para identificar errores específicos

3. **Verifica que tu aplicación esté corriendo** (`npm run dev`)

4. **Verifica que todas las variables de entorno estén configuradas**

5. **Contacta con soporte** si el problema persiste

## 🎯 **RESULTADO ESPERADO**

Después de seguir todos los pasos:

✅ **WhatsApp envía imágenes** → **Webhook las recibe** → **Gemini AI las analiza** → **Se guardan en Supabase** → **Aparecen en la app**

¡Tu sistema de WhatsApp + IA debería funcionar perfectamente! 🎉
