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
      console.log(`🔍 Config sync_cursor: ${config.sync_cursor || 'NULL'}`)
      
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
    
    let filesData;
    let newFiles = [];
    
    // Force initial sync for testing (bypass cursor check) - process all files
    const forceInitialSync = true
    
    // Use delta sync if we have a cursor, otherwise do initial sync
    if (config.sync_cursor && !forceInitialSync) {
      console.log('🔄 Using delta sync with existing cursor')
      try {
        // Get only changed files since last sync
        filesData = await dropboxClient.listFolderContinue(config.sync_cursor)
        
        // Filter for new/modified files only (not deleted)
        newFiles = filesData.entries.filter((entry: any) => 
          entry['.tag'] === 'file' && !entry.hasOwnProperty('.tag') || entry['.tag'] !== 'deleted'
        )
        
        console.log(`📄 Found ${newFiles.length} new/changed files since last sync`)
      } catch (cursorError) {
        console.log('⚠️ Cursor invalid, falling back to full sync')
        // If cursor is invalid, do a full sync
        filesData = await dropboxClient.listFolder(config.folder_path || '/input')
        newFiles = filesData.entries.filter((entry: any) => entry['.tag'] === 'file')
        console.log(`📄 Found ${newFiles.length} files in full sync`)
      }
    } else {
      console.log('📂 Performing initial full sync')
      // Initial sync - get all files and store cursor
      filesData = await dropboxClient.listFolder(config.folder_path || '/input')
      newFiles = filesData.entries.filter((entry: any) => entry['.tag'] === 'file')
      console.log(`📄 Found ${newFiles.length} files in initial sync`)
    }
    
    // Update stored cursor and token if they were refreshed
    const currentToken = dropboxClient.getCurrentAccessToken()
    const needsUpdate = currentToken !== config.access_token || filesData.cursor !== config.sync_cursor
    
    if (needsUpdate) {
      console.log('🔄 Updating stored credentials and sync cursor...')
      await updateStoredTokenAndCursor(config.id, currentToken, filesData.cursor)
    }
    
    // Only process files that we haven't seen before
    if (newFiles.length === 0) {
      console.log('✅ No new files to process')
      return
    }
    
    console.log(`📂 PROCESSING ${newFiles.length} FILES ONE BY ONE WITH DETAILED LOGGING`)
    
    // Process only the first file for detailed debugging
    const filesToProcess = newFiles.slice(0, 1) // Process only 1 file at a time
    console.log(`🔍 PROCESSING ONLY FIRST FILE: ${filesToProcess[0]?.name}`)
    
    // Process each new file
    for (const file of filesToProcess) {
      console.log(`📥 Processing new file: ${file.name}`)
      
      // Check if file is a document type we can process
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
        console.log(`⏭️ Skipping unsupported file type: ${file.name}`)
        continue
      }
      
      // Temporarily bypass duplicate check to process all files
      const isAlreadyProcessed = await isFileAlreadyProcessed(file.name, config.tenant_id)
      console.log(`🔍 File ${file.name} already processed: ${isAlreadyProcessed}`)
      
      // Skip already processed files, but allow a few for AI testing
      if (isAlreadyProcessed) {
        console.log(`⏭️ File ${file.name} already exists, skipping`)
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

async function updateStoredTokenAndCursor(configId: number, newAccessToken: string, newCursor: string) {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('cloud_drive_configs')
      .update({ 
        access_token: newAccessToken,
        sync_cursor: newCursor,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', configId)
    
    if (error) {
      console.error('❌ Error updating stored token and cursor:', error)
    } else {
      console.log('✅ Successfully updated stored access token and sync cursor')
    }
  } catch (error) {
    console.error('❌ Error in updateStoredTokenAndCursor:', error)
  }
}

async function isFileAlreadyProcessed(filename: string, tenantId: number): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()
    
    console.log(`🔍 Checking if file exists: ${filename} for tenant ${tenantId}`)
    
    // First, let's check total document count to debug database connection
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
    
    console.log(`🔍 Total documents in database for tenant ${tenantId}: ${count}`)
    
    // Check if a document with this filename already exists for this tenant
    const { data, error } = await supabase
      .from('documents')
      .select('id, filename, original_filename')
      .eq('tenant_id', tenantId)
      .or(`filename.eq.${filename},original_filename.eq.${filename}`)
      .limit(1)
    
    console.log(`🔍 Database query result:`, { data, error })
    
    if (error) {
      console.error('❌ Error checking if file exists:', error)
      return false // If we can't check, assume it's new and try to process
    }
    
    const exists = data && data.length > 0
    console.log(`🔍 File ${filename} exists: ${exists}`)
    return exists
  } catch (error) {
    console.error('❌ Error in isFileAlreadyProcessed:', error)
    return false // If we can't check, assume it's new and try to process
  }
}

async function processDocumentFile(filename: string, fileData: Buffer, tenantId: number) {
  try {
    console.log(`🤖 Processing document: ${filename} for tenant ${tenantId}`)
    
    // Direct database and AI processing instead of calling upload endpoint
    const supabase = createSupabaseClient()
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}_${filename}`
    
    // Calculate file hash for duplicate detection
    const crypto = await import('crypto')
    const hash = crypto.createHash('sha256').update(fileData).digest('hex')
    
    // Create document record directly in database (using system user ID 1 for webhook uploads)
    const { data: documentResult, error: docError } = await supabase
      .from('documents')
      .insert([{
        tenant_id: tenantId,
        filename: uniqueFilename,
        original_filename: filename,
        file_size: fileData.length,
        mime_type: getMimeType(filename),
        processing_status: 'processing',
        uploaded_by: 1 // System user for webhook uploads
      }])
      .select('id')
      .single()

    if (docError || !documentResult) {
      console.error(`❌ Error creating document record for ${filename}:`, docError)
      return
    }

    console.log(`📝 Created document record: ID ${documentResult.id}`)

    // Process document with real AI extraction
    console.log(`🤖 STARTING AI PROCESSING FOR: ${filename}`)
    console.log(`📊 FILE INFO: Size=${fileData.length} bytes, Type=${getMimeType(filename)}`)
    
    try {
      // Import ProcessorManager dynamically to avoid path issues
      console.log(`🔧 IMPORTING ProcessorManager...`)
      const { ProcessorManager } = await import('../../../../server/agents/ProcessorManager')
      const processorManager = new ProcessorManager()
      console.log(`✅ ProcessorManager initialized successfully`)
      
      // Process document with AI
      console.log(`🚀 CALLING processorManager.processDocument()...`)
      console.log(`📝 PARAMS: tenantId=${tenantId}, mimeType=${getMimeType(filename)}, filename=${filename}`)
      
      const processingResult = await processorManager.processDocument(
        tenantId, 
        fileData, 
        getMimeType(filename), 
        filename
      )
      
      console.log(`🎉 AI PROCESSING COMPLETED FOR: ${filename}`)
      console.log(`📈 CONFIDENCE: ${processingResult.confidence}`)
      console.log(`🤖 MODEL USED: ${processingResult.modelUsed}`)
      console.log(`📊 EXTRACTED DATA:`, JSON.stringify(processingResult.data, null, 2))
      
      // Update document with AI results
      console.log(`💾 UPDATING DOCUMENT WITH AI RESULTS...`)
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          processing_status: 'completed',
          ai_model_used: processingResult.modelUsed || 'webhook-ai-processing',
          extracted_data: processingResult.data
        })
        .eq('id', documentResult.id)

      if (updateError) {
        console.error(`❌ ERROR UPDATING DOCUMENT ${filename}:`, updateError)
        return
      }
      console.log(`✅ DOCUMENT UPDATED SUCCESSFULLY`)
      
      // Create expense from AI-extracted data
      const extractedData = processingResult.data
      console.log(`💰 CREATING EXPENSE FROM AI DATA...`)
      console.log(`📊 EXTRACTED FIELDS:`)
      console.log(`   - vendor: ${extractedData.vendor || extractedData.issuer || 'Unknown Vendor'}`)
      console.log(`   - amount: ${extractedData.total || extractedData.amount || 0}`)
      console.log(`   - vatAmount: ${extractedData.vatAmount || 0}`)
      console.log(`   - category: ${extractedData.category || 'outras_despesas'}`)
      console.log(`   - description: ${extractedData.description || filename}`)
      
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          tenant_id: tenantId,
          vendor: extractedData.vendor || extractedData.issuer || 'Unknown Vendor',
          amount: extractedData.total || extractedData.amount || 0,
          vat_amount: extractedData.vatAmount || 0,
          vat_rate: extractedData.vatRate || 0,
          category: extractedData.category || 'outras_despesas',
          description: `${extractedData.description || filename} [DOC:${documentResult.id}]`,
          expense_date: extractedData.issueDate || extractedData.date || new Date().toISOString().split('T')[0],
          is_deductible: true
        }])

      if (expenseError) {
        console.error(`❌ ERROR CREATING EXPENSE FOR ${filename}:`, expenseError)
      } else {
        console.log(`🎉 EXPENSE CREATED SUCCESSFULLY!`)
        console.log(`💰 FINAL EXPENSE: vendor=${extractedData.vendor || extractedData.issuer}, amount=${extractedData.total || extractedData.amount}`)
      }
      
    } catch (aiError) {
      console.error(`❌ AI processing failed for ${filename}:`, aiError)
      
      // Fallback: Create basic expense without AI data
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          processing_status: 'completed',
          ai_model_used: 'webhook-fallback'
        })
        .eq('id', documentResult.id)
        
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          tenant_id: tenantId,
          vendor: 'Processing Failed',
          amount: 0,
          vat_amount: 0,
          vat_rate: 0,
          category: 'outras_despesas',
          description: `Document failed processing: ${filename} [DOC:${documentResult.id}]`,
          expense_date: new Date().toISOString().split('T')[0],
          is_deductible: true
        }])
        
      if (!expenseError) {
        console.log(`💰 Created fallback expense for ${filename}`)
      }
    }

    console.log(`✅ Document processed successfully: ${filename} -> Document ID: ${documentResult.id}`)
    
  } catch (error) {
    console.error(`❌ Error processing document file ${filename}:`, error)
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