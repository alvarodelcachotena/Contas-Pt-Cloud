import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

// Cache simple en memoria para media IDs procesados
const processedMediaIds = new Set<string>()

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
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const credentials = getWhatsAppCredentials()
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

// Get WhatsApp credentials from environment variables
function getWhatsAppCredentials() {
  // Debug: Log all environment variables
  console.log('🔍 Environment variables:')
  console.log('  - WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_BUSINESS_ACCOUNT_ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_APP_ID:', process.env.WHATSAPP_APP_ID ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_APP_SECRET:', process.env.WHATSAPP_APP_SECRET ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_VERIFY_TOKEN:', process.env.WHATSAPP_VERIFY_TOKEN ? '✅ Set' : '❌ Not set')
  console.log('  - WHATSAPP_WEBHOOK_URL:', process.env.WHATSAPP_WEBHOOK_URL ? '✅ Set' : '❌ Not set')

  // Debug: Show actual verify token value
  console.log('  - Verify Token value:', process.env.WHATSAPP_VERIFY_TOKEN)

  // Configuración simplificada para solo el número principal
  const credentials = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
    appId: process.env.WHATSAPP_APP_ID!,
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
    webhookUrl: process.env.WHATSAPP_WEBHOOK_URL!,
    displayNumber: '+34613881071'
  }

  console.log(`📱 Usando configuración principal: ${credentials.displayNumber}`)
  return credentials
}

// WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const credentials = getWhatsAppCredentials()
  const expectedToken = credentials.verifyToken

  // Debug: Log the tokens to see what's happening
  console.log('🔍 Debug webhook verification:')
  console.log('  - Mode:', mode)
  console.log('  - Received token:', token)
  console.log('  - Expected token:', expectedToken)
  console.log('  - Tokens match:', mode === 'subscribe' && token === expectedToken)

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ WhatsApp webhook verified successfully')
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  } else {
    console.error('❌ WhatsApp webhook verification failed')
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

    // Solo número principal autorizado (con y sin prefijo +)
    const authorizedNumbers = [
      '+34613881071', // Número principal con prefijo
      '34613881071'   // Número principal sin prefijo
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

    // Check if message contains media
    if (message.type === 'image' || message.type === 'document' || message.type === 'audio' || message.type === 'video') {
      console.log(`📎 Media message detected: ${message.type}`)

      const credentials = getWhatsAppCredentials()

      // Get media details
      const mediaDetails = message[message.type as keyof WhatsAppMessage] as any
      if (!mediaDetails?.id) {
        console.error('❌ No media ID found in message')
        return
      }

      // Verificar si este media ID ya fue procesado (cache simple en memoria)
      if (processedMediaIds.has(mediaDetails.id)) {
        console.log(`⚠️ MEDIA YA PROCESADO: ${mediaDetails.id} - Saltando procesamiento`)
        await sendWhatsAppMessage(message.from, `📄 **Imagen ya procesada**\n\nEsta imagen ya fue analizada anteriormente.\n\n✅ No se realizará un nuevo análisis.`)
        return
      }

      // Marcar como procesado antes de continuar
      processedMediaIds.add(mediaDetails.id)
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
          const initialMessage = `📥 Imagen recibida y procesando...\n\n📄 Archivo: ${mediaData.filename}\n📏 Tamaño: ${(mediaData.size / 1024).toFixed(1)} KB\n🤖 Analizando con IA...\n\nTe avisaré cuando esté listo.`
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

            const successMessage = `✅ Documento procesado exitosamente!\n\n📄 Tipo: ${documentTypeText}\n🎯 Confianza: ${(analysisResult.confidence * 100).toFixed(1)}%\n📊 Datos extraídos: ${Object.keys(analysisResult.extracted_data).length} campos${dataSummary}${paymentTypeText}\n💰 Guardado en ${locationText} (no se creó cliente)\n\n${dropboxStatus}\nEl documento aparecerá en la sección correspondiente.`
            await sendWhatsAppMessage(message.from, successMessage)

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

            // Send error message to WhatsApp
            const errorMessage = `❌ Error al procesar el documento\n\n🔍 Error: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}\n\nEl documento se guardó pero no se pudo analizar. Revisa los logs para más detalles.`
            await sendWhatsAppMessage(message.from, errorMessage)
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
      // Handle text messages if needed
    }

  } catch (error) {
    console.error('Error in processWhatsAppMessage:', error)
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