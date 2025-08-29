import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ProcessorManager } from '@/server/agents/ProcessorManager'
import { getTenantId } from '@/lib/tenant-utils'

const processorManager = new ProcessorManager()

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name

    // Save original file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(`${tenantId}/${filename}`, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Create document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert([
        {
          tenant_id: tenantId,
          filename: filename,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.path,
          status: 'processing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (documentError) {
      console.error('❌ Error creating document record:', documentError)
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      )
    }

    // Process document with enhanced AI processing system
    const processingResult = await processorManager.processDocument(buffer, file.type, filename)

    // Update document with processing results - use only confirmed schema fields
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'processed',
        processing_results: processingResult,
        confidence_score: processingResult.confidenceScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentData.id)

    if (updateError) {
      console.error('❌ Error updating document:', updateError)
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      )
    }

    // Create expense record if processing was successful
    if (processingResult.data) {
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          tenant_id: tenantId,
          document_id: documentData.id,
          vendor: processingResult.data.vendor || 'Unknown Vendor',
          amount: processingResult.data.total || 0,
          vat_amount: processingResult.data.vatAmount || 0,
          vat_rate: processingResult.data.vatRate || 0,
          category: processingResult.data.category || 'outras_despesas',
          description: processingResult.data.description || '',
          invoice_number: processingResult.data.invoiceNumber || '',
          invoice_date: processingResult.data.issueDate || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])

      if (expenseError) {
        console.error('❌ Error creating expense:', expenseError)
        return NextResponse.json(
          { error: 'Failed to create expense' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: 'File processed successfully',
      document: documentData,
      processingResult: processingResult,
    })

  } catch (error) {
    console.error('❌ Error in upload endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}