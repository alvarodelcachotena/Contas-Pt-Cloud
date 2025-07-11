import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'
import { getWhatsAppCredentials } from '../../../../lib/webhook-credentials'
import { getTenantId } from '../../../../lib/tenant-utils'

loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // For development, accept any verify token
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'your-verify-token'

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
    const body = await request.json()
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

async function processWhatsAppMessage(message: any, phoneNumberId?: string) {
  try {
    console.log(`📱 Processing WhatsApp message: ${message.id}`)

    // Check if message contains media (image, document)
    if (message.type === 'image' || message.type === 'document') {
      console.log(`📎 Media message detected: ${message.type}`)
      
      const supabase = createSupabaseClient()
      
      // For demo purposes, we'll use tenant ID 1
      // In production, you'd need to map phone numbers to tenants
      const tenantId = 1
      
      // Get WhatsApp credentials for this tenant
      const credentials = await getWhatsAppCredentials(tenantId)
      
      if (!credentials.accessToken) {
        console.error('❌ No WhatsApp credentials found for tenant')
        return
      }

      // Download media from WhatsApp
      const mediaId = message[message.type]?.id
      if (mediaId) {
        const mediaData = await downloadWhatsAppMedia(mediaId, credentials.accessToken)
        
        if (mediaData) {
          // Process the document using your AI extraction pipeline
          console.log(`🔄 Processing media file: ${mediaData.filename}`)
          
          // Create document record
          const { data: document } = await supabase
            .from('documents')
            .insert({
              tenant_id: tenantId,
              filename: mediaData.filename || `whatsapp_${message.id}`,
              original_filename: mediaData.filename || `whatsapp_${message.id}`,
              file_size: mediaData.size || 0,
              content_type: mediaData.mime_type || 'application/octet-stream',
              processing_status: 'processing',
              source: 'whatsapp_webhook',
              extracted_data: {},
              confidence_score: 0
            })
            .select()
            .single()

          if (document) {
            console.log(`✅ Created document record: ${document.id}`)
            
            // Here you would trigger your AI processing pipeline
            // For now, we'll just log the success
            
            // Log webhook activity
            await supabase
              .from('webhook_logs')
              .insert({
                tenant_id: tenantId,
                request_data: { 
                  message_id: message.id,
                  phone_number_id: phoneNumberId,
                  message_type: message.type
                },
                response_status: 200,
                document_id: document.id,
                created_at: new Date().toISOString()
              })
          }
        }
      }
    }

  } catch (error) {
    console.error('Error in processWhatsAppMessage:', error)
  }
}

async function downloadWhatsAppMedia(mediaId: string, accessToken: string) {
  try {
    // Get media URL from WhatsApp API
    const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!mediaResponse.ok) {
      throw new Error('Failed to get media URL')
    }

    const mediaInfo = await mediaResponse.json()
    
    // Download the actual file
    const fileResponse = await fetch(mediaInfo.url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!fileResponse.ok) {
      throw new Error('Failed to download media file')
    }

    const buffer = await fileResponse.arrayBuffer()
    
    return {
      buffer: new Uint8Array(buffer),
      filename: mediaInfo.filename || `media_${mediaId}`,
      mime_type: mediaInfo.mime_type,
      size: buffer.byteLength
    }

  } catch (error) {
    console.error('Error downloading WhatsApp media:', error)
    return null
  }
}