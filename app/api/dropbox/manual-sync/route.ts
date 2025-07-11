import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../server/dropbox-api-client'
import { CloudDocumentProcessor } from '../../../../server/agents/CloudDocumentProcessor'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'
import { smartDuplicateCheck, generateFileHash } from '../../../../lib/duplicate-detection'

loadEnvStrict()

function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

function isDocumentFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop()
  return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'txt'].includes(ext || '')
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting manual Dropbox sync for all documents...')
    
    // Get Dropbox integration from cloud-integrations API
    const integrationResponse = await fetch('http://localhost:5000/api/cloud-integrations')
    const integrationsData = await integrationResponse.json()
    
    const dropboxIntegration = integrationsData.integrations?.find((i: any) => i.provider === 'dropbox')
    
    if (!dropboxIntegration) {
      return NextResponse.json({ error: 'No Dropbox integration found' }, { status: 404 })
    }

    console.log('📁 Found Dropbox integration:', dropboxIntegration.id)
    
    // Create Dropbox API client
    const apiClient = new DropboxApiClient(
      dropboxIntegration.access_token,
      dropboxIntegration.refresh_token
    )
    
    // List all files in the input folder
    const folderPath = dropboxIntegration.folder_path || '/input'
    const result = await apiClient.listFolder(folderPath)
    
    console.log(`📋 Found ${result.entries.length} total entries in ${folderPath}`)
    
    // Filter for document files
    const documentFiles = result.entries.filter(entry => 
      entry['.tag'] === 'file' && isDocumentFile(entry.name)
    )
    
    console.log(`📄 Found ${documentFiles.length} document files to process`)
    
    const processedDocuments = []
    const createdExpenses = []
    
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Process each document
    for (const file of documentFiles) {
      try {
        console.log(`📄 Processing: ${file.name}`)
        
        // Download file first to check content hash
        const fileBuffer = await apiClient.downloadFile(file.path_display)
        console.log(`📥 Downloaded ${file.name} (${fileBuffer.length} bytes)`)
        
        // Enhanced duplicate detection using content hash
        const duplicateCheck = await smartDuplicateCheck(
          supabase,
          1, // tenant ID
          file.name,
          fileBuffer,
          { allowDuplicates: false, skipProcessing: true }
        )
        
        if (!duplicateCheck.shouldProcess) {
          console.log(`⏭️ Skipping ${file.name} - duplicate detected (${duplicateCheck.duplicateInfo.matchType}): ${duplicateCheck.duplicateInfo.existingDocumentName}`)
          continue
        }
        
        // Create document record - using only fields that exist in database
        const contentHash = generateFileHash(fileBuffer)
        const documentData = {
          tenant_id: 1,
          filename: file.name,
          original_filename: file.name,
          mime_type: getMimeTypeFromExtension(file.name),
          file_size: file.size || fileBuffer.length,
          uploaded_by: 1,
          processing_status: 'processing',
          extracted_data: JSON.stringify({}),
          content_hash: contentHash
        }
        
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single()
        
        if (docError) {
          console.error(`❌ Failed to create document record for ${file.name}:`, docError)
          continue
        }
        
        console.log(`📝 Created document record ID: ${document.id}`)
        
        // Process with AI
        const cloudProcessor = new CloudDocumentProcessor()
        const processingResult = await cloudProcessor.processDocument(
          1, // tenant ID
          fileBuffer,
          getMimeTypeFromExtension(file.name),
          file.name
        )
        
        console.log(`🤖 AI processing completed for ${file.name} with confidence: ${processingResult.confidenceScore}`)
        
        // Update document with results
        await supabase
          .from('documents')
          .update({
            processing_status: 'completed',
            extracted_data: processingResult.data
          })
          .eq('id', document.id)
        
        processedDocuments.push({
          id: document.id,
          filename: file.name,
          extractedData: processingResult.data
        })
        
        // Create expense if we have valid data
        if (processingResult.data.total && processingResult.data.total > 0) {
          const expenseData = {
            tenant_id: 1,
            vendor: processingResult.data.vendor || 'Unknown Vendor',
            amount: processingResult.data.total,
            vat_amount: processingResult.data.vatAmount || 0,
            vat_rate: processingResult.data.vatRate || 0,
            category: processingResult.data.category || 'outras_despesas',
            description: `[DOC:${document.id}] ${processingResult.data.description || processingResult.data.vendor || file.name}`,
            expense_date: processingResult.data.issueDate || new Date().toISOString().split('T')[0],
            is_deductible: true
          }
          
          const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .insert(expenseData)
            .select()
            .single()
          
          if (expenseError) {
            console.error(`❌ Failed to create expense for ${file.name}:`, expenseError)
          } else {
            console.log(`💰 Created expense ID: ${expense.id} (€${processingResult.data.total})`)
            createdExpenses.push({
              id: expense.id,
              vendor: expenseData.vendor,
              amount: expenseData.amount,
              filename: file.name
            })
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error)
      }
    }
    
    console.log(`✅ Manual sync completed: ${processedDocuments.length} documents processed, ${createdExpenses.length} expenses created`)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalFilesFound: documentFiles.length,
        documentsProcessed: processedDocuments.length,
        expensesCreated: createdExpenses.length
      },
      processedDocuments,
      createdExpenses
    })
    
  } catch (error) {
    console.error('❌ Manual sync error:', error)
    return NextResponse.json({ error: 'Manual sync failed' }, { status: 500 })
  }
}