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

// Función de verificación de API key
function verifyApiKey() {
  const apiKey = process.env.OPENAI_API_KEY
  console.log('🔑 Verificando API key de OpenAI...')
  console.log(`   API key configurada: ${apiKey ? '✅ Sí' : '❌ No'}`)
  if (apiKey) {
    console.log(`   Longitud: ${apiKey.length} caracteres`)
    console.log(`   Empieza con: ${apiKey.substring(0, 10)}...`)
    console.log(`   Termina con: ...${apiKey.substring(apiKey.length - 10)}`)
    console.log(`   Formato correcto: ${apiKey.startsWith('sk-') ? '✅' : '❌'}`)
  }
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada')
  }
  return true
}

// Función para enviar mensajes de WhatsApp
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const credentials = getWhatsAppCredentials()
    console.log('📤 Enviando mensaje a WhatsApp:', { phoneNumber, messageLength: message.length })

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
        error: errorData
      })
      return false
    }

    console.log(`✅ Mensaje enviado exitosamente a ${phoneNumber}`)
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

  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
    appId: process.env.WHATSAPP_APP_ID!,
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
    webhookUrl: process.env.WHATSAPP_WEBHOOK_URL!
  }
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

    // Check if message contains media
    if (message.type === 'image' || message.type === 'document' || message.type === 'audio' || message.type === 'video') {
      console.log(`📎 Media message detected: ${message.type}`)

      const supabase = createSupabaseClient()
      const credentials = getWhatsAppCredentials()

      // For now, use tenant ID 1 (you can map phone numbers to tenants later)
      const tenantId = 1

      // Get media details
      const mediaDetails = message[message.type as keyof WhatsAppMessage] as any
      if (!mediaDetails?.id) {
        console.error('❌ No media ID found in message')
        return
      }

      // Download media from WhatsApp
      const mediaData = await downloadWhatsAppMedia(mediaDetails.id, credentials.accessToken)

      if (mediaData) {
        console.log(`🔄 Processing media file: ${mediaData.filename}`)

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
            const aiService = new DocumentAIService()
            const analysisResult = await aiService.analyzeDocument(
              Buffer.from(mediaData.buffer),
              mediaData.filename
            )

            console.log(`📊 Resultado del análisis:`, analysisResult)

            // Update document with AI analysis results
            await supabase
              .from('documents')
              .update({
                processing_status: 'completed',
                confidence_score: analysisResult.confidence,
                extracted_data: {
                  ...document.extracted_data,
                  ai_analysis: analysisResult,
                  processed_at: new Date().toISOString()
                }
              })
              .eq('id', document.id)

            // Process based on document type
            if (analysisResult.document_type === 'invoice') {
              await processInvoice(analysisResult.extracted_data, document.id, supabase, tenantId)
            } else if (analysisResult.document_type === 'expense') {
              await processExpense(analysisResult.extracted_data, document.id, supabase, tenantId)
            }

            console.log(`✅ Document processing completed with AI: ${document.id}`)

            // Send success message to WhatsApp with extracted data
            const extractedData = analysisResult.extracted_data
            let dataSummary = ''

            // Format extracted data for WhatsApp message
            if (extractedData) {
              const importantFields = [
                'company_name', 'total_amount', 'date', 'invoice_number',
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

            const successMessage = `✅ Documento procesado exitosamente!\n\n📄 Tipo: ${analysisResult.document_type}\n🎯 Confianza: ${(analysisResult.confidence * 100).toFixed(1)}%\n📊 Datos extraídos: ${Object.keys(analysisResult.extracted_data).length} campos${dataSummary}\n\nEl documento aparecerá en tu aplicación.`
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

// Process invoice data and create invoice record
async function processInvoice(invoiceData: any, documentId: number, supabase: any, tenantId: number) {
  try {
    console.log(`📄 Procesando factura: ${invoiceData.invoice_number || 'Sin número'}`)
    console.log(`📊 Datos recibidos:`, JSON.stringify(invoiceData, null, 2))

    // Create or find client
    let clientId = null
    if (invoiceData.vendor_nif || invoiceData.client_nif) {
      const nifToSearch = invoiceData.vendor_nif || invoiceData.client_nif
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('nif', nifToSearch)
        .single()

      if (existingClient) {
        clientId = existingClient.id
        console.log(`👤 Cliente existente encontrado: ${clientId}`)
      } else {
        // Create new client
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            tenant_id: tenantId,
            name: invoiceData.vendor_name || invoiceData.client_name || 'Cliente Desconocido',
            nif: nifToSearch,
            address: invoiceData.vendor_address || invoiceData.client_address || null,
            email: invoiceData.client_email || null
          })
          .select()
          .single()

        if (newClient) {
          clientId = newClient.id
          console.log(`✅ Nuevo cliente creado: ${clientId}`)
        }
      }
    }

    // Generate invoice number with client name and date
    const clientName = invoiceData.vendor_name || invoiceData.client_name || 'Cliente Desconocido'
    const invoiceDate = invoiceData.invoice_date || invoiceData.date || new Date().toISOString().split('T')[0]
    const invoiceNumber = generateInvoiceNumber(clientName, invoiceDate)

    console.log(`📋 Número de factura generado: ${invoiceNumber}`)

    // Create invoice record
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
        total_amount: invoiceData.total_amount || invoiceData.total || 0,
        status: 'pending',
        description: invoiceData.description || `Factura procesada desde WhatsApp`,
        payment_terms: invoiceData.payment_terms || null
      })
      .select()
      .single()

    if (invoiceError) {
      throw new Error(`Error creating invoice: ${invoiceError.message}`)
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
    throw error
  }
}

// Process expense data and create expense record
async function processExpense(expenseData: any, documentId: number, supabase: any, tenantId: number) {
  try {
    console.log(`💰 Procesando gasto: ${expenseData.description}`)

    // Create expense record
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        tenant_id: tenantId,
        vendor: expenseData.vendor,
        amount: expenseData.amount,
        vat_amount: expenseData.vat_amount,
        vat_rate: expenseData.vat_rate,
        category: expenseData.category,
        description: expenseData.description,
        receipt_number: expenseData.receipt_number,
        expense_date: expenseData.expense_date,
        is_deductible: expenseData.is_deductible,
        processing_method: 'whatsapp_ai'
      })
      .select()
      .single()

    if (expenseError) {
      throw new Error(`Error creating expense: ${expenseError.message}`)
    }

    console.log(`✅ Gasto creado: ${expense.id}`)

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
    throw error
  }
}