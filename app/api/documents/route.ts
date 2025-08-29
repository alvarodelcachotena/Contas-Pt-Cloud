import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_ANON_KEY = getSupabaseAnonKey()

// Use anon key for API access
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function GET(request: NextRequest) {
    try {
        const tenantId = request.headers.get('x-tenant-id') || '1'
        console.log('📄 Fetching documents for tenant:', tenantId)

        // First, let's check what columns exist in the documents table
        const { data: columns, error: columnsError } = await supabase
            .from('documents')
            .select('*')
            .limit(1)

        if (columnsError) {
            console.error('❌ Error checking table structure:', columnsError)
            return NextResponse.json({ error: 'Failed to check table structure' }, { status: 500 })
        }

        console.log('🔍 Available columns:', Object.keys(columns?.[0] || {}))

        // Fetch documents with all available columns
        const { data: documents, error } = await supabase
            .from('documents')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('❌ Error fetching documents:', error)
            return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
        }

        console.log(`✅ Found ${documents?.length || 0} documents`)

        // Map the data to our expected format, handling missing columns gracefully
        const formattedDocuments = documents?.map(doc => ({
            id: doc.id,
            filename: doc.filename || doc.name || 'Unknown',
            filePath: doc.file_path || doc.path || '',
            fileType: doc.file_type || doc.type || 'unknown',
            fileSize: doc.file_size || doc.size || 0,
            status: doc.status || 'pending',
            uploadedAt: doc.uploaded_at || doc.created_at || doc.upload_date || new Date().toISOString(),
            processedAt: doc.processed_at || doc.processed_date || null,
            documentType: doc.document_type || doc.doc_type || 'other',
            extractedData: doc.extracted_data || doc.data || {},
            confidence: doc.confidence || 0,
            createdAt: doc.created_at || new Date().toISOString()
        })) || []

        return NextResponse.json(formattedDocuments)
    } catch (error) {
        console.error('❌ Documents API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('📄 Creating document for tenant: 1', body)

        // Check what columns exist in the table first
        const { data: existingDoc, error: checkError } = await supabase
            .from('documents')
            .select('*')
            .limit(1)

        if (checkError) {
            console.error('❌ Error checking table structure:', checkError)
            return NextResponse.json({ error: 'Failed to check table structure' }, { status: 500 })
        }

        const availableColumns = Object.keys(existingDoc?.[0] || {})
        console.log('🔍 Available columns for insert:', availableColumns)

        // Prepare document data based on available columns
        const documentData: any = {
            tenant_id: 1
        }

        // Map fields to available columns
        if (availableColumns.includes('filename')) documentData.filename = body.filename
        if (availableColumns.includes('name')) documentData.name = body.filename
        if (availableColumns.includes('file_path')) documentData.file_path = body.filePath
        if (availableColumns.includes('path')) documentData.path = body.filePath
        if (availableColumns.includes('file_type')) documentData.file_type = body.fileType
        if (availableColumns.includes('type')) documentData.type = body.fileType
        if (availableColumns.includes('file_size')) documentData.file_size = body.fileSize
        if (availableColumns.includes('size')) documentData.size = body.fileSize
        if (availableColumns.includes('status')) documentData.status = body.status || 'pending'
        if (availableColumns.includes('document_type')) documentData.document_type = body.documentType
        if (availableColumns.includes('doc_type')) documentData.doc_type = body.documentType
        if (availableColumns.includes('extracted_data')) documentData.extracted_data = body.extractedData
        if (availableColumns.includes('data')) documentData.data = body.extractedData
        if (availableColumns.includes('confidence')) documentData.confidence = body.confidence

        console.log('📋 Document data to insert:', documentData)

        const { data: document, error } = await supabase
            .from('documents')
            .insert(documentData)
            .select()
            .single()

        if (error) {
            console.error('❌ Error creating document:', error)
            return NextResponse.json({
                error: 'Failed to create document',
                details: error.message
            }, { status: 500 })
        }

        console.log('✅ Document created successfully:', document.id)
        return NextResponse.json(document)
    } catch (error) {
        console.error('❌ Create document error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updateData } = body
        console.log('📄 Updating document:', id, updateData)

        const { data: document, error } = await supabase
            .from('documents')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('❌ Error updating document:', error)
            return NextResponse.json({
                error: 'Failed to update document',
                details: error.message
            }, { status: 500 })
        }

        console.log('✅ Document updated successfully:', document.id)
        return NextResponse.json(document)
    } catch (error) {
        console.error('❌ Update document error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
        }

        console.log('📄 Deleting document:', id)

        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('❌ Error deleting document:', error)
            return NextResponse.json({
                error: 'Failed to delete document',
                details: error.message
            }, { status: 500 })
        }

        console.log('✅ Document deleted successfully:', id)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('❌ Delete document error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
