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
    console.log('📄 Fetching SAFT documents for tenant:', tenantId)

    const { data: saftDocuments, error } = await supabase
      .from('saft_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('generated_date', { ascending: false })

    if (error) {
      console.error('❌ Error fetching SAFT documents:', error)
      return NextResponse.json({ error: 'Failed to fetch SAFT documents' }, { status: 500 })
    }

    console.log(`✅ Found ${saftDocuments?.length || 0} SAFT documents`)

    const formattedSaftDocuments = saftDocuments?.map(doc => ({
      id: doc.id,
      period: doc.period,
      generatedDate: doc.generated_date,
      records: doc.records,
      status: doc.status,
      filePath: doc.file_path,
      fileSize: doc.file_size,
      checksum: doc.checksum,
      createdAt: doc.created_at
    })) || []

    return NextResponse.json(formattedSaftDocuments)
  } catch (error) {
    console.error('❌ SAFT API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📄 Creating SAFT document for tenant: 1', body)

    // Prepare SAFT document data
    const saftData = {
      tenant_id: 1,
      period: body.period,
      generated_date: body.generatedDate,
      records: body.records,
      status: body.status || 'generated',
      file_path: body.filePath,
      file_size: body.fileSize,
      checksum: body.checksum
    }

    console.log('📋 SAFT data to insert:', saftData)

    const { data: saftDocument, error } = await supabase
      .from('saft_documents')
      .insert(saftData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating SAFT document:', error)
      return NextResponse.json({
        error: 'Failed to create SAFT document',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ SAFT document created successfully:', saftDocument.id)
    return NextResponse.json(saftDocument)
  } catch (error) {
    console.error('❌ Create SAFT document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}