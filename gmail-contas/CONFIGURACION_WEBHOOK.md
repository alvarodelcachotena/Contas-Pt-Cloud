# 🚀 Guía Completa - Configuración WhatsApp Webhook

## 📋 Requisitos Previos

✅ **ngrok instalado**: Descarga de https://ngrok.com/download  
✅ **Cuenta Meta for Developers**: https://developers.facebook.com/  
✅ **WhatsApp Business API configurada**  
✅ **Token de acceso válido**: Ya configurado en `what.py`

## 🔧 Paso 1: Instalar ngrok

1. **Descargar ngrok**:
   - Ve a https://ngrok.com/download
   - Descarga la versión para Windows
   - Extrae `ngrok.exe` a una carpeta accesible

2. **Configurar ngrok** (opcional pero recomendado):
   - Regístrate en ngrok.com (gratis)
   - Copia tu authtoken
   - Ejecuta: `ngrok authtoken TU_TOKEN_AQUI`

## 🚀 Paso 2: Iniciar el Sistema

1. **Ejecutar el script de inicio**:
   ```bash
   start_whatsapp_server.bat
   ```

2. **Copiar la URL de ngrok**:
   - Verás algo como: `https://abc123-456.ngrok.io`
   - **¡IMPORTANTE!** Copia esta URL completa

## 🔗 Paso 3: Configurar Webhook en Meta

1. **Acceder a Meta for Developers**:
   - Ve a https://developers.facebook.com/
   - Inicia sesión con tu cuenta
   - Selecciona tu aplicación de WhatsApp Business

2. **Configurar el Webhook**:
   - Ve a **WhatsApp > Configuration**
   - En la sección **Webhook**, haz clic en **Edit**

3. **Configurar los valores**:
   ```
   Callback URL: https://tu-url-ngrok.ngrok.io/webhook
   Verify Token: 1c7eba0ef1c438301a9b0f369d6e1708
   ```

4. **Seleccionar campos del webhook**:
   - ✅ Marca la casilla **messages**
   - Haz clic en **Verify and Save**

## 🧪 Paso 4: Probar el Sistema

1. **Verificar conexión**:
   - En los logs del servidor verás:
   ```
   🔐 Verificando webhook - Token recibido: 1c7eba0ef1c438301a9b0f369d6e1708
   ✅ Webhook verificado exitosamente
   ```

2. **Enviar archivo de prueba**:
   - Envía una **imagen** o **PDF** a tu número de WhatsApp Business
   - Verás en los logs algo como:
   ```
   📱 Nuevo mensaje de WhatsApp - Tipo: image - De: +1234567890
   🖼️ Procesando imagen: media_id_123
   🔍 Obteniendo URL para media ID: media_id_123
   📥 Archivo descargado: C:\Users\...\whatsapp_image_123.jpg
   ☁️ Archivo subido a Dropbox: /prueba/whatsapp_image_123_20241201_143022.jpg
   ✅ Imagen procesada exitosamente
   ```

## 🔍 Solución de Problemas

### ❌ Error: "Token de verificación incorrecto"
- **Solución**: Verifica que el token en Meta coincida exactamente con:
  `1c7eba0ef1c438301a9b0f369d6e1708`

### ❌ Error: "URL no accesible"
- **Solución**: 
  - Verifica que ngrok esté ejecutándose
  - Usa la URL **https** (no http)
  - Incluye `/webhook` al final

### ❌ Error: "No se reciben mensajes"
- **Solución**:
  - Verifica que el webhook esté configurado correctamente
  - Asegúrate de que la casilla **messages** esté marcada
  - Revisa que la URL de ngrok sea correcta

### ❌ Error: "No se puede descargar archivo"
- **Solución**:
  - Verifica que el token de WhatsApp sea válido
  - Revisa los logs para más detalles del error

## 🎯 URLs Importantes

- **Meta for Developers**: https://developers.facebook.com/
- **Documentación WhatsApp Business**: https://developers.facebook.com/docs/whatsapp/
- **ngrok Dashboard**: https://dashboard.ngrok.com/
- **Dropbox**: https://www.dropbox.com/

## 📊 Archivos Importantes

```
gmail-contas/
├── what.py                    # Servidor principal
├── start_whatsapp_server.bat  # Script de inicio
├── stop_whatsapp_server.bat   # Script para detener
├── requirements.txt           # Dependencias
└── CONFIGURACION_WEBHOOK.md   # Esta guía
```

## 🆘 Soporte Rápido

Si algo no funciona:

1. **Revisa los logs** del servidor Python
2. **Verifica la URL de ngrok** (cambia cada vez que reinicias)
3. **Actualiza el webhook** en Meta con la nueva URL
4. **Prueba el webhook** enviando un archivo

---

## 🎉 ¡Listo!

Una vez configurado, cada imagen o PDF que envíes a tu WhatsApp Business se descargará automáticamente y se subirá a Dropbox en la carpeta `/prueba/`.

**¡Disfruta de tu automatización!** 🚀 