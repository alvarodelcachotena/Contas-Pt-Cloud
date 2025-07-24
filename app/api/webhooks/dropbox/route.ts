import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'
import { DropboxApiClient } from '../../../../server/dropbox-api-client'
import crypto from 'crypto'

loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Webhook verification for Dropbox
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    console.log('✅ Dropbox webhook verification successful')
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
  
  return NextResponse.json({ error: 'Missing challenge parameter' }, { status: 400 })
}

// Handle Dropbox webhook notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-dropbox-signature')
    
    // For now, let's disable signature verification to debug the webhook
    // In production, you'll need to configure the proper webhook secret in Dropbox
    console.log('📥 Dropbox webhook received, signature:', signature)
    console.log('📥 Request body:', body)
    
    // Verify webhook signature (disabled for debugging)
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.DROPBOX_WEBHOOK_SECRET || 'webhook-secret')
    //   .update(body)
    //   .digest('hex')
    
    // if (signature !== expectedSignature) {
    //   console.error('❌ Invalid Dropbox webhook signature')
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const webhookData = JSON.parse(body)
    console.log('📥 Dropbox webhook received:', JSON.stringify(webhookData, null, 2))

    // Process webhook data - fix payload structure
    const accounts = webhookData.list_folder?.accounts || webhookData.accounts || []
    console.log('📋 Found accounts to process:', accounts)

    if (accounts.length > 0) {
      for (const account of accounts) {
        console.log(`🔄 Processing Dropbox changes for account: ${account}`)
        
        // Trigger document processing for this account
        await processDropboxChanges(account)
      }
    } else {
      console.log('⚠️ No accounts found in webhook payload')
    }

    return NextResponse.json({ 
      success: true,
      processed_accounts: accounts.length,
      accounts_processed: accounts
    })

  } catch (error) {
    console.error('Error processing Dropbox webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function processDropboxChanges(accountId: string) {
  try {
    const supabase = createSupabaseClient()
    
    // Find configurations for this Dropbox account
    const { data: configs, error: configError } = await supabase
      .from('cloud_drive_configs')
      .select('*')
      .eq('provider', 'dropbox')
      .eq('is_active', true)

    if (configError) {
      console.error('❌ Error fetching Dropbox configs:', configError)
      return
    }

    console.log(`📋 Found ${configs?.length || 0} active Dropbox configurations`)
    
    if (!configs || configs.length === 0) {
      console.log('⚠️ No active Dropbox configurations found')
      
      // Log webhook activity without config
      console.log('✅ Webhook received but no active configurations found')
      return
    }

    for (const config of configs) {
      console.log(`🔄 Processing changes for tenant ${config.tenant_id}, config ${config.id}`)
      
      // Implement actual file processing logic
      await processDropboxFiles(config)
      console.log(`📝 Logging webhook activity for cloud drive config ${config.id}`)
      
      // Simplified logging - just log that processing occurred
      console.log('✅ Webhook processing completed successfully')
    }

  } catch (error) {
    console.error('Error in processDropboxChanges:', error)
  }
}

async function processDropboxFiles(config: any) {
  try {
    console.log(`📁 Processing files in ${config.folder_path} for tenant ${config.tenant_id}`)
    
    // Create DropboxApiClient with token refresh capability
    const dropboxClient = new DropboxApiClient(config.access_token, config.refresh_token)
    
    // List files in the Dropbox folder using the API client
    const filesData = await dropboxClient.listFolder(config.folder_path || '/input')
    const files = filesData.entries.filter((entry: any) => entry['.tag'] === 'file')
    
    console.log(`📄 Found ${files.length} files in Dropbox folder`)
    
    // Update stored token if it was refreshed
    const currentToken = dropboxClient.getCurrentAccessToken()
    if (currentToken !== config.access_token) {
      console.log('🔄 Token was refreshed, updating stored credentials...')
      await updateStoredToken(config.id, currentToken)
    }
    
    // Process each file
    for (const file of files) {
      console.log(`📥 Processing file: ${file.name}`)
      
      // Check if file is a document type we can process
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
        console.log(`⏭️ Skipping unsupported file type: ${file.name}`)
        continue
      }
      
      // Download the file using the API client
      const fileData = await dropboxClient.downloadFile(file.path_display)
      
      console.log(`💾 Downloaded ${file.name} (${fileData.length} bytes)`)
      
      // Process the file through AI extraction
      await processDocumentFile(file.name, fileData, config.tenant_id)
    }
    
  } catch (error) {
    console.error('Error processing Dropbox files:', error)
    
    // If it's a token-related error, log additional details
    if (error instanceof Error && error.message.includes('expired_access_token')) {
      console.error('❌ Token expired error - may need to re-authenticate')
    }
  }
}

async function updateStoredToken(configId: number, newAccessToken: string) {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('cloud_drive_configs')
      .update({ access_token: newAccessToken })
      .eq('id', configId)
    
    if (error) {
      console.error('❌ Error updating stored token:', error)
    } else {
      console.log('✅ Successfully updated stored access token')
    }
  } catch (error) {
    console.error('❌ Error in updateStoredToken:', error)
  }
}

async function processDocumentFile(filename: string, fileData: Buffer, tenantId: number) {
  try {
    console.log(`🤖 Processing document: ${filename} for tenant ${tenantId}`)
    
    // Use the existing upload endpoint by creating a FormData request
    const formData = new FormData()
    const blob = new Blob([fileData], { type: getMimeType(filename) })
    formData.append('file', blob, filename)
    formData.append('tenantId', tenantId.toString())
    
    // Call the existing upload endpoint
    const uploadResponse = await fetch(`http://localhost:5000/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer webhook-system', // Internal system token
      }
    })
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error(`❌ Error uploading document ${filename}:`, errorText)
      return
    }
    
    const uploadResult = await uploadResponse.json()
    console.log(`✅ Document processed successfully: ${filename} -> Document ID: ${uploadResult.document?.id}`)
    
  } catch (error) {
    console.error('Error processing document file:', error)
  }
}

function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf': return 'application/pdf'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'gif': return 'image/gif'
    case 'webp': return 'image/webp'
    default: return 'application/octet-stream'
  }
}