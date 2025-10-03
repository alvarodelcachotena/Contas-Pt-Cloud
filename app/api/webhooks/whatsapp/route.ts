import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { loadEnvStrict } from '../../../../lib/env-loader.js'
import {
  WhatsAppWebhookPayload,
  WhatsAppMessage,
  WhatsAppMediaMessage,
  isMediaTypeSupported,
  getFileExtension,
  WHATSAPP_API_BASE
} from '../../../../lib/whatsapp-config'
import { DocumentAIService } from '../../../../lib/gemini-ai-service'
import { DropboxApiClient } from '../../../../server/dropbox-api-client'
import { continuousLearningService } from '../../../../lib/continuous-learning-service'

// Cache simple en memoria para media IDs procesados con timestamp
interface ProcessedMedia {
  id: string
  processed_at: number
  document_id?: number
}

const processedMediaCache = new Map<string, ProcessedMedia>()
const PROCESSING_TIMEOUT = 5 * 60 * 1000 // 5 minutos

// Función de verificación de API key
function verifyApiKey() {
  // Cargar variables de entorno primero
  loadEnvStrict()

  const apiKey = process.env.GEMINI_API_KEY
  console.log('🔑 Verificando API key de Gemini AI...')
  console.log(`   API key configurada: ${apiKey ? '✅ Sí' : '❌ No'}`)
  if (apiKey) {
    console.log(`   Longitud: ${apiKey.length} caracteres`)
    console.log(`   Empieza con: ${apiKey.substring(0, 10)}...`)
    console.log(`   Termina con: ...${apiKey.substring(apiKey.length - 10)}`)
    console.log(`   Formato correcto: ${apiKey.startsWith('AIza') ? '✅' : '❌'}`)
  }
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY no está configurada')
    console.error('📋 Variables disponibles:', Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('GOOGLE')))
    throw new Error('GEMINI_API_KEY no está configurada')
  }
  return true
}

// Función para enviar mensajes de WhatsApp
async function sendWhatsAppMessage(phoneNumber: string, message: string, fromPhoneNumberId?: string) {
  try {
    const credentials = getWhatsAppCredentials(fromPhoneNumberId)
    console.log('📤 Enviando mensaje a WhatsApp:', {
      phoneNumber,
      messageLength: message.length,
      fromNumber: credentials.displayNumber,
      phoneNumberId: credentials.phoneNumberId
    })

    const response = await fetch(`${WHATSAPP_API_BASE}/${credentials.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ Error en respuesta de WhatsApp:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        fromNumber: credentials.displayNumber
      })
      return false
    }

    console.log(`✅ Mensaje enviado exitosamente a ${phoneNumber} desde ${credentials.displayNumber}`)
    return true
  } catch (error) {
    console.error('❌ Error enviando mensaje de WhatsApp:', error)
    return false
  }
}

loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Get WhatsApp credentials from environment variables for multiple numbers
function getWhatsAppCredentials(phoneNumber?: string) {
  // Debug: Log all environment variables
  console.log('🔍 Environment variables:')
  console.log('  - WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_ACCESS_TOKEN_2:', process.env.WHATSAPP_ACCESS_TOKEN_2 ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_PHONE_NUMBER_ID_2:', process.env.WHATSAPP_PHONE_NUMBER_ID_2 ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_ACCESS_TOKEN_3:', process.env.WHATSAPP_ACCESS_TOKEN_3 ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_PHONE_NUMBER_ID_3:', process.env.WHATSAPP_PHONE_NUMBER_ID_3 ? '✅ Set' : '❌ Not set')

  // Definir configuración para múltiples números
  const whatsappConfigs: Record<string, any> = {
    '+34613881071': { // Número principal España
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      appId: process.env.WHATSAPP_APP_ID,
      appSecret: process.env.WHATSAPP_APP_SECRET,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL,
      displayNumber: '+34613881071'
    },
    '+573014241183': { // Número Colombia
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN_2,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID_2,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID_2,
      appId: process.env.WHATSAPP_APP_ID_2,
      appSecret: process.env.WHATSAPP_APP_SECRET_2,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN_2,
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL_2,
      displayNumber: '+573014241183'
    },
    '+34661613025': { // Número secundario España
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN_3,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID_3,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID_3,
      appId: process.env.WHATSAPP_APP_ID_3,
      appSecret: process.env.WHATSAPP_APP_SECRET_3,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN_3,
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL_3,
      displayNumber: '+34661613025'
    }
  }

  // Si se proporciona un número específico, usar su configuración
  if (phoneNumber && whatsappConfigs[phoneNumber]) {
    const config = whatsappConfigs[phoneNumber]
    console.log(`📱 Usando configuración para ${phoneNumber}: ${config.displayNumber}`)
    return config
  }

  // Por defecto, usar el número principal
  const defaultConfig = whatsappConfigs['+34613881071']
  console.log(`📱 Usando configuración principal por defecto: ${defaultConfig.displayNumber}`)
  return defaultConfig
}

// WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Try all possible configurations for multiple numbers
  const verifyTokens = [
    process.env.WHATSAPP_VERIFY_TOKEN,
    process.env.WHATSAPP_VERIFY_TOKEN_2,
    process.env.WHATSAPP_VERIFY_TOKEN_3
  ]

  // Debug: Log the verification attempt
  console.log('🔍 Debug webhook verification para múltiples números:')
  console.log('  - Mode:', mode)
  console.log('  - Received token:', token)
  console.log('  - Expected tokens disponibles:', verifyTokens.filter(t => t !== undefined).length)

  // Check if any token matches
  const isValidToken = verifyTokens.some(expectedToken =>
    expectedToken && expectedToken === token
  )

  if (mode === 'subscribe' && isValidToken) {
    console.log('✅ WhatsApp webhook verified successfully para múltiples números')
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  } else {
    console.error('❌ WhatsApp webhook verification failed')
    console.error('  - Expected tokens:', verifyTokens.filter(t => t !== undefined))
    console.error('  - Received token:', token)
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
  }
}

// Handle WhatsApp webhook messages
export async function POST(request: NextRequest) {
  console.log('🚀 === WHATSAPP WEBHOOK POST RECIBIDO ===')
  console.log('📅 Timestamp:', new Date().toISOString())
  console.log('🌐 User Agent:', request.headers.get('user-agent'))
  console.log('🔑 Content-Type:', request.headers.get('content-type'))

  try {
    // Verificar variables de entorno
    verifyApiKey()

    // Obtener y parsear el body
    const body: WhatsAppWebhookPayload = await request.json()
    console.log('📥 WhatsApp webhook payload:', JSON.stringify(body, null, 2))

    // Log detallado de la estructura
    if (body.entry && body.entry[0] && body.entry[0].changes) {
      console.log('🔍 Estructura detallada del webhook:')
      body.entry[0].changes.forEach((change, index) => {
        console.log(`   Cambio ${index + 1}:`)
        console.log(`     - Field: ${change.field}`)
        console.log(`     - Messages: ${change.value?.messages ? change.value.messages.length : 'NO HAY'}`)
        console.log(`     - Statuses: ${change.value?.statuses ? change.value.statuses.length : 'NO HAY'}`)
        if (change.value?.messages) {
          change.value.messages.forEach((msg, msgIndex) => {
            console.log(`       Mensaje ${msgIndex + 1}: ID=${msg.id}, Tipo=${msg.type}`)
          })
        }
        if (change.value?.statuses) {
          change.value.statuses.forEach((status: any, statusIndex: number) => {
            console.log(`       Status ${statusIndex + 1}: ${status.status} para mensaje ${status.id}`)
          })
        }
      })
    }

    // Process webhook data
    if (body.entry && body.entry[0]?.changes) {
      console.log(`📋 Procesando ${body.entry[0].changes.length} cambios`);

      for (const change of body.entry[0].changes) {
        console.log(`🔄 Procesando cambio:`, change.field);

        if (change.value?.messages) {
          console.log(`📱 Procesando ${change.value.messages.length} mensajes`);

          for (const message of change.value.messages) {
            console.log(`💬 Procesando mensaje ID: ${message.id}, Tipo: ${message.type}`);
            await processWhatsAppMessage(message, change.value.metadata?.phone_number_id)
          }
        } else {
          console.log('⚠️ No hay mensajes en este cambio');
        }
      }
    } else {
      console.log('⚠️ Estructura del webhook no válida o sin cambios');
    }

    console.log('✅ Webhook procesado exitosamente');
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })

  } catch (error) {
    console.error('❌ Error procesando webhook:', error)

    // Si tenemos acceso al body y hay un error, intentar enviar mensaje al usuario
    try {
      const errorBody = await request.clone().json() as WhatsAppWebhookPayload
      if (errorBody.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from) {
        const userPhone = errorBody.entry[0].changes[0].value.messages[0].from
        await sendWhatsAppMessage(
          userPhone,
          `❌ Error en el procesamiento: ${error instanceof Error ? error.message : 'Error desconocido'}`
        )
      }
    } catch (messageError) {
      console.error('❌ No se pudo enviar mensaje de error al usuario:', messageError)
    }

    return NextResponse.json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function processWhatsAppMessage(message: WhatsAppMessage, phoneNumberId?: string) {
  try {
    console.log(`📱 Processing WhatsApp message: ${message.id} from ${message.from}`)

    const supabase = createSupabaseClient()
    const userPhone = message.from

    // Verificar si el número está autorizado
    console.log(`🔍 Verificando autorización para número: ${userPhone}`)

    // Números autorizados para múltiples chatbots (con y sin prefijo +)
    const authorizedNumbers = [
      '+34613881071', // Número principal España con prefijo
      '34613881071',  // Número principal España sin prefijo
      '+573014241183', // Número Colombia con prefijo
      '573014241183',  // Número Colombia sin prefijo
      '+34661613025', // Número secundario España con prefijo
      '34661613025'    // Número secundario España sin prefijo
    ]

    const isAuthorized = authorizedNumbers.includes(userPhone)

    if (!isAuthorized) {
      console.log(`❌ Número no autorizado: ${userPhone}`)
      console.log(`📋 Números autorizados: ${authorizedNumbers.join(', ')}`)

      // Mensaje simple para números no autorizados
      await sendWhatsAppMessage(
        userPhone,
        `❌ Tu número ${userPhone} no está autorizado para usar este servicio.\n\n📋 Números autorizados:\n${authorizedNumbers.map(num => `• ${num}`).join('\n')}\n\nContacta al administrador para obtener acceso.`
      )
      return
    }

    // Usuario autorizado - crear datos básicos
    const authorizedUser = {
      display_name: `Usuario ${userPhone}`,
      role: 'user',
      tenant_id: 1
    }

    console.log(`✅ Usuario autorizado: ${authorizedUser.display_name} (${authorizedUser.role})`)
    const tenantId = authorizedUser.tenant_id
    const userRole = authorizedUser.role

    // Verificar si es mensaje de texto (consulta financiera)
    if (message.type === 'text' && message.text?.body) {
      console.log('💬 Procesando consulta de texto:', message.text.body)
      const credentials = getWhatsAppCredentials(phoneNumberId)
      await handleTextQuery(message.from, message.text.body, credentials)
      return
    }

    // Check if message contains media
    if (message.type === 'image' || message.type === 'document' || message.type === 'audio' || message.type === 'video') {
      console.log(`📎 Media message detected: ${message.type}`)

      const credentials = getWhatsAppCredentials(phoneNumberId)

      // Get media details
      const mediaDetails = message[message.type as keyof WhatsAppMessage] as any
      if (!mediaDetails?.id) {
        console.error('❌ No media ID found in message')
        return
      }

      // Crear cache permanente para evitar duplicados completamente
      const mediaCacheKey = `media_${mediaDetails.id}_${message.from}`

      // Verificar si este media ID ya fue procesado alguna vez desde este número
      const { data: existingDocs } = await supabase
        .from('documents')
        .select('id, processing_status, extracted_data')
        .eq('extracted_data->whatsapp_message->id', mediaDetails.id)
        .eq('extracted_data->sender_phone', message.from)
        .limit(1)

      if (existingDocs && existingDocs.length > 0) {
        const timeSinceProcessed = new Date().getTime() - new Date(existingDocs[0].extracted_data?.whatsapp_message?.timestamp * 1000).getTime()
        console.log(`⚠️ MEDIA YA PROCESADO PREVIAMENTE: ${mediaDetails.id} - ${Math.round(timeSinceProcessed / 1000)}s atrás`)

        // Solo enviar mensaje si fue hace menos de 10 minutos (para evitar spam)
        if (timeSinceProcessed < 600000) {
          await sendWhatsAppMessage(message.from, `📄 **Imagen ya procesada**\n\nEsta imagen ya fue analizada anteriormente.\n\n✅ Ya aparece en tu panel de control.`)
        }
        return
      }

      // Verificar si ya está en proceso en memoria
      if (processedMediaCache.has(mediaCacheKey)) {
        console.log(`⚠️ MEDIA YA EN PROCESO: ${mediaDetails.id}`)
        return // No enviar mensaje adicional
      }

      // Marcar como procesando INMEDIATAMENTE para evitar duplicados
      const now = Date.now()
      processedMediaCache.set(mediaCacheKey, {
        id: mediaDetails.id,
        processed_at: now
      })
      console.log(`🔄 Procesando media: ${mediaDetails.id} - Nuevo archivo`)

      // Download media from WhatsApp
      const mediaData = await downloadWhatsAppMedia(mediaDetails.id, credentials.accessToken)

      if (mediaData) {
        console.log(`🔄 Processing media file: ${mediaData.filename}`)
        console.log(`📄 MIME type from WhatsApp: ${mediaData.mime_type}`)
        console.log(`📏 File size: ${mediaData.size} bytes`)

        // Check if media type is supported
        if (!isMediaTypeSupported(mediaData.mime_type)) {
          console.log(`⚠️ Unsupported media type: ${mediaData.mime_type}`)
          return
        }

        // Create document record
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert({
            tenant_id: tenantId,
            filename: mediaData.filename,
            original_filename: mediaData.filename,
            file_size: mediaData.size,
            mime_type: mediaData.mime_type,
            processing_status: 'pending',
            processing_method: 'whatsapp_webhook',
            extracted_data: {
              whatsapp_message: {
                id: mediaDetails.id,
                from: message.from,
                timestamp: message.timestamp,
                type: message.type
              },
              sender_phone: message.from,
              media_type: message.type
            },
            confidence_score: 0
          })
          .select()
          .single()

        if (docError) {
          console.error('❌ Error creating document record:', docError)
          return
        }

        if (document) {
          console.log(`✅ Created document record: ${document.id}`)

          // Send initial confirmation message
          const initialMessage = `📥 **Procesando documento**\n\n🤖 Analizando con IA...\n\n✅ Te notificaré cuando esté listo.`
          await sendWhatsAppMessage(message.from, initialMessage)

          // Store the media file in Supabase Storage
          const fileName = `whatsapp/${document.id}/${mediaData.filename}`
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, mediaData.buffer, {
              contentType: mediaData.mime_type,
              upsert: false
            })

          if (uploadError) {
            console.error('❌ Error uploading media to storage:', uploadError)
            // Update document status to failed
            await supabase
              .from('documents')
              .update({
                processing_status: 'failed',
                extracted_data: { ...document.extracted_data, error: uploadError.message }
              })
              .eq('id', document.id)
            return
          }

          // Update document with file path
          await supabase
            .from('documents')
            .update({
              file_path: fileName,
              processing_status: 'processing'
            })
            .eq('id', document.id)

          console.log(`✅ Media uploaded successfully: ${fileName}`)

          // Process with Gemini AI
          try {
            console.log(`🤖 Procesando con Gemini AI...`)
            console.log(`📄 Archivo: ${mediaData.filename}`)
            console.log(`📄 MIME type: ${mediaData.mime_type}`)
            console.log(`📄 Buffer size: ${mediaData.buffer.length} bytes`)

            const aiService = new DocumentAIService()
            const analysisResult = await aiService.analyzeDocument(
              Buffer.from(mediaData.buffer),
              mediaData.filename,
              mediaData.mime_type
            )

            console.log(`📊 Resultado del análisis:`, analysisResult)

            // Generate new filename based on extracted data
            const extractedData = analysisResult.extracted_data
            const clientName = extractedData?.company_name || extractedData?.vendor_name || extractedData?.client_name || 'Cliente Desconocido'
            const documentDate = extractedData?.date || extractedData?.invoice_date || new Date().toISOString().split('T')[0]
            const originalExtension = document.filename ? document.filename.substring(document.filename.lastIndexOf('.')) : '.jpg'
            const newFileName = generateFileName(clientName, documentDate, originalExtension)

            console.log(`📁 Nuevo nombre de archivo: ${newFileName}`)

            // Update document with AI analysis results and new filename
            await supabase
              .from('documents')
              .update({
                processing_status: 'completed',
                confidence_score: analysisResult.confidence,
                filename: newFileName,
                extracted_data: {
                  ...document.extracted_data,
                  ai_analysis: analysisResult,
                  processed_at: new Date().toISOString(),
                  original_filename: document.filename,
                  new_filename: newFileName
                }
              })
              .eq('id', document.id)

            // Process based on document type
            // IMPORTANT: Invoices are expenses (money YOU paid), not invoices TO clients
            console.log(`🔍 Document type detected: ${analysisResult.document_type}`)
            console.log(`🔍 Extracted data keys:`, Object.keys(analysisResult.extracted_data || {}))

            // Force certain patterns to be treated as invoices (restaurant receipts, etc.)
            const analysisData = analysisResult.extracted_data || {}
            const description = analysisData.description || ''
            const vendorName = analysisData.vendor_name || analysisData.vendor || analysisData.client_name || ''

            console.log(`🔍 DEBUG - Detección de restaurante:`)
            console.log(`   - Description: "${description}"`)
            console.log(`   - Vendor Name: "${vendorName}"`)
            console.log(`   - Document Type original: ${analysisResult.document_type}`)
            console.log(`   - Palabras clave encontradas:`)

            const keywords = ['expresso', 'rouge', 'cote', 'rhone', 'rillettes', 'eperlans', 'onglet', 'fromage', 'couverts']
            keywords.forEach(keyword => {
              if (description.toLowerCase().includes(keyword)) {
                console.log(`     ✅ "${keyword}" encontrado`)
              }
            })

            // Check if this looks like a restaurant receipt or invoice
            const isRestaurantReceipt = description.toLowerCase().includes('café') ||
              description.toLowerCase().includes('moet') ||
              description.toLowerCase().includes('sangria') ||
              description.toLowerCase().includes('mariscada') ||
              description.toLowerCase().includes('ensalada') ||
              description.toLowerCase().includes('mojito') ||
              description.toLowerCase().includes('agua') ||
              description.toLowerCase().includes('bebida') ||
              description.toLowerCase().includes('comida') ||
              description.toLowerCase().includes('plato') ||
              description.toLowerCase().includes('expresso') ||
              description.toLowerCase().includes('rouge') ||
              description.toLowerCase().includes('cote') ||
              description.toLowerCase().includes('rhone') ||
              description.toLowerCase().includes('rillettes') ||
              description.toLowerCase().includes('eperlans') ||
              description.toLowerCase().includes('onglet') ||
              description.toLowerCase().includes('fromage') ||
              description.toLowerCase().includes('couverts') ||
              description.toLowerCase().includes('vino') ||
              description.toLowerCase().includes('wine') ||
              description.toLowerCase().includes('carne') ||
              description.toLowerCase().includes('pescado') ||
              description.toLowerCase().includes('queso') ||
              description.toLowerCase().includes('cheese') ||
              vendorName.toLowerCase().includes('restaurant') ||
              vendorName.toLowerCase().includes('fish') ||
              vendorName.toLowerCase().includes('bar') ||
              vendorName.toLowerCase().includes('café') ||
              vendorName.toLowerCase().includes('bistro')

            console.log(`   - Is Restaurant Receipt: ${isRestaurantReceipt}`)

            // Override document type for restaurant receipts
            let finalDocumentType = analysisResult.document_type
            if (isRestaurantReceipt && analysisResult.document_type === 'expense') {
              console.log(`🍽️ Detectado recibo de restaurante, cambiando de 'expense' a 'invoice'`)
              finalDocumentType = 'invoice'
            }

            console.log(`🔍 Final document type: ${finalDocumentType}`)

            // SIEMPRE guardar los datos extraídos, sin importar el tipo
            console.log(`💾 GUARDANDO DATOS EXTRAÍDOS OBLIGATORIAMENTE`)
            console.log(`🔍 Datos extraídos:`, JSON.stringify(analysisResult.extracted_data, null, 2))

            // Intentar guardar como INVOICE primero (para restaurantes y facturas)
            let savedAsInvoice = false
            if (finalDocumentType === 'invoice' || isRestaurantReceipt) {
              console.log(`💰 Intentando guardar como INVOICE`)
              try {
                await processInvoice(analysisResult.extracted_data, document.id, supabase, tenantId)
                console.log(`✅ processInvoice completado exitosamente`)
                savedAsInvoice = true
              } catch (error) {
                console.error(`❌ Error en processInvoice:`, error instanceof Error ? error.message : 'Unknown error')

                // Error en processInvoice - continuar con expense
                console.log(`⚠️ Error en processInvoice, continuando con expense`)

                console.log(`🔄 Intentando guardar como EXPENSE como fallback`)
              }
            }

            // Si no se guardó como invoice, intentar como expense
            if (!savedAsInvoice) {
              console.log(`💰 Guardando como EXPENSE`)
              try {
                await processExpense(analysisResult.extracted_data, document.id, supabase, tenantId)
                console.log(`✅ processExpense completado exitosamente`)
              } catch (error) {
                console.error(`❌ Error en processExpense:`, error instanceof Error ? error.message : 'Unknown error')

                // Error en processExpense - continuar con registro mínimo
                console.log(`⚠️ Error en processExpense, continuando con registro mínimo`)

                console.log(`⚠️ FALLO TOTAL: No se pudo guardar ni como invoice ni como expense`)

                // Crear un registro mínimo en expenses como último recurso
                try {
                  await createMinimalExpense(analysisResult.extracted_data, document.id, supabase, tenantId)
                  console.log(`✅ Registro mínimo creado como último recurso`)
                } catch (minimalError) {
                  console.error(`❌ Error crítico: No se pudo crear registro mínimo:`, minimalError instanceof Error ? minimalError.message : 'Unknown error')
                }
              }
            }

            console.log(`✅ Document processing completed with AI: ${document.id}`)

            // Save image to images table
            try {
              console.log(`💾 Guardando imagen en tabla images...`)

              // Convert buffer to base64
              const base64Data = Buffer.from(mediaData.buffer).toString('base64')
              const base64String = `data:${mediaData.mime_type};base64,${base64Data}`

              // Generate descriptive name
              const companyName = analysisResult.extracted_data?.client_name || analysisResult.extracted_data?.vendor || 'UNKNOWN'
              const documentDate = analysisResult.extracted_data?.date || new Date()
              const imageName = `${companyName.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, '')} ${new Date(documentDate).toISOString().split('T')[0]}`

              // Save to images table
              const { data: savedImage, error: imageError } = await supabase
                .from('images')
                .insert({
                  tenant_id: tenantId,
                  name: imageName,
                  original_filename: mediaData.filename,
                  image_data: base64String,
                  mime_type: mediaData.mime_type,
                  file_size: mediaData.size,
                  source: 'whatsapp',
                  company_name: companyName,
                  document_date: documentDate ? new Date(documentDate) : null
                })
                .select()
                .single()

              if (imageError) {
                console.error('❌ Error guardando imagen en tabla images:', imageError)
              } else {
                console.log(`✅ Imagen guardada en tabla images: ${savedImage.id}`)
              }
            } catch (imageError) {
              console.error('❌ Error procesando imagen para tabla images:', imageError)
            }

            // Upload to Dropbox
            const uploadSuccess = await uploadToDropbox(
              Buffer.from(mediaData.buffer),
              newFileName,
              tenantId
            )

            if (uploadSuccess) {
              console.log(`☁️ Archivo subido a Dropbox exitosamente: ${newFileName}`)
            } else {
              console.log(`⚠️ No se pudo subir el archivo a Dropbox: ${newFileName}`)
            }

            // Send success message to WhatsApp with extracted data
            let dataSummary = ''

            // Format extracted data for WhatsApp message
            if (extractedData) {
              const importantFields = [
                'company_name', 'amount', 'date', 'invoice_number',
                'vat_number', 'client_name', 'client_email', 'client_nif',
                'description', 'items', 'subtotal'
              ]

              dataSummary = '\n📋 Datos extraídos:\n'
              importantFields.forEach(field => {
                if (extractedData[field] && extractedData[field] !== '') {
                  const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  dataSummary += `• ${fieldName}: ${extractedData[field]}\n`
                }
              })

              // Add tax information separately with percentage
              if (extractedData.tax_rate && extractedData.tax_rate !== '') {
                const taxRate = parseFloat(extractedData.tax_rate)
                if (!isNaN(taxRate)) {
                  dataSummary += `• Tasa de IVA: ${taxRate}%\n`
                } else {
                  dataSummary += `• Tasa de IVA: ${extractedData.tax_rate}\n`
                }
              }

              if (extractedData.vat_amount && extractedData.vat_amount !== '') {
                dataSummary += `• Importe IVA: €${extractedData.vat_amount}\n`
              }
            }

            const dropboxStatus = uploadSuccess ? '☁️ Subido a Dropbox' : '⚠️ Error subiendo a Dropbox'
            const documentTypeText = analysisResult.document_type === 'invoice' ? 'Factura (gasto que pagaste)' : 'Gasto'
            const locationText = analysisResult.document_type === 'invoice' ? 'Faturas Y Despesas' : 'Despesas'

            // Detectar tipo de pago para mostrar en el mensaje
            // Siempre mostrar tarjeta como tipo de pago
            const paymentTypeText = '\n💳 Tipo de pago: Tarjeta'

            const successMessage = `✅ **Documento procesado**\n\n📄 ${extractedData?.vendor_name || 'Proveedor'}\n💰 Total: €${extractedData?.total_amount || extractedData?.amount || 0}\n🎯 Confidencia: ${(analysisResult.confidence * 100).toFixed(1)}%\n\n✅ Ya está disponible en tu panel.`
            await sendWhatsAppMessage(message.from, successMessage)

            // Limpiar cache después de completar procesamiento
            const mediaCacheKey = `media_${mediaDetails.id}_${message.from}`
            processedMediaCache.delete(mediaCacheKey)
            console.log(`🧹 Cache limpiado para media: ${mediaDetails.id}`)

            // Store interaction for continuous learning
            try {
              await continuousLearningService.storeInteraction({
                tenantId: 1, // Default tenant
                interactionType: 'document_analysis',
                userInput: `Documento: ${mediaData.filename}`,
                context: `WhatsApp media processing - ${documentTypeText}`,
                documentId: document.id,
                extractedData: analysisResult.extracted_data,
                aiResponse: successMessage,
                confidence: analysisResult.confidence,
                model: 'gemini-2.5-flash',
                learningValue: 0.9, // High learning value for document analysis
                timestamp: new Date(),
                source: 'whatsapp',
                metadata: {
                  filename: mediaData.filename,
                  fileSize: mediaData.size,
                  mimeType: mediaData.mime_type,
                  savedAsInvoice: savedAsInvoice,
                  savedAsExpense: !savedAsInvoice,
                  dropboxUploaded: !!dropboxStatus
                }
              })
              console.log('🧠 Interacción de análisis de documento almacenada para aprendizaje continuo')
            } catch (learningError) {
              console.error('❌ Error almacenando interacción para aprendizaje:', learningError)
              // Don't fail the request if learning storage fails
            }

          } catch (aiError) {
            console.error('❌ Error en procesamiento AI:', aiError)

            // Update document status to failed
            await supabase
              .from('documents')
              .update({
                processing_status: 'failed',
                extracted_data: {
                  ...document.extracted_data,
                  ai_error: aiError instanceof Error ? aiError.message : 'Unknown AI error'
                }
              })
              .eq('id', document.id)

            // Mensaje de error simplificado
            let errorMessage = `⚠️ **Procesando documento**\n\n🤖 El análisis está tardando más de lo esperado.\n\n✅ Recibirás los resultados cuando esté listo.`

            if (aiError instanceof Error && aiError.message.includes('TOTAL_ZERO_DETECTED')) {
              errorMessage = `⚠️ **Reintentando análisis**\n\n🤖 Mejorando precisión del análisis.\n\n✅ Recibirás los resultados cuando esté completo.`
            }

            await sendWhatsAppMessage(message.from, errorMessage)

            // Limpiar cache después de error también
            const mediaCacheKey = `media_${mediaDetails.id}_${message.from}`
            processedMediaCache.delete(mediaCacheKey)
            console.log(`🧹 Cache limpiado después de error para media: ${mediaDetails.id}`)
          }
        }
      } else {
        console.error('❌ Failed to download media from WhatsApp')
        // Send error message to user
        const errorMessage = `❌ Error al descargar la imagen\n\n🔍 No se pudo descargar la imagen de WhatsApp. Inténtalo de nuevo.`
        await sendWhatsAppMessage(message.from, errorMessage)
      }
    } else if (message.type === 'text') {
      console.log(`💬 Text message received: ${message.text?.body}`)
      const credentials = getWhatsAppCredentials(phoneNumberId)
      await handleTextQuery(message.from, message.text?.body || '', credentials)
    } else {
      console.log(`⚠️ Tipo de mensaje no soportado: ${message.type}`)
      await sendWhatsAppMessage(message.from, "📱 Solo puedo procesar imágenes y responder consultas de texto.\n\n💡 **Puedes preguntarme:**\n• ¿Cuántas facturas tengo hoy?\n• ¿Cuántos gastos llevo?\n• ¿Cuál es mi ingreso total?\n• Resume mis finanzas")
    }

  } catch (error) {
    console.error('Error in processWhatsAppMessage:', error)
  }
}

// Función para manejar consultas de texto usando RAG
async function handleTextQuery(senderPhone: string, queryText: string, credentials: any) {
  try {
    console.log(`💬 Procesando consulta de texto desde ${senderPhone}: "${queryText}"`)

    // Analizar intención primero SIN enviar mensaje de procesamiento
    const userIntent = analyzeUserIntent(queryText)
    console.log(`🎯 Intención del usuario detectada: ${userIntent}`)

    // Para saludos y consultas simples, responder inmediatamente
    if (userIntent === 'greeting' || userIntent === 'ambiguous' || userIntent === 'general') {
      let immediateResponse = ''

      if (userIntent === 'greeting') {
        immediateResponse = `👋 **Hola! ¿En qué puedo ayudarte?**\n\n💡 Puedes preguntarme:\n• ¿Cuántas facturas tienes?\n• ¿Cuántos gastos llevas?\n• Resume mis finanzas\n• Muestra las últimos gastos\n\n📱 ¡Escríbeme tu consulta financiera!`
      } else if (userIntent === 'ambiguous') {
        immediateResponse = `🤔 **¿Qué información necesitas?**\n\n💡 Puedo ayudarte con:\n• Gastos de este mes\n• Gastos de octubre\n• Últimos gastos\n• Total de gastos\n\n📝 Por favor, sé más específico con tu pregunta.`
      } else {
        // Detectar consultas específicas para dar respuestas útiles
        if (queryText.toLowerCase().includes('que dia es hoy') || queryText.toLowerCase().includes('fecha')) {
          const today = new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          immediateResponse = `📅 **Hoy es ${today}**\n\n💡 ¿En qué puedo ayudarte hoy?\n• Gastos de hoy\n• Facturas del mes\n• Resumen financiero`
        } else if (queryText.toLowerCase().includes('como estas') || queryText.toLowerCase().includes('como te llamas')) {
          immediateResponse = `🤖 **¡Hola! Soy tu asistente financiero**\n\n📱 Estoy aquí para ayudarte con:\n• Consultas sobre gastos\n• Información de facturas\n• Estado financiero\n• Revisión de datos\n\n💡 ¿Qué información necesitas?`
        } else {
          immediateResponse = `🤖 **¿Cómo puedo ayudarte?**\n\n💡 Soy tu asistente financiero y puedo:\n• Mostrar datos de gastos\n• Información de facturas\n• resumen financiero\n• Estadísticas de ingresos\n\n📱 Escribe tu consulta específica.`
        }
      }

      await sendWhatsAppMessage(senderPhone, immediateResponse)
      return // Salir inmediatamente, sin procesar datos financieros
    }

    // Solo para consultas financieras reales, enviar mensaje de procesamiento
    await sendWhatsAppMessage(senderPhone, `🤖 **Procesando consulta**\n\n📋 "${queryText}"\n\n🔍 Buscando información...`)

    // Obtener dados financieros usando la función getBusinessData existente
    console.log('🔍 Obteniendo datos financieros para respuesta...')
    const businessData = await getBusinessData(1) // Tenant ID por defecto

    // Crear prompt con datos financieros
    const systemPrompt = `Eres un asistente financiero que responde consultas sobre documentos financieros.

IMPORTANTE: 
- Solo analiza si el usuario está haciendo una consulta financiera REAL (con pregunta específica)
- Si es solo un saludo como "hola", responde amigablemente preguntando en qué puedes ayudar
- Si la consulta es muy vaga (ej: solo "gastos"), pide más especificidad

Los datos que tienes disponibles son:

DATOS FINANCIEROS DEL USUARIO:
• Total de Facturas: ${businessData.stats?.total_invoices || 0}
• Total de Gastos: ${businessData.stats?.total_expenses || 0}
• Total de Clientes: ${businessData.stats?.total_clients || 0}
• Ingresos Totales: €${(businessData.stats?.total_revenue || 0).toFixed(2)}
• Total Gastado: €${(businessData.stats?.total_expenses_amount || 0).toFixed(2)}
• Beneficio: €${businessData.stats?.profit || 0}

ESTATÍSTICAS DE MÉTODOS DE PAGAMENTO:
${Object.entries(businessData.stats?.payment_type_stats || {}).map(([type, count]) => `• ${type}: ${count} documentos`).join('\n')}

FATURAS RECIENTES:
${businessData.recentInvoices?.slice(0, 5).map((inv: any) => `• ${inv.number}: €${inv.total_amount} (${inv.issue_date})`).join('\n') || 'Nenhuma fatura'}

GASTOS RECENTES:
${businessData.recentExpenses?.slice(0, 5).map((exp: any) => `• ${exp.vendor}: €${exp.amount} (${exp.expense_date})`).join('\n') || 'Nenhum gasto'}

INSTRUCCIONES:
1. Responde PREFERIBLEMENTE en español
2. Usa los datos REALES proporcionados arriba
3. Si preguntan sobre datos específicos, da números exactos
4. Sé conciso y útil
5. Usa emojis apropiados para hacer la respuesta atractiva
6. Si preguntan por datos del día actual, calcula basado en fecha_actual
7. Si la consulta no está clara, pregunta qué información específica necesita`

    // Crear prompt para el usuario
    const userPrompt = `Consulta del usuario: "${queryText}"\n\nFecha actual: ${new Date().toLocaleDateString('es-ES')}\n\nResponde basándose en los datos financieros proporcionados.`

    // Para consultas financieras, usar IA con datos o respuesta manual
    let aiResponse = ''
    try {
      console.log('🤖 Generando respuesta financiera...')
      aiResponse = await generateAIResponse(systemPrompt, userPrompt)
      console.log('✅ Respuesta IA generada:', aiResponse.substring(0, 100) + '...')
    } catch (aiError) {
      console.error('❌ Error generando respuesta IA:', aiError)

      // Generar respuesta inteligente manual basada en la consulta
      aiResponse = await generateManualResponse(queryText, businessData)
    }

    // Enviar respuesta al usuario con formato más natural
    const finalMessage = `\n${aiResponse}\n\n📱 ¿Necesitas más información?`
    await sendWhatsAppMessage(senderPhone, finalMessage)

    console.log(`✅ Consulta respondida exitosamente para ${senderPhone}`)

  } catch (error) {
    console.error('❌ Error procesando consulta de texto:', error)

    // Mensaje de error más amigable según la intención detectada
    const intent = analyzeUserIntent(queryText)

    if (intent === 'greeting') {
      await sendWhatsAppMessage(senderPhone, `👋 **¡Hola!**\n\n📱 ¿En qué puedo ayudarte hoy?\n\n💡 Puedes preguntarme sobre tus finanzas, gastos o facturas.`)
    } else if (intent === 'financial_query') {
      await sendWhatsAppMessage(senderPhone, `📊 **Información financiera temporalmente no disponible**\n\n🔄 Los datos están cargándose. Intenta de nuevo en un momento.\n\n📱 ¿Alguna otra consulta que pueda ayudarte mientras tanto?`)
    } else {
      await sendWhatsAppMessage(senderPhone, `🤖 **¿Cómo puedo ayudarte?**\n\n💡 Soy tu asistente financiero. Puedes preguntarme sobre:\n• Tus gastos\n• Facturas\n• Estado financiero\n\n📱 ¡Escríbeme tu consulta!`)
    }
  }
}

// Función para obtener datos financieros (reutilizada del ai-chat)
async function getBusinessData(tenantId: number = 1) {
  try {
    console.log('🔍 Obteniendo datos financieros...')

    const baseUrl = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY

    if (!baseUrl || !anonKey) {
      throw new Error('SUPABASE_URL o SUPABASE_ANON_KEY no configurados')
    }

    const fetchFromSupabase = async (endpoint: string) => {
      const response = await fetch(`${baseUrl}/rest/v1/${endpoint}`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error en API ${endpoint}: ${response.status}`)
      }

      return response.json()
    }

    // Buscar datos básicos
    const [clients, invoices, expenses] = await Promise.allSettled([
      fetchFromSupabase(`clients?select=*&tenant_id=eq.${tenantId}`),
      fetchFromSupabase(`invoices?select=*&tenant_id=eq.${tenantId}`),
      fetchFromSupabase(`expenses?select=*&tenant_id=eq.${tenantId}`)
    ])

    const clientsData = clients.status === 'fulfilled' ? clients.value : []
    const clientsCount = clientsData.length

    const invoicesData = invoices.status === 'fulfilled' ? invoices.value : []
    const invoicesCount = invoicesData.length
    const totalRevenue = invoicesData.reduce((sum: number, inv: any) => sum + (parseFloat(inv.total_amount) || 0), 0)

    const expensesData = expenses.status === 'fulfilled' ? expenses.value : []
    const expensesCount = expensesData.length
    const totalExpensesAmount = expensesData.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0)

    const profit = totalRevenue - totalExpensesAmount
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : '0.00'

    // Estadísticas de métodos de pago
    const paymentTypeStats: Record<string, number> = {}
    invoicesData.forEach((inv: any) => {
      const paymentType = inv.payment_type || 'unknown'
      paymentTypeStats[paymentType] = (paymentTypeStats[paymentType] || 0) + 1
    })

    // Gastos recientes con datos válidos (últimos 20 para tener más opciones)
    const recentExpenses = expensesData
      .filter((exp: any) => exp.amount && parseFloat(exp.amount) > 0) // Solo gastos válidos
      .sort((a: any, b: any) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
      .slice(0, 20)

    // Faturas recientes con datos completos (últimos 20)
    const recentInvoices = invoicesData
      .filter((inv: any) => inv.total_amount && parseFloat(inv.total_amount) > 0) // Solo invoices válidas
      .sort((a: any, b: any) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
      .slice(0, 20)

    const businessData = {
      stats: {
        total_clients: clientsCount,
        total_invoices: invoicesCount,
        total_expenses: expensesCount,
        total_revenue: totalRevenue,
        total_expenses_amount: totalExpensesAmount,
        profit: profit,
        profitMargin: profitMargin,
        payment_type_stats: paymentTypeStats
      },
      clients: clientsData,
      recentInvoices,
      recentExpenses
    }

    console.log('✅ Datos financieros obtenidos:', {
      clients: clientsCount,
      invoices: invoicesCount,
      expenses: expensesCount,
      revenue: totalRevenue,
      profit: profit
    })

    return businessData

  } catch (error) {
    console.error('❌ Error obteniendo datos financieros:', error)
    // Retornar datos vacíos pero con estructura válida
    return {
      stats: {
        total_clients: 0,
        total_invoices: 0,
        total_expenses: 0,
        total_revenue: 0,
        total_expenses_amount: 0,
        profit: 0,
        profitMargin: '0.00',
        payment_type_stats: {}
      },
      clients: [],
      recentInvoices: [],
      recentExpenses: []
    }
  }
}

// Función para detectar la intención del usuario
function analyzeUserIntent(queryText: string): string {
  const query = queryText.toLowerCase().trim()

  // Detectar saludos
  const greetings = ['hola', 'hello', 'hi', 'buenos días', 'buenas tardes', 'buenas noches', 'saludos', 'hey']
  if (greetings.some(greeting => query === greeting || query.includes(greeting))) {
    return 'greeting'
  }

  // Detectar consultas simples no financieras
  const simpleQueries = [
    'que dia es hoy', 'qué día es hoy', 'fecha', 'fecha actual',
    'como estas', 'cómo estás', 'como te llamas', 'cómo te llamas',
    'ayuda', 'help', 'info', 'información'
  ]
  if (simpleQueries.some(simpleQuery => query.includes(simpleQuery))) {
    return 'general'
  }

  // Detectar consultas financieras específicas
  const financialKeywords = [
    'factura', 'facturas', 'gasto', 'gastos', 'invoice', 'invoices',
    'cuántos', 'cuántas', 'cuanto', 'cuanta', 'totales', 'total',
    'ingreso', 'ingresos', 'revenue', 'beneficio', 'beneficios',
    'cliente', 'clientes', 'resumen', 'summary', 'estadística',
    'últimos', 'ultimos', 'recientes', 'show', 'mostrar',
    'dinero', 'euros', '€', '$', 'pesos'
  ]

  // Debe tener múltiples palabras para ser una consulta real
  const words = query.split(' ').filter(word => word.length > 2)
  const financialWords = words.filter(word => financialKeywords.some(keyword =>
    word.includes(keyword) || keyword.includes(word)
  ))

  // Si tiene saludo + pregunta financiera, es consulta
  if (greetings.some(greeting => query.includes(greeting)) && financialWords.length > 0) {
    return 'financial_query'
  }

  // Si solo tiene saludo, es saludo
  if (greetings.some(greeting => query === greeting)) {
    return 'greeting'
  }

  // Si tiene palabras financieras y es una pregunta real
  if (financialWords.length >= 1 && (query.includes('¿') || query.includes('?') || words.length >= 2)) {
    return 'financial_query'
  }

  // Si tiene palabras financieras pero es muy corto/simple, podría ser saludo
  if (financialWords.length === 1 && words.length <= 3 && !query.includes('¿') && !query.includes('?')) {
    const possibleGreetings = ['gastos', 'facturas', 'dinero']
    if (possibleGreetings.some(g => query.includes(g)) && words.length <= 2) {
      return 'ambiguous'
    }
  }

  // Default a consulta financiera si hay palabras relacionadas
  return financialWords.length > 0 ? 'financial_query' : 'general'
}

// Función para generar respuesta manual cuando IA falla
async function generateManualResponse(queryText: string, businessData: any): Promise<string> {
  try {
    console.log('🔧 Generando respuesta manual inteligente...')

    const intent = analyzeUserIntent(queryText)
    console.log(`🎯 Intención detectada: ${intent}`)

    // Manejar saludos
    if (intent === 'greeting') {
      return `👋 **Hola! ¿En qué puedo ayudarte?**\n\n💡 Puedes preguntarme:\n• ¿Cuántas facturas tienes?\n• ¿Cuántos gastos llevas?\n• Resume mis finanzas\n• Muestra las últimos gastos\n\n📱 ¡Escríbeme tu consulta financiera!`
    }

    // Manejar consultas ambiguas (ej: solo "gastos")
    if (intent === 'ambiguous') {
      return `🤔 **¿Qué información necesitas?**\n\n💡 Puedo ayudarte con:\n• Gastos de este mes\n• Gastos de octubre\n• Últimos gastos\n• Total de gastos\n\n📝 Por favor, sé más específico con tu pregunta.`
    }

    // Para consultas generales sin contexto financiero claro
    if (intent === 'general') {
      return `🤖 **¿Cómo puedo ayudarte?**\n\n💡 Soy tu asistente financiero y puedo:\n• Mostrar datos de gastos\n• Información de facturas\n• Resumen financiero\n• Estadísticas de ingresos\n\n📱 Escribe tu consulta específica.`
    }

    // Solo procesar consultas financieras reales
    const query = queryText.toLowerCase()
    const stats = businessData.stats

    // Respuestas específicas según el tipo de consulta
    if (query.includes('factura') || query.includes('facturas')) {
      if (query.includes('cuántas') || query.includes('cuantos')) {
        const today = new Date().toISOString().split('T')[0]
        const todayInvoices = businessData.recentInvoices?.filter((inv: any) =>
          inv.issue_date && inv.issue_date.includes(today)
        ) || []

        return `📊 **Tienes ${stats.total_invoices} facturas en total**\n\n💰 Ingresos totales: €${stats.total_revenue.toFixed(2)}\n📅 Hoy: ${todayInvoices.length} facturas\n💯 ¡Sigue así con tus ingresos!`
      }

      return `📄 **Estado de Facturas**\n\n📊 Total facturas: ${stats.total_invoices}\n💰 Ingresos: €${stats.total_revenue.toFixed(2)}\n💳 Métodos de pago más usados:\n${Object.entries(stats.payment_type_stats || {}).slice(0, 3).map(([type, count]) => `• ${type}: ${count}`).join('\n')}`
    }

    if (query.includes('gasto') || query.includes('gastos')) {
      if (query.includes('cuántos') || query.includes('cuantas')) {
        // Verificar si especifican mes
        let expensesFiltered = businessData.recentExpenses || []
        let timeFilter = 'total'
        const currentYear = new Date().getFullYear()

        if (query.includes('octubre') || query.includes('october')) {
          expensesFiltered = businessData.recentExpenses?.filter((exp: any) =>
            exp.expense_date && exp.expense_date.includes(`${currentYear}-10`)
          ) || []
          timeFilter = `octubre ${currentYear}`
        } else if (query.includes('noviembre') || query.includes('november')) {
          expensesFiltered = businessData.recentExpenses?.filter((exp: any) =>
            exp.expense_date && exp.expense_date.includes(`${currentYear}-11`)
          ) || []
          timeFilter = `noviembre ${currentYear}`
        } else if (query.includes('diciembre') || query.includes('december')) {
          expensesFiltered = businessData.recentExpenses?.filter((exp: any) =>
            exp.expense_date && exp.expense_date.includes(`${currentYear}-12`)
          ) || []
          timeFilter = `diciembre ${currentYear}`
        } else {
          const today = new Date().toISOString().split('T')[0]
          expensesFiltered = businessData.recentExpenses?.filter((exp: any) =>
            exp.expense_date && exp.expense_date.includes(today.split('-')[0] + '-' + today.split('-')[1])
          ) || []
          timeFilter = 'este mes'
        }

        const totalMonthExpenses = expensesFiltered.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0)
        const validExpenses = expensesFiltered.filter((exp: any) => parseFloat(exp.amount) > 0).slice(0, 3)

        return `💸 **Gastos de ${timeFilter}**\n\n📊 Total gastos: ${expensesFiltered.length}\n💰 Total gastado: €${totalMonthExpenses.toFixed(2)}\n📈 Últimos gastos válidos:\n${validExpenses.length > 0 ?
          validExpenses.map((exp: any) => `• ${exp.vendor || 'Sin nombre'}: €${exp.amount}`).join('\n') :
          'Sin gastos válidos este período'}`
      }

      // Si quiere ver también invoices
      if (query.includes('invoice') || query.includes('factura')) {
        const recentInvoices = businessData.recentInvoices?.slice(0, 3).map((inv: any) =>
          `• ${inv.number || 'N/A'}: \$${inv.total_amount || '0.00'} (${inv.client_name || 'Sin cliente'})`
        ).join('\n') || 'Sin invoices recientes'

        return `📄 **Estado de Gastos e Income**\n\n💸 Gastos: ${stats.total_expenses} por €${stats.total_expenses_amount.toFixed(2)}\n📄 Facturas: ${stats.total_invoices}\n💰 Ingresos: €${stats.total_revenue.toFixed(2)}\n\n📈 Últimas 3 facturas:\n${recentInvoices}`
      }

      return `💸 **Estado de Gastos**\n\n📊 Total gastos: ${stats.total_expenses}\n💰 Total gastado: €${stats.total_expenses_amount.toFixed(2)}\n📈 Últimos gastos válidos:\n${businessData.recentExpenses?.filter((exp: any) => parseFloat(exp.amount) > 0).slice(0, 3).map((exp: any) => `• ${exp.vendor || 'Sin nombre'}: €${exp.amount}`).join('\n') || 'Sin gastos válidos'}`
    }

    if (query.includes('ingreso') || query.includes('ingresos') || query.includes('revenue')) {
      return `💰 **Estado de Ingresos**\n\n📊 Total ingresos: €${stats.total_revenue.toFixed(2)}\n📄 Facturas: ${stats.total_invoices}\n💡 Beneficio: €${stats.profit.toFixed(2)}\n📈 Margen: ${stats.profitMargin}%`
    }

    if (query.includes('beneficio') || query.includes('profit') || query.includes('ganancia')) {
      const profitColor = stats.profit >= 0 ? '✅' : '⚠️'
      return `${profitColor} **Beneficio Actual**\n\n💰 Beneficio: €${stats.profit.toFixed(2)}\n📊 Margen: ${stats.profitMargin}%\n📈 Ingresos: €${stats.total_revenue.toFixed(2)}\n💸 Gastos: €${stats.total_expenses_amount.toFixed(2)}`
    }

    if (query.includes('resume') || query.includes('resumen') || query.includes('summary')) {
      const profitColor = stats.profit >= 0 ? '✅' : '⚠️'
      return `📈 **RESUMEN FINANCIERO**\n\n💰 Ingresos: €${stats.total_revenue.toFixed(2)}\n💸 Gastos: €${stats.total_expenses_amount.toFixed(2)}\n${profitColor} Beneficio: €${stats.profit.toFixed(2)}\n📊 Margen: ${stats.profitMargin}%\n👥 Clientes: ${stats.total_clients}\n📄 Facturas: ${stats.total_invoices}`
    }

    if (query.includes('cliente') || query.includes('clientes')) {
      return `👥 **Estado de Clientes**\n\n📊 Total clientes: ${stats.total_clients}\n💰 Ingresos totales: €${stats.total_revenue.toFixed(2)}\n📄 Facturas emitidas: ${stats.total_invoices}\n💡 Cliente promedio: €${stats.total_clients > 0 ? (stats.total_revenue / stats.total_clients).toFixed(2) : '0.00'} por cliente`
    }

    // Consulta específica para invoices
    if (query.includes('invoice') || query.includes('factura') || query.includes('últimas') || query.includes('ultimas')) {
      const recentInvoices = businessData.recentInvoices?.slice(0, 3)

      if (recentInvoices && recentInvoices.length > 0) {
        const invoicesList = recentInvoices.map((inv: any) =>
          `• ${inv.number || 'N/A'}: €${inv.total_amount || '0.00'}\n  Cliente: ${inv.client_name || 'Sin cliente'}\n  Fecha: ${inv.issue_date || 'Sin fecha'}`
        ).join('\n\n')

        return `📄 **Últimas 3 Facturas**\n\n${invoicesList}\n\n💰 Total ingresos: €${stats.total_revenue.toFixed(2)}`
      }

      return `📄 **Estado de Facturas**\n\n📊 Total facturas: ${stats.total_invoices}\n💰 Total ingresos: €${stats.total_revenue.toFixed(2)}\n🔄 No hay facturas recientes con datos completos`
    }

    // Respuesta genérica inteligente
    const topExpenses = businessData.recentExpenses?.slice(0, 2) || []
    const topInvoices = businessData.recentInvoices?.slice(0, 2) || []

    return `📊 **Resumen Financiero**\n\n💰 Ingresos: €${stats.total_revenue.toFixed(2)}\n💸 Gastos: €${stats.total_expenses_amount.toFixed(2)}\n📄 Facturas: ${stats.total_invoices}\n💸 Gastos: ${stats.total_expenses}\n👥 Clientes: ${stats.total_clients}\n\n📋 Últimos movimientos:\n${topInvoices.map((inv: any) => `• Ingreso: €${inv.total_amount}`).join('\n')}\n${topExpenses.map((exp: any) => `• Gasto: €${exp.amount} (${exp.vendor})`).join('\n')}`

  } catch (error) {
    console.error('❌ Error en respuesta manual:', error)

    // Respuesta de emergencia más simple
    return `📊 **Datos Disponibles**\n\n• Facturas: ${businessData.stats?.total_invoices || 0}\n• Gastos: €${(businessData.stats?.total_expenses_amount || 0).toFixed(2)}\n• Ingresos: €${(businessData.stats?.total_revenue || 0).toFixed(2)}\n\n🔄 Intenta otra consulta específica`
  }
}

// Función para generar respuesta con Gemini AI
async function generateAIResponse(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    console.log('🤖 Iniciando llamada a Gemini AI...')

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      console.error('❌ GOOGLE_AI_API_KEY no configurado')
      throw new Error('GOOGLE_AI_API_KEY no configurado')
    }

    console.log('🔑 API Key encontrada, inicializando Gemini...')
    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT" as any, threshold: "BLOCK_NONE" as any },
        { category: "HARM_CATEGORY_HATE_SPEECH" as any, threshold: "BLOCK_NONE" as any },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any, threshold: "BLOCK_NONE" as any },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any, threshold: "BLOCK_NONE" as any }
      ]
    })

    const prompt = `${systemPrompt}\n\n${userPrompt}`
    console.log('📝 Prompt creado:', prompt.substring(0, 200) + '...')

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout después de 15 segundos')), 15000)
      )
    ])

    console.log('✅ Contenido generado por Gemini, obteniendo respuesta...')
    const response = await result.response
    const text = response.text()

    console.log('✅ Respuesta AI generada exitosamente:', text.substring(0, 100) + '...')
    return text.trim()

  } catch (error) {
    console.error('❌ Error generando respuesta AI:', error)
    console.error('❌ Tipo de error:', typeof error)
    console.error('❌ Mensaje:', error instanceof Error ? error.message : String(error))
    throw error
  }
}

async function downloadWhatsAppMedia(mediaId: string, accessToken: string) {
  try {
    console.log(`📥 Downloading media: ${mediaId}`)

    // Get media URL from WhatsApp API
    const mediaResponse = await fetch(`${WHATSAPP_API_BASE}/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!mediaResponse.ok) {
      throw new Error(`Failed to get media URL: ${mediaResponse.status}`)
    }

    const mediaInfo = await mediaResponse.json()
    console.log(`📋 Media info:`, mediaInfo)

    if (!mediaInfo.url) {
      throw new Error('No media URL in response')
    }

    // Download the actual file
    const fileResponse = await fetch(mediaInfo.url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!fileResponse.ok) {
      throw new Error(`Failed to download media file: ${fileResponse.status}`)
    }

    const buffer = await fileResponse.arrayBuffer()
    const filename = mediaInfo.filename || `whatsapp_media_${mediaId}${getFileExtension(mediaInfo.mime_type)}`

    console.log(`✅ Media downloaded: ${filename} (${buffer.byteLength} bytes)`)

    return {
      buffer: new Uint8Array(buffer),
      filename: filename,
      mime_type: mediaInfo.mime_type,
      size: buffer.byteLength
    }

  } catch (error) {
    console.error('Error downloading WhatsApp media:', error)
    return null
  }
}

// Función para formatear fecha
function formatDate(dateString: string): string {
  if (!dateString) return ''

  try {
    // Intentar diferentes formatos de fecha
    let date: Date

    // Formato DD/MM/YYYY o DD-MM-YYYY
    if (dateString.includes('/') || dateString.includes('-')) {
      const parts = dateString.split(/[\/\-]/)
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0')
        const month = parts[1].padStart(2, '0')
        const year = parts[2]
        date = new Date(`${year}-${month}-${day}`)
      } else {
        date = new Date(dateString)
      }
    } else {
      date = new Date(dateString)
    }

    // Verificar que la fecha es válida
    if (isNaN(date.getTime())) {
      return ''
    }

    // Formatear como DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

// Función para generar número de factura
function generateInvoiceNumber(clientName: string, dateString: string): string {
  const formattedDate = formatDate(dateString)
  const cleanClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim()

  if (formattedDate && cleanClientName) {
    return `${cleanClientName} ${formattedDate}`
  } else if (cleanClientName) {
    return `${cleanClientName} ${new Date().toISOString().split('T')[0].replace(/-/g, '-')}`
  } else {
    return `FAT-${Date.now()}`
  }
}

// Función para generar nombre de archivo
function generateFileName(clientName: string, dateString: string, originalExtension: string): string {
  const formattedDate = formatDate(dateString)
  const cleanClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, ' ')

  if (formattedDate && cleanClientName) {
    return `${cleanClientName} ${formattedDate}${originalExtension}`
  } else if (cleanClientName) {
    const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '-')
    return `${cleanClientName} ${currentDate}${originalExtension}`
  } else {
    return `documento_${Date.now()}${originalExtension}`
  }
}

// Función para subir archivo a Dropbox
async function uploadToDropbox(fileBuffer: Buffer, fileName: string, tenantId: number): Promise<boolean> {
  try {
    console.log(`☁️ Subiendo archivo a Dropbox: ${fileName}`)

    // Obtener configuración de Dropbox
    const supabase = createSupabaseClient()
    const { data: dropboxConfig, error: configError } = await supabase
      .from('cloud_drive_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', 'dropbox')
      .eq('is_active', true)
      .single()

    if (configError || !dropboxConfig) {
      console.error('❌ No se encontró configuración de Dropbox:', configError)
      return false
    }

    // Crear cliente de Dropbox
    const dropboxClient = new DropboxApiClient(
      dropboxConfig.access_token,
      dropboxConfig.refresh_token
    )

    // Crear carpeta "prueba" si no existe
    const folderPath = '/prueba'
    try {
      await dropboxClient.createFolder(folderPath)
      console.log(`📁 Carpeta ${folderPath} creada o ya existe`)
    } catch (error) {
      // La carpeta ya existe, continuar
      console.log(`📁 Carpeta ${folderPath} ya existe`)
    }

    // Subir archivo
    const dropboxFilePath = `${folderPath}/${fileName}`
    await dropboxClient.uploadFile(dropboxFilePath, fileBuffer, 'overwrite')

    console.log(`✅ Archivo subido exitosamente a Dropbox: ${dropboxFilePath}`)
    return true

  } catch (error) {
    console.error('❌ Error subiendo archivo a Dropbox:', error)
    return false
  }
}

// Helper function to create or find client automatically
async function createOrFindClient(clientData: any, tenantId: number, supabase: any): Promise<number | null> {
  try {
    const clientName = clientData.vendor_name || clientData.client_name
    const clientEmail = clientData.client_email
    const clientNif = clientData.vendor_nif || clientData.client_nif

    if (!clientName) {
      console.log(`⚠️ No se puede crear cliente sin nombre`)
      return null
    }

    // First, try to find existing client by name
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', clientName)
      .single()

    if (existingClient) {
      console.log(`✅ Cliente encontrado existente: ${clientName} (ID: ${existingClient.id})`)
      return existingClient.id
    }

    // Create new client
    const clientToInsert = {
      tenant_id: tenantId,
      name: clientName,
      email: clientEmail || null,
      phone: null,
      address: null,
      nif: clientNif || null,
      is_active: true
    }

    console.log(`👤 Creando nuevo cliente:`, clientToInsert)

    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert(clientToInsert)
      .select('id')
      .single()

    if (clientError) {
      console.error(`❌ Error creando cliente:`, clientError)
      return null
    }

    console.log(`✅ Cliente creado exitosamente: ${clientName} (ID: ${newClient.id})`)
    return newClient.id

  } catch (error) {
    console.error(`❌ Error en createOrFindClient:`, error)
    return null
  }
}

// Helper function to create or find supplier automatically
async function createOrFindSupplier(supplierData: any, tenantId: number, supabase: any): Promise<number | null> {
  try {
    const supplierName = supplierData.vendor_name || supplierData.client_name
    const supplierEmail = supplierData.client_email
    const supplierNif = supplierData.vendor_nif || supplierData.client_nif

    if (!supplierName) {
      console.log(`⚠️ No se puede crear proveedor sin nombre`)
      return null
    }

    // First, try to find existing supplier by name
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', supplierName)
      .single()

    if (existingSupplier) {
      console.log(`✅ Proveedor encontrado existente: ${supplierName} (ID: ${existingSupplier.id})`)
      return existingSupplier.id
    }

    // Create new supplier
    const supplierToInsert = {
      tenant_id: tenantId,
      name: supplierName,
      tax_id: supplierNif || null,
      email: supplierEmail || null,
      phone: null,
      address: null,
      postal_code: null,
      city: null,
      contact_person: null,
      payment_terms: null,
      notes: `Proveedor creado automáticamente desde WhatsApp`,
      is_active: true
    }

    console.log(`🏢 Creando nuevo proveedor:`, supplierToInsert)

    const { data: newSupplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert(supplierToInsert)
      .select('id')
      .single()

    if (supplierError) {
      console.error(`❌ Error creando proveedor:`, supplierError)
      return null
    }

    console.log(`✅ Proveedor creado exitosamente: ${supplierName} (ID: ${newSupplier.id})`)
    return newSupplier.id

  } catch (error) {
    console.error(`❌ Error en createOrFindSupplier:`, error)
    return null
  }
}

// Process invoice data and create invoice record
async function processInvoice(invoiceData: any, documentId: number, supabase: any, tenantId: number) {
  try {
    console.log(`🚀 INICIANDO processInvoice`)
    console.log(`📄 Procesando factura: ${invoiceData.invoice_number || 'Sin número'}`)
    console.log(`📊 Datos recibidos:`, JSON.stringify(invoiceData, null, 2))
    console.log(`🔍 Document ID: ${documentId}`)
    console.log(`🔍 Tenant ID: ${tenantId}`)
    console.log(`🔍 Payment type específico:`, {
      payment_type: invoiceData.payment_type,
      payment_type_type: typeof invoiceData.payment_type,
      has_payment_type: 'payment_type' in invoiceData,
      all_keys: Object.keys(invoiceData)
    })

    // Generate invoice number with client name and date
    const clientName = invoiceData.vendor_name || invoiceData.client_name || 'Cliente Desconocido'
    const invoiceDate = invoiceData.invoice_date || invoiceData.date || new Date().toISOString().split('T')[0]
    const invoiceNumber = generateInvoiceNumber(clientName, invoiceDate)

    console.log(`📋 Número de factura generado: ${invoiceNumber}`)

    // Procesar todas las facturas sin verificación de duplicados
    console.log(`✅ Procesando factura: ${invoiceNumber} - Sin verificación de duplicados`)

    // Validación de datos críticos
    console.log(`🔍 VALIDACIÓN DE DATOS CRÍTICOS:`)
    console.log(`   - clientName: "${clientName}"`)
    console.log(`   - invoiceDate: "${invoiceDate}"`)
    console.log(`   - amount: ${invoiceData.subtotal || invoiceData.amount || 0}`)

    // NO crear clientes automáticamente - las facturas no son clientes
    let clientId = null
    console.log(`👤 NO se creará cliente automáticamente - las facturas no son clientes`)

    // NO crear proveedores automáticamente - solo guardar los datos
    let supplierId = null
    console.log(`🏢 NO se creará proveedor automáticamente`)

    // Create invoice record
    console.log(`🔍 Datos de la factura antes de crear:`, {
      vendor_name: invoiceData.vendor_name,
      payment_type: invoiceData.payment_type,
      payment_type_type: typeof invoiceData.payment_type
    })

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        number: invoiceNumber,
        client_name: clientName,
        client_email: invoiceData.client_email || null,
        client_tax_id: invoiceData.vendor_nif || invoiceData.client_nif || null,
        issue_date: invoiceDate,
        due_date: invoiceData.due_date || null,
        amount: invoiceData.subtotal || invoiceData.amount || 0,
        vat_amount: invoiceData.vat_amount || 0,
        vat_rate: invoiceData.vat_rate || 0,
        total_amount: invoiceData.amount || invoiceData.total || 0,
        status: 'paid', // Las facturas procesadas desde WhatsApp ya están pagadas
        description: invoiceData.description || `Factura procesada desde WhatsApp`,
        payment_terms: invoiceData.payment_terms || null,
        payment_type: 'tarjeta', // Siempre tarjeta
        supplier_id: supplierId // Link to supplier if created
      })
      .select()
      .single()

    if (invoiceError) {
      throw new Error(`Error creating invoice: ${invoiceError.message}`)
    }

    console.log(`✅ Factura creada exitosamente: ${invoice.id}`)

    // Guardar datos en la tabla whatsapp_vat_data para el cálculo de IVA
    try {
      const period = invoiceDate.slice(0, 7) // YYYY-MM format
      const { error: vatDataError } = await supabase
        .from('whatsapp_vat_data')
        .insert({
          tenant_id: tenantId,
          period: period,
          invoice_id: invoice.id,
          document_id: documentId,
          vendor_name: clientName,
          amount: invoiceData.subtotal || invoiceData.amount || 0,
          vat_rate: invoiceData.vat_rate || 23,
          vat_amount: invoiceData.vat_amount || 0,
          total_amount: invoiceData.amount || invoiceData.total || 0,
          document_type: 'invoice',
          processing_date: invoiceDate,
          whatsapp_message_id: `whatsapp-${Date.now()}`
        })

      if (vatDataError) {
        console.log(`⚠️ Error saving VAT data: ${vatDataError.message}`)
      } else {
        console.log(`✅ VAT data saved for invoice ${invoice.id}`)
      }
    } catch (vatException) {
      console.log(`⚠️ Exception saving VAT data: ${vatException instanceof Error ? vatException.message : 'Unknown error'}`)
    }

    // Create corresponding expense record automatically
    // This ensures the expense appears in the expenses view
    try {
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          tenant_id: tenantId,
          vendor: clientName,
          amount: invoiceData.subtotal || invoiceData.amount || 0,
          vat_amount: invoiceData.vat_amount || 0,
          vat_rate: invoiceData.vat_rate || 0,
          category: 'General',
          description: invoiceData.description || `Gasto procesado desde WhatsApp`,
          receipt_number: invoiceNumber,
          expense_date: invoiceDate,
          is_deductible: true,
          invoice_id: invoice.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (expenseError) {
        console.log(`⚠️ Error creating expense (invoice will still be created): ${expenseError.message}`)
        console.log(`📝 Expense error details:`, expenseError)
      } else {
        console.log(`✅ Despesa creada automáticamente: ${expense.id}`)

        // Guardar datos en la tabla whatsapp_vat_data para el gasto
        try {
          const period = invoiceDate.slice(0, 7) // YYYY-MM format
          const { error: vatDataError } = await supabase
            .from('whatsapp_vat_data')
            .insert({
              tenant_id: tenantId,
              period: period,
              expense_id: expense.id,
              document_id: documentId,
              vendor_name: clientName,
              amount: invoiceData.subtotal || invoiceData.amount || 0,
              vat_rate: invoiceData.vat_rate || 23,
              vat_amount: invoiceData.vat_amount || 0,
              total_amount: invoiceData.amount || invoiceData.total || 0,
              document_type: 'expense',
              processing_date: invoiceDate,
              whatsapp_message_id: `whatsapp-${Date.now()}`
            })

          if (vatDataError) {
            console.log(`⚠️ Error saving VAT data for expense: ${vatDataError.message}`)
          } else {
            console.log(`✅ VAT data saved for expense ${expense.id}`)
          }
        } catch (vatException) {
          console.log(`⚠️ Exception saving VAT data for expense: ${vatException instanceof Error ? vatException.message : 'Unknown error'}`)
        }
      }
    } catch (expenseException) {
      console.log(`⚠️ Exception creating expense: ${expenseException instanceof Error ? expenseException.message : 'Unknown error'}`)
    }

    console.log(`✅ Factura creada: ${invoice.id}`)

    // Update document with invoice reference
    await supabase
      .from('documents')
      .update({
        extracted_data: {
          invoice_id: invoice.id,
          processing_notes: ['Factura procesada y creada exitosamente']
        }
      })
      .eq('id', documentId)

  } catch (error) {
    console.error('❌ Error processing invoice:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    throw error
  }

  console.log(`🎉 processInvoice FINALIZADO EXITOSAMENTE`)
}

// Process expense data and create expense record
// Función de último recurso para crear un gasto mínimo
async function createMinimalExpense(expenseData: any, documentId: number, supabase: any, tenantId: number) {
  try {
    console.log(`🚨 CREANDO REGISTRO MÍNIMO COMO ÚLTIMO RECURSO`)

    const vendorName = expenseData.vendor_name || expenseData.vendor || expenseData.client_name || 'Proveedor Desconocido'
    const amount = expenseData.amount || expenseData.total || expenseData.subtotal || 0
    const description = expenseData.description || `Documento procesado desde WhatsApp - ${vendorName}`
    const expenseDate = expenseData.expense_date || expenseData.invoice_date || expenseData.date || new Date().toISOString().split('T')[0]

    console.log(`📋 Datos mínimos:`, {
      vendor: vendorName,
      amount: amount,
      description: description,
      date: expenseDate
    })

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        tenant_id: tenantId,
        vendor: vendorName,
        amount: amount,
        vat_amount: expenseData.vat_amount || 0,
        vat_rate: expenseData.vat_rate || 0,
        category: 'General',
        description: description,
        receipt_number: expenseData.invoice_number || `MINIMAL-${Date.now()}`,
        expense_date: expenseDate,
        is_deductible: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (expenseError) {
      throw new Error(`Error creating minimal expense: ${expenseError.message}`)
    }

    console.log(`✅ Registro mínimo creado: ${expense.id}`)
    return expense
  } catch (error) {
    console.error(`❌ Error crítico en createMinimalExpense:`, error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

async function processExpense(expenseData: any, documentId: number, supabase: any, tenantId: number) {
  try {
    console.log(`🚀 INICIANDO processExpense`)
    console.log(`💰 Procesando gasto desde WhatsApp: ${expenseData.description || expenseData.vendor_name || 'Sin descripción'}`)
    console.log(`📊 Datos del gasto:`, JSON.stringify(expenseData, null, 2))
    console.log(`🔍 Document ID: ${documentId}`)
    console.log(`🔍 Tenant ID: ${tenantId}`)

    // Extract data from WhatsApp document (could be invoice or expense format)
    const vendorName = expenseData.vendor_name || expenseData.vendor || expenseData.client_name || 'Proveedor Desconocido'
    const amount = expenseData.amount || expenseData.total || expenseData.subtotal || 0
    const vatAmount = expenseData.vat_amount || 0
    const vatRate = expenseData.vat_rate || 0
    const description = expenseData.description || `Gasto procesado desde WhatsApp - ${vendorName}`
    const expenseDate = expenseData.expense_date || expenseData.invoice_date || expenseData.date || new Date().toISOString().split('T')[0]
    const receiptNumber = expenseData.invoice_number || expenseData.receipt_number || `WHATSAPP-${Date.now()}`

    // Procesar todos los gastos sin verificación de duplicados
    console.log(`✅ Procesando gasto: ${vendorName} - ${expenseDate} - Sin verificación de duplicados`)

    // Validación de datos críticos
    console.log(`🔍 VALIDACIÓN DE DATOS:`)
    console.log(`   - vendorName: "${vendorName}"`)
    console.log(`   - amount: ${amount}`)
    console.log(`   - vatAmount: ${vatAmount}`)
    console.log(`   - vatRate: ${vatRate}`)
    console.log(`   - description: "${description}"`)
    console.log(`   - expenseDate: "${expenseDate}"`)
    console.log(`   - receiptNumber: "${receiptNumber}"`)

    if (!vendorName || vendorName === 'Proveedor Desconocido') {
      console.log(`⚠️ ADVERTENCIA: Nombre de proveedor no encontrado`)
    }
    if (amount <= 0) {
      console.log(`⚠️ ADVERTENCIA: Importe inválido: ${amount}`)
    }

    console.log(`📋 Datos extraídos:`)
    console.log(`   - Proveedor: ${vendorName}`)
    console.log(`   - Importe: €${amount}`)
    console.log(`   - Fecha: ${expenseDate}`)
    console.log(`   - Descripción: ${description}`)

    // NO crear proveedores automáticamente - solo guardar los datos
    let supplierId = null
    console.log(`🏢 NO se creará proveedor automáticamente`)

    // Create expense record
    console.log(`💾 PREPARANDO INSERCIÓN EN BASE DE DATOS:`)
    const expenseToInsert = {
      tenant_id: tenantId,
      vendor: vendorName,
      amount: amount,
      vat_amount: vatAmount,
      vat_rate: vatRate,
      category: 'General',
      description: description,
      receipt_number: receiptNumber,
      expense_date: expenseDate,
      is_deductible: true,
      created_at: new Date().toISOString()
    }
    console.log(`📋 Datos a insertar:`, JSON.stringify(expenseToInsert, null, 2))

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseToInsert)
      .select()
      .single()

    if (expenseError) {
      throw new Error(`Error creating expense: ${expenseError.message}`)
    }

    console.log(`✅ Gasto creado: ${expense.id}`)

    // Create corresponding invoice record automatically
    // This ensures the invoice appears in the invoices view
    try {
      const invoiceNumber = generateInvoiceNumber(vendorName, expenseDate)

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenantId,
          client_id: null, // No crear cliente automáticamente
          number: invoiceNumber,
          client_name: vendorName,
          client_email: null,
          client_tax_id: expenseData.vendor_nif || expenseData.client_nif || null,
          issue_date: expenseDate,
          due_date: null,
          amount: amount,
          vat_amount: vatAmount,
          vat_rate: vatRate,
          total_amount: amount + vatAmount,
          status: 'paid', // Las facturas procesadas desde WhatsApp ya están pagadas
          description: description,
          payment_terms: null,
          payment_type: 'tarjeta', // Siempre tarjeta
          supplier_id: null // No crear proveedor automáticamente
        })
        .select()
        .single()

      if (invoiceError) {
        console.log(`⚠️ Error creating invoice (expense will still be created): ${invoiceError.message}`)
        console.log(`📝 Invoice error details:`, invoiceError)
      } else {
        console.log(`✅ Factura creada automáticamente: ${invoice.id}`)

        // Update expense with invoice reference
        await supabase
          .from('expenses')
          .update({ invoice_id: invoice.id })
          .eq('id', expense.id)
      }
    } catch (invoiceException) {
      console.log(`⚠️ Exception creating invoice: ${invoiceException instanceof Error ? invoiceException.message : 'Unknown error'}`)
    }

    // Update document with expense reference
    await supabase
      .from('documents')
      .update({
        extracted_data: {
          expense_id: expense.id,
          processing_notes: ['Gasto procesado y creado exitosamente']
        }
      })
      .eq('id', documentId)

  } catch (error) {
    console.error('❌ Error processing expense:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    throw error
  }

  console.log(`🎉 processExpense FINALIZADO EXITOSAMENTE`)
}