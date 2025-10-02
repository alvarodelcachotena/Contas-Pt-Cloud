# 🔑 Guía Visual: Facebook Developers - WhatsApp Business API

## 📍 Pasos Exactos para Cada Campo

### 1️⃣ WHATSAPP_ACCESS_TOKEN

**Ubicación:** WhatsApp → Configuration → Getting Started

```
📱 Facebook Developers Dashboard
├── Tu Aplicación (ej: "ContasPT-Chatbot-1")
├── WhatsApp (menú lateral)
└── Configuration
    └── Getting Started
        └── Access Token: EAABwzLixnjYBO... [📋 COPIAR ESTE]
```

### 2️⃣ WHATSAPP_PHONE_NUMBER_ID

**Ubicación:** WhatsApp → Configuration → Getting Started

```
📱 Panel Getting Started
└── Tabla con información:
    ├── Phone number ID: 123456789012345 [📋 COPIAR ESTE]
    ├── Business account ID: 987654321098765
    └── WhatsApp Business API: Active
```

### 3️⃣ WHATSAPP_BUSINESS_ACCOUNT_ID

**Ubicación:** WhatsApp → Configuration → Getting Started

```
📱 Tabla Getting Started
└── Business account ID: 987654321098765 [📋 COPIAR ESTE]
```

### 4️⃣ WHATSAPP_APP_ID

**Ubicación:** Settings → Basic

```
🔧 Settings → Basic
└── App ID: 123456789012345 [📋 COPIAR ESTE]
```

### 5️⃣ WHATSAPP_APP_SECRET

**Ubicación:** Settings → Basic → App Secret

```
🔧 Settings → Basic
└── App Secret: [SHOW] abcd1234efgh5678ijkl9012mnop3456 [📋 COPIAR]
    (Haz clic en "Show" para revelar)
```

### 6️⃣ WHATSAPP_VERIFY_TOKEN

**Ubicación:** WhatsApp → Configuration → Webhook

```
🔧 WhatsApp Configuration → Webhook
├── Callback URL: https://contas-pt.netlify.app/api/webhooks/whatsapp
├── Verify Token: 1c7eba0ef1c438301a9b0f369d6e1708 [📋 ESCRIBIR ESTO]
└── [VERIFY AND SAVE]
```

## 🚀 Configuración Completa por Chatbot

### Chatbot 1: Principal España (+34613881071)

```
📱 Aplicación: "ContasPT-Primario"
├── WHATSAPP_ACCESS_TOKEN: EAABwzLix... (Getting Started)
├── WHATSAPP_PHONE_NUMBER_ID: 123456789 (Getting Started)
├── WHATSAPP_BUSINESS_ACCOUNT_ID: 987654321 (Getting Started)
├── WHATSAPP_APP_ID: 111222333 (Settings → Basic)
├── WHATSAPP_APP_SECRET: abcd1234... (Settings → Basic)
├── WHATSAPP_VERIFY_TOKEN: 1c7eba0ef1c438301a9b0f369d6e1708 [INVENTAR]
└── WHATSAPP_WEBHOOK_URL: https://contas-pt.netlify.app/api/webhooks/whatsapp
```

### Chatbot 2: Colombia (+573014241183)

```
📱 Aplicación: "ContasPT-Colombia"
├── WHATSAPP_ACCESS_TOKEN_2: EAABwzLiY... (Getting Started)
├── WHATSAPP_PHONE_NUMBER_ID_2: 456789012 (Getting Started)
├── WHATSAPP_BUSINESS_ACCOUNT_ID_2: 654321098 (Getting Started)
├── WHATSAPP_APP_ID_2: 444555666 (Settings → Basic)
├── WHATSAPP_APP_SECRET_2: efgh5678... (Settings → Basic)
├── WHATSAPP_VERIFY_TOKEN_2: 1c7eba0ef1c438301a9b0f369d6e1709 [INVENTAR]
└── WHATSAPP_WEBHOOK_URL_2: https://contas-pt.netlify.app/api/webhooks/whatsapp
```

### Chatbot 3: Secundario España (+34661613025)

```
📱 Aplicación: "ContasPT-Secundario"
├── WHATSAPP_ACCESS_TOKEN_3: EAABwzLiz... (Getting Started)
├── WHATSAPP_PHONE_NUMBER_ID_3: 789012345 (Getting Started)
├── WHATSAPP_BUSINESS_ACCOUNT_ID_3: 321098765 (Getting Started)
├── WHATSAPP_APP_ID_3: 777888999 (Settings → Basic)
├── WHATSAPP_APP_SECRET_3: ijkl9012... (Settings → Basic)
├── WHATSAPP_VERIFY_TOKEN_3: 1c7eba0ef1c438301a9b0f369d6e1710 [INVENTAR]
└── WHATSAPP_WEBHOOK_URL_3: https://contas-pt.netlify.app/api/webhooks/whatsapp
```

## ⚠️ Puntos Importantes

### ✅ Access Token
- **Se genera automáticamente** por Facebook
- **Copia EXACTAMENTE** desde Getting Started
- **Siempre empieza con "EAABwzLi..."**

### ✅ App Secret
- **Está oculto por defecto**
- **Haz clic en "Show"** para revelarlo
- **Es una cadena de letras y números**

### ✅ Verify Token
- **TÚ LO INVENTAS**
- **Debe ser EXACTAMENTE igual** en:
  1. Tu archivo `.env.local`
  2. La configuración del webhook en Facebook
- **Usa los tokens que ya tienes configurados**

### ✅ Webhook URL
- **TODOS los webhooks apuntan a:** `https://contas-pt.netlify.app/api/webhooks/whatsapp`
- **Cada aplicación usa SU PROPIO Verify Token**

## 🔍 Estructura de Archivos

```
📁 Tu Proyecto
├── 📄 .env.local (crear este archivo)
├── 📄 env-example-whatsapp-multiple-chatbots.txt (plantilla)
└── 📄 app/api/webhooks/whatsapp/route.ts (ya configurado)
```

## 📋 Archivo .env.local Final

```bash
# CHATBOT 1: Principal España
WHATSAPP_ACCESS_TOKEN=EAABwzLix... # Copiado de Getting Started
WHATSAPP_PHONE_NUMBER_ID=123456789 # Copiado de Getting Started
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321 # Copiado de Getting Started
WHATSAPP_APP_ID=111222333 # Copiado de Settings → Basic
WHATSAPP_APP_SECRET=abcd1234... # Copiado de Settings → Basic
WHATSAPP_VERIFY_TOKEN=1c7eba0ef1c438301a9b0f369d6e1708 # INVENTADO por ti
WHATSAPP_WEBHOOK_URL=https://contas-pt.netlify.app/api/webhooks/whatsapp

# CHATBOT 2: Colombia
WHATSAPP_ACCESS_TOKEN_2=EAABwzLiY... # Copiado de App Colombia
WHATSAPP_PHONE_NUMBER_ID_2=456789012
WHATSAPP_BUSINESS_ACCOUNT_ID_2=654321098
WHATSAPP_APP_ID_2=444555666
WHATSAPP_APP_SECRET_2=efgh5678...
WHATSAPP_VERIFY_TOKEN_2=1c7eba0ef1c438301a9b0f369d6e1709 # INVENTADO por ti
WHATSAPP_WEBHOOK_URL_2=https://contas-pt.netlify.app/api/webhooks/whatsapp

# CHATBOT 3: Secundario España  
WHATSAPP_ACCESS_TOKEN_3=EAABwzLiz... # Copiado de App Secundario
WHATSAPP_PHONE_NUMBER_ID_3=789012345
WHATSAPP_BUSINESS_ACCOUNT_ID_3=321098765
WHATSAPP_APP_ID_3=777888999
WHATSAPP_APP_SECRET_3=ijkl9012...
WHATSAPP_VERIFY_TOKEN_3=1c7eba0ef1c438301a9b0f369d6e1710 # INVENTADO por ti
WHATSAPP_WEBHOOK_URL_3=https://contas-pt.netlify.app/api/webhooks/whatsapp

# CONFIGURACIÓN COMPARTIDA
GEMINI_API_KEY=tu_gemini_api_key_aqui
SUPABASE_URL=tu_supabase_url_aqui
SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key_aqui
```

## ✅ Verificación Final

Después de configurar todo:

1. **Ejecuta verificación:** `node scripts/test-whatsapp-config.js`
2. **Enviar mensaje de prueba** a cada número de WhatsApp
3. **Revisar logs** para confirmar funcionamiento
4. **Probar procesamiento** de documentos en cada chat
