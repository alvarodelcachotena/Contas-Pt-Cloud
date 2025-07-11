import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'
import { getGmailCredentials } from '../../../../lib/webhook-credentials'

loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Handle Gmail webhook notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Gmail webhook received:', JSON.stringify(body, null, 2))

    // Process Gmail push notification
    if (body.message && body.subscription) {
      const emailData = JSON.parse(Buffer.from(body.message.data, 'base64').toString())
      await processGmailNotification(emailData, body.subscription)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing Gmail webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function processGmailNotification(emailData: any, subscription: string) {
  try {
    console.log(`📧 Processing Gmail notification for: ${emailData.emailAddress}`)

    const supabase = createSupabaseClient()
    
    // For demo purposes, we'll use tenant ID 1
    // In production, you'd need to map email addresses to tenants
    const tenantId = 1
    
    // Get Gmail credentials for this tenant
    const credentials = await getGmailCredentials(tenantId)
    
    if (!credentials.imapUser) {
      console.error('❌ No Gmail credentials found for tenant')
      return
    }

    // Process email using IMAP
    await processEmailWithIMAP(emailData, credentials, tenantId)

  } catch (error) {
    console.error('Error in processGmailNotification:', error)
  }
}

async function processEmailWithIMAP(emailData: any, credentials: any, tenantId: number) {
  try {
    console.log('📧 Processing email with IMAP (mock implementation)')
    
    const supabase = createSupabaseClient()
    
    // This is a simplified mock implementation
    // In production, you'd use a proper IMAP library like node-imap or imapflow
    
    // Mock: Process email attachments
    const mockAttachments = [
      {
        filename: 'invoice_email_attachment.pdf',
        size: 45678,
        contentType: 'application/pdf'
      }
    ]

    for (const attachment of mockAttachments) {
      // Create document record for each attachment
      const { data: document } = await supabase
        .from('documents')
        .insert({
          tenant_id: tenantId,
          filename: attachment.filename,
          original_filename: attachment.filename,
          file_size: attachment.size,
          content_type: attachment.contentType,
          processing_status: 'processing',
          source: 'gmail_webhook',
          extracted_data: {},
          confidence_score: 0
        })
        .select()
        .single()

      if (document) {
        console.log(`✅ Created document record from Gmail: ${document.id}`)
        
        // Log webhook activity
        await supabase
          .from('webhook_logs')
          .insert({
            tenant_id: tenantId,
            request_data: { 
              email_address: emailData.emailAddress,
              attachment_name: attachment.filename
            },
            response_status: 200,
            document_id: document.id,
            created_at: new Date().toISOString()
          })
      }
    }

  } catch (error) {
    console.error('Error processing email with IMAP:', error)
  }
}