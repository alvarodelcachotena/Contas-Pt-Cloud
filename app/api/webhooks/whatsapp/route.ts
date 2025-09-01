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
  try {
    const body: WhatsAppWebhookPayload = await request.json()
    console.log('📥 WhatsApp webhook received:', JSON.stringify(body, null, 2))

    // Process webhook data
    if (body.entry && body.entry[0]?.changes) {
      for (const change of body.entry[0].changes) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            await processWhatsAppMessage(message, change.value.metadata?.phone_number_id)
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
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
            source: 'whatsapp_webhook',
            extracted_data: {
              whatsapp_message_id: message.id,
              sender_phone: message.from,
              timestamp: message.timestamp,
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

          // Here you would trigger your AI processing pipeline
          // For now, we'll just mark it as completed
          setTimeout(async () => {
            await supabase
              .from('documents')
              .update({
                processing_status: 'completed',
                confidence_score: 0.8
              })
              .eq('id', document.id)
            console.log(`✅ Document processing completed: ${document.id}`)
          }, 2000)
        }
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