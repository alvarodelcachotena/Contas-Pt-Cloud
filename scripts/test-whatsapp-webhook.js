// Script para probar el webhook de WhatsApp
const fetch = require('node-fetch');

async function testWhatsAppWebhook() {
  try {
    console.log('🧪 Probando webhook de WhatsApp...');
    
    // Simular un mensaje de WhatsApp con imagen
    const testMessage = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123456789',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: '1234567890'
            },
            messages: [{
              id: 'test_message_123',
              from: '1234567890',
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'image',
              image: {
                id: 'test_image_123',
                mime_type: 'image/jpeg',
                sha256: 'test_sha256',
                filename: 'test_invoice.jpg'
              }
            }]
          },
          field: 'messages'
        }]
      }]
    };

    // Enviar al webhook local
    const response = await fetch('http://localhost:3000/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    console.log('📤 Respuesta del webhook:', response.status);
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Webhook funcionando:', result);
    } else {
      const error = await response.text();
      console.log('❌ Error en webhook:', error);
    }

  } catch (error) {
    console.error('❌ Error probando webhook:', error);
  }
}

testWhatsAppWebhook();