# 🚀 Pasos Finales: Una vez configurado todo

## ✅ Checklist Final

### 1️⃣ Variables de entorno configuradas (.env.local)
```bash
# Debes tener esto configurado:
WHATJSAPP_READ_ACCESS_TOKEN=EAABwzLix...
WHATJSAPP_PHONE_NUMBER_PHY_NUMBER_ID=123456789
WHATJSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATJSAPP_ACCESS_TOKEN_2=EAABwzLiY...
WHATJSAPP_ACCESS_TOKEN_3=EAABwzLiz...
# ... etc para todos los campos
```

### 2️⃣ Verify Tokens configurados en Facebook Developers
```bash
# Tres aplicaciones, cada una con su verify token:
App 1 (Principal):     1c7eba0ef1c438301a9b0f369d6e1708
App 2 (Colombia):      1c7eba0ef1c438301a9b0f369d6e1709
App 3 (Secundario):     1c7eba0ef1c438301a9b0f369d6e1710
```

### 3️⃣ Webhooks configurados en Facebook Developers
```bash
# TODOS los webhooks apuntan a:
URL: https://contas-pt.netlify.app/api/webhooks/whatsapp
```

## 🚀 Pasos Siguientes (YA QUE TIENES TODO)

### PASO 1: Ejecutar Script de Base de Datos

```bash
# Windows:
psql -f scripts/setup-whatsapp-multiple-chatbots.sql

# Si usas otro cliente SQL, ejecuta el contenido del archivo:
scripts/setup-whatsapp-multiple-chatbots.sql
```

### PASO 2: Reiniciar la Aplicación

```bash
# Detener la aplicación actual
CTRL + C

# Reiniciar
npm run dev
```

### PASO 3: Verificar Configuración

```bash
# Ejecutar verificador
node scripts/test-whatsapp-config.js
```

### PASO 4: Probar Cada Chatbot

```
📱 Envía mensaje a: +34613881071
📱 Envía mensaje a: +573014241183  
📱 Envía mensaje a: +34661613025

🔍 Debes recibir respuesta de cada número
```

### PASO 5: Probar Procesamiento de Documentos

```
📄 Envía una imagen/factura a cada número
🧠 El sistema debe procesar automáticamente
✅ Debe responder con datos extraídos
```

## 🧪 Comandos de Verificación

```bash
# 1. Verificar configuración básica
node scripts/test-whatsapp-config.js

# 2. Verificar conectividad del webhook
curl -X GET "https://contas-pt.netlify.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=1c7eba0ef1c438301a9b0f369d6e1708&hub.challenge=test"

# 3. Revisar logs en tiempo real
# (Si tienes logs habilitados)
```

## ❗ Posibles Problemas y Soluciones

### 🔴 Error: "Verification failed"
**Causa:** Verify Token no coincide
**Solución:** 
- Verifica que el token en Facebook sea EXACTAMENTE igual al de tu .env
- Reinicia la aplicación después de cambiar .env

### 🔴 Error: "Access token invalid"
**Causa:** Token incorrecto o expirado  
**Solución:**
- Copia nuevamente el Access Token desde Facebook Developers
- Actualiza .env.local

### 🔴 Error: "Number not authorized"
**Causa:** Número no está en la lista autorizada
**Solución:**
- Ya está configurado automáticamente
- Los números autorizados son los que configuraste

### 🔴 No recibe mensajes
**Causa:** Webhook mal configurado
**Solución:**
- Verifica URL del webhook en todas las apps
- Confirma que esté suscrito a "messages"

## ✅ Confirmación Final

**Cuando todo funcione correctamente:**

1. ✅ Los 3 números responden mensajes de texto
2. ✅ Los 3 números procesan imágenes/facturas  
3. ✅ Cada número usa su propia configuración
4. ✅ Los documentos se guardan en la base de datos
5. ✅ Los logs muestran actividad de los 3 chatbots

## 🎉 ¡Listo!

Tu sistema de múltiples chatbots estará funcionando:

- 🔵 **Chatbot Principal España** (+34613881071)
- 🔵 **Chatbot Colombia** (+573014241183)  
- 🔵 **Chatbot Secundario España** (+34661613025)

Todos funcionando simultáneamente con IA, procesamiento de documentos y conexión a tu base de datos.
