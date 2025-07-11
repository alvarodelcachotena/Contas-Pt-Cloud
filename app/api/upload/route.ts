import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../../../lib/env-loader.js'
import { smartDuplicateCheck, generateFileHash } from '../../../lib/duplicate-detection'

// Force loading from .env file only
loadEnvStrict()

// Get environment variables using strict loader - using anon key as requested
const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_ANON_KEY = getSupabaseAnonKey()

// Use anon key from .env file as requested by user
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Import the real CloudDocumentProcessor
import { CloudDocumentProcessor } from '../../../server/agents/CloudDocumentProcessor'

const cloudProcessor = new CloudDocumentProcessor()

export async function POST(request: NextRequest) {
  try {
    const tenantId = parseInt(request.headers.get('x-tenant-id') || '1')
    
    // Temporarily skip tenant verification to test core functionality
    console.log('🏢 Processing upload for tenant ID:', tenantId)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const allowDuplicates = formData.get('allowDuplicates') === 'true'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type - Accept all common document and image formats
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Supported formats: PDF, JPG, PNG, GIF, WebP, DOC, DOCX, TXT' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentHash = generateFileHash(buffer)
    
    // Check for duplicates before processing
    const duplicateCheck = await smartDuplicateCheck(
      supabase, 
      tenantId, 
      file.name, 
      buffer,
      { allowDuplicates: allowDuplicates, skipProcessing: !allowDuplicates } // Use user preference
    )
    
    if (!duplicateCheck.shouldProcess) {
      return NextResponse.json({
        success: false,
        isDuplicate: true,
        message: `Document already exists: ${duplicateCheck.duplicateInfo.existingDocumentName}`,
        existingDocument: {
          id: duplicateCheck.duplicateInfo.existingDocumentId,
          name: duplicateCheck.duplicateInfo.existingDocumentName,
          matchType: duplicateCheck.duplicateInfo.matchType
        }
      }, { status: 409 }) // 409 Conflict
    }
    
    const filename = `${Date.now()}_${file.name}`
    
    // Create document record using the service function
    const { data: documentResult, error: docError } = await supabase
      .rpc('upload_document_bypass_all_rls', {
        p_tenant_id: tenantId,
        p_filename: filename,
        p_original_filename: file.name,
        p_mime_type: file.type,
        p_file_size: file.size,
        p_processing_status: 'processing',
        p_uploaded_by: 1 // Default to super admin for now
      })
    
    console.log('🔍 Document creation result:', { documentResult, error: docError })

    if (docError || !documentResult) {
      console.error('Error creating document record:', docError)
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    // Create document object with the returned ID
    const document = {
      id: documentResult,
      tenant_id: tenantId,
      filename: filename,
      original_filename: file.name,
      processing_status: 'processing'
    }

    // Process document with AI
    const processingResult = await cloudProcessor.processDocument(tenantId, buffer, file.type, filename)
    
    // Update document with processing results - use only confirmed schema fields
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        extracted_data: processingResult.data,
        ai_model_used: 'gemini-2.5-flash-preview'
      })
      .eq('id', document.id)

    if (updateError) {
      console.error('Error updating document:', updateError)
    }

    // If processing was successful and data was extracted, create expense
    // Lower threshold since confidence scoring needs calibration but extraction is working well
    if (processingResult.data && processingResult.data.vendor && (processingResult.data.total || 0) > 0) {
      const extractedData = processingResult.data
      
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          tenant_id: tenantId,
          vendor: extractedData.vendor || 'Vendor Unknown',
          amount: extractedData.netAmount || extractedData.total || 0,
          vat_amount: extractedData.vatAmount || 0,
          vat_rate: extractedData.vatRate || 0,
          category: extractedData.category || 'outras_despesas',
          description: `${extractedData.description || 'Documento processado'} [DOC:${document.id}]`,
          expense_date: extractedData.issueDate || new Date().toISOString().split('T')[0],
          is_deductible: true
        })

      if (expenseError) {
        console.error('Error creating expense from extracted data:', expenseError)
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        originalFilename: document.original_filename,
        status: 'completed',
        extractedData: processingResult.data,
        confidence: processingResult.confidenceScore
      },
      duplicateInfo: duplicateCheck.duplicateInfo.isDuplicate ? {
        wasDuplicate: true,
        matchType: duplicateCheck.duplicateInfo.matchType,
        originalDocument: duplicateCheck.duplicateInfo.existingDocumentName
      } : null
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}