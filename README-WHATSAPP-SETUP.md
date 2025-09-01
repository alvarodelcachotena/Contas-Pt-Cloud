# 🚀 Configuración Completa de WhatsApp Business API

## 📋 **Resumen**

Este sistema permite recibir imágenes y documentos de WhatsApp y procesarlos automáticamente, guardándolos en la base de datos y mostrándolos en la vista de documentos.

## 🔧 **Funcionalidades Implementadas**

✅ **Webhook de WhatsApp** - Recibe mensajes en tiempo real
✅ **Descarga de medios** - Imágenes, documentos, audio, video
✅ **Almacenamiento en Supabase** - Base de datos + Storage
✅ **Integración con documentos** - Aparecen en la vista de documentos
✅ **Procesamiento automático** - Estado de procesamiento
✅ **Logs detallados** - Seguimiento completo de operaciones
✅ **Análisis con Gemini AI** - Identificación automática de facturas y gastos
✅ **Creación automática de registros** - Facturas y gastos se crean automáticamente
✅ **Categorización inteligente** - Clasificación automática por tipo de gasto
✅ **Panel de monitoreo** - Vista en tiempo real del procesamiento

## 📱 **Tipos de Media Soportados**

- **Imágenes**: JPEG, PNG, GIF
- **Documentos**: PDF, DOC, DOCX, XLS, XLSX
- **Audio**: MP3, WAV, OGG
- **Video**: MP4, AVI, MOV

## 🚀 **Configuración Paso a Paso**

### **Paso 1: Crear Aplicación en Facebook Developers**

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación
3. Selecciona **"Business"** como tipo
4. Completa la información básica

### **Paso 2: Agregar WhatsApp a tu Aplicación**

1. En tu aplicación, ve a **"Add Product"**
2. Busca **"WhatsApp"** y agrégalo
3. Sigue la configuración inicial

### **Paso 3: Configurar WhatsApp Business**

1. Ve a **WhatsApp > Getting Started**
2. Configura tu número de teléfono de WhatsApp
3. Verifica tu número con el código SMS

### **Paso 4: Obtener Credenciales**

1. **Access Token**:
   - WhatsApp > Getting Started > Access Token
   - Copia el token permanente

2. **Phone Number ID**:
   - WhatsApp > Getting Started > Phone Number ID
   - Copia el ID del número

3. **Business Account ID**:
   - WhatsApp > Getting Started > Business Account ID
   - Copia el ID de la cuenta

4. **App ID**:
   - Settings > Basic > App ID
   - Copia el ID de la aplicación

5. **App Secret**:
   - Settings > Basic > App Secret
   - Copia el secreto de la aplicación

### **Paso 5: Configurar Variables de Entorno**

Agrega estas variables a tu archivo `.env`:

```env
# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=EAAULDiaialMBPWcSZCjgZAvZAEqEx0UeCRUhCjju8wxtbSw7JuMoZCjLoKwNpzB7R8oPI30YEP7WbJa3PrDZCFtYecRvsf9rPWOKhOxmJMoSDe69cAlVdf14oeZB2bgfuUxMiOMIVymiHjjZAskNUsqY3JMDEY4RHe71zl2H2ZAGWRZBQTUNeijngr83duTqzUs4WDFfdpt0ZBbZCPZBzj1iEQVTZBa6aTifSZCIGA2F6oQMxKOJuRnOMZD
WHATSAPP_PHONE_NUMBER_ID=664728370058197
WHATSAPP_BUSINESS_ACCOUNT_ID=4105106849812542
WHATSAPP_APP_ID=1419530289179219
WHATSAPP_APP_SECRET=1c7eba0ef1c438301a9b0f369d6e1708
WHATSAPP_VERIFY_TOKEN=1c7eba0ef1c438301a9b0f369d6e1708
WHATSAPP_WEBHOOK_URL=https://contas-pt.netlify.app/api/webhooks/whatsapp
```

### **Paso 6: Configurar Webhook**

1. Ve a **WhatsApp > Configuration**
2. Agrega tu URL del webhook: `https://tu-dominio.com/api/webhooks/whatsapp`
3. Agrega el Verify Token que inventaste
4. Selecciona estos campos:
   - ✅ `messages`
   - ✅ `message_deliveries`
   - ✅ `message_reads`

### **Paso 7: Configurar Gemini AI**

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Agrega la variable de entorno:
   ```env
   GEMINI_API_KEY=tu_api_key_aqui
   ```

### **Paso 8: Configurar Supabase Storage**

1. Ve a tu proyecto de Supabase
2. Ve a **Storage > Buckets**
3. Crea un bucket llamado `documents`
4. Configura las políticas de acceso:

```sql
-- Permitir inserción para usuarios autenticados
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir lectura para usuarios autenticados
CREATE POLICY "Users can view documents" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');
```

## 🧪 **Pruebas**

### **Prueba 1: Verificación del Webhook**

1. Envía un mensaje con imagen a tu número de WhatsApp
2. Verifica los logs en tu aplicación
3. Deberías ver:
   ```
   📥 WhatsApp webhook received
   📱 Processing WhatsApp message
   📎 Media message detected: image
   📥 Downloading media
   ✅ Media downloaded
   ✅ Created document record
   ✅ Media uploaded successfully
   ```

### **Prueba 2: Verificar en la Base de Datos**

1. Ve a tu base de datos de Supabase
2. Tabla `documents`:
   - Debería aparecer un nuevo registro
   - `source` = 'whatsapp_webhook'
   - `processing_status` = 'completed'

### **Prueba 3: Verificar en la Vista de Documentos**

1. Ve a tu aplicación web
2. Navega a **Documents**
3. Deberías ver el documento de WhatsApp
4. Con el estado "Completed"

### **Prueba 4: Verificar Procesamiento con IA**

1. Ve a **Webhooks Monitoring**
2. Verifica que el documento aparezca en la lista
3. Haz clic en el botón de ojo para ver detalles
4. Deberías ver:
   - Análisis de IA con tipo de documento
   - Datos extraídos (NIF, montos, fechas, etc.)
   - Referencia a factura o gasto creado

### **Prueba 5: Verificar en Facturas/Gastos**

1. Ve a **Invoices** - Debería aparecer la factura procesada
2. Ve a **Expenses** - Debería aparecer el gasto procesado
3. Los datos deberían estar completos y correctos

1. Ve a tu aplicación web
2. Navega a **Documents**
3. Deberías ver el documento de WhatsApp
4. Con el estado "Completed"

## 🔍 **Troubleshooting**

### **Error: "Webhook verification failed"**

- Verifica que el `WHATSAPP_VERIFY_TOKEN` coincida
- Asegúrate de que la URL del webhook sea correcta

### **Error: "No media URL in response"**

- Verifica que el `WHATSAPP_ACCESS_TOKEN` sea válido
- Asegúrate de que la aplicación tenga permisos de WhatsApp

### **Error: "Failed to download media file"**

- Verifica la conectividad a internet
- Asegúrate de que el token no haya expirado

### **Documento no aparece en la vista**

- Verifica que la tabla `documents` tenga el registro
- Verifica que el bucket de Supabase Storage esté configurado
- Revisa los logs de la aplicación

## 📊 **Monitoreo**

### **Logs Importantes**

- `📥 WhatsApp webhook received` - Webhook recibido
- `📱 Processing WhatsApp message` - Procesando mensaje
- `📎 Media message detected` - Tipo de media detectado
- `📥 Downloading media` - Descargando media
- `✅ Media downloaded` - Media descargado exitosamente
- `✅ Created document record` - Registro creado en BD
- `✅ Media uploaded successfully` - Media subido a Storage
- `✅ Document processing completed` - Procesamiento completado

### **Métricas a Monitorear**

- Número de mensajes recibidos por día
- Tasa de éxito en descarga de media
- Tiempo de procesamiento promedio
- Errores por tipo de media

## 🚀 **Próximos Pasos**

1. **Mapeo de números a tenants** - Asignar números de WhatsApp a empresas específicas
2. **Procesamiento AI** - Integrar con el pipeline de IA existente
3. **Notificaciones** - Enviar confirmaciones por WhatsApp
4. **Dashboard** - Vista específica para mensajes de WhatsApp
5. **Filtros avanzados** - Filtrar por tipo de media, fecha, estado

## 📞 **Soporte**

Si tienes problemas:

1. Verifica los logs de la aplicación
2. Confirma que todas las variables de entorno estén configuradas
3. Verifica la configuración del webhook en Facebook Developers
4. Revisa las políticas de Supabase Storage

---

**¡Con esta configuración, tu sistema de WhatsApp estará funcionando completamente! 🎉**
