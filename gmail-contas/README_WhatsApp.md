# WhatsApp Media Sync

Este script automatiza la descarga de imágenes y documentos PDF de WhatsApp y los sube automáticamente a Dropbox.

## 🚀 Características

- ✅ Descarga automática de imágenes de WhatsApp
- ✅ Descarga automática de documentos PDF de WhatsApp
- ✅ Subida automática a Dropbox (carpeta `/prueba/`)
- ✅ Webhook server para recibir mensajes en tiempo real
- ✅ Gestión de archivos temporales
- ✅ Logs detallados del proceso

## 📋 Requisitos Previos

### 1. Cuenta de WhatsApp Business
- Necesitas una cuenta de WhatsApp Business API
- Obtén tu `Access Token` desde Meta for Developers
- Configura un webhook en tu aplicación de WhatsApp Business

### 2. Cuenta de Dropbox
- Token de API de Dropbox (ya configurado en el script)
- Carpeta `/prueba/` en tu Dropbox

## 🔧 Instalación

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Configurar credenciales
Edita el archivo `what.py` y actualiza las siguientes variables:

```python
# Configuración de WhatsApp Business API
WHATSAPP_ACCESS_TOKEN = "tu_token_de_whatsapp_aqui"
WHATSAPP_PHONE_NUMBER_ID = "tu_phone_number_id_aqui"

# Token de verificación para el webhook
# En la función webhook_verification(), cambia:
if verify_token == "tu_token_de_verificacion":
```

## 🌐 Configuración del Webhook

### 1. Obtener URL pública
Para que WhatsApp pueda enviarte mensajes, necesitas una URL pública. Puedes usar:

#### Opción A: ngrok (recomendado para pruebas)
```bash
# Instalar ngrok
# Ejecutar el script
python what.py

# En otra terminal
ngrok http 5000
```
Esto te dará una URL como: `https://abc123.ngrok.io`

#### Opción B: Servidor público
- Deploye el script en un servidor con IP pública
- Configura un dominio y SSL

### 2. Configurar webhook en Meta for Developers
1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Selecciona tu aplicación de WhatsApp Business
3. Ve a "WhatsApp > Configuration"
4. En "Webhook", configura:
   - **Callback URL**: `https://tu-url-publica.com/webhook`
   - **Verify token**: El token que configuraste en el código
   - **Webhook fields**: Marca "messages"

## 🚀 Uso

### 1. Iniciar el servidor
```bash
python what.py
```

Verás un mensaje como:
```
🚀 WhatsApp Media Sync - Iniciando...
📱 Esperando mensajes de WhatsApp con imágenes y PDFs
☁️  Los archivos se subirán a Dropbox: /prueba/
✅ Conectado a Dropbox exitosamente
🌐 Iniciando servidor webhook...
📡 Webhook URL: http://localhost:5000/webhook
```

### 2. Enviar archivos por WhatsApp
- Envía imágenes a tu número de WhatsApp Business
- Envía documentos PDF a tu número de WhatsApp Business
- Los archivos se descargarán y subirán automáticamente a Dropbox

### 3. Verificar en Dropbox
Los archivos aparecerán en la carpeta `/prueba/` con nombres como:
- `whatsapp_image_123456789_20241201_143022.jpg`
- `documento_20241201_143022.pdf`

## 📁 Estructura de Archivos

```
gmail-contas/
├── main.py              # Script para Gmail
├── what.py              # Script para WhatsApp
├── requirements.txt     # Dependencias Python
└── README_WhatsApp.md   # Este archivo
```

## 🔍 Solución de Problemas

### Error de conexión a Dropbox
```
❌ Error al conectar con Dropbox
```
- Verifica que el token de Dropbox esté correcto
- Asegúrate de que la carpeta `/prueba/` exista

### Error de webhook
```
❌ Error en webhook
```
- Verifica que el token de verificación sea correcto
- Asegúrate de que el webhook esté configurado correctamente en Meta

### Error al descargar archivos
```
❌ Error al descargar archivo
```
- Verifica que el Access Token de WhatsApp sea válido
- Asegúrate de que tengas permisos para descargar archivos

## 📊 Logs del Sistema

El script proporciona logs detallados:
- 📱 Nuevos mensajes recibidos
- 🖼️ Imágenes procesadas
- 📄 Documentos procesados
- ☁️ Archivos subidos a Dropbox
- ❌ Errores y advertencias

## 🔐 Seguridad

- Mantén tus tokens seguros
- No compartas las credenciales
- Usa HTTPS en producción
- Implementa verificación adicional si es necesario

## 📝 Notas Importantes

1. **Tipos de archivo soportados**:
   - Imágenes: JPG, PNG, GIF, BMP, WebP
   - Documentos: PDF

2. **Límites de la API**:
   - Respeta los límites de la API de WhatsApp Business
   - Los archivos grandes pueden tardar más en procesarse

3. **Almacenamiento**:
   - Los archivos se almacenan temporalmente en `~/Downloads/whatsapp_temp/`
   - Se eliminan automáticamente después de subir a Dropbox

4. **Nombres de archivos**:
   - Se agregan timestamps para evitar conflictos
   - Se sanitizan los nombres para evitar problemas

## 🆘 Soporte

Si tienes problemas:
1. Verifica que todas las credenciales estén correctas
2. Revisa los logs del script
3. Asegúrate de que el webhook esté configurado correctamente
4. Verifica que tu servidor sea accesible desde internet 