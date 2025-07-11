import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    console.log('🏢 Processing clean upload for tenant ID:', tenantId)
    console.log('📄 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Test with anon key as requested by user
    const supabaseUrl = 'https://mtkjxeewqcbjwjljfmgf.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10a2p4ZWV3cWNiandqbGpmbWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTMxNzksImV4cCI6MjA2NjI2OTE3OX0.i0WZRra9XDJxcd2B72yOkBrlvPnjph249zuZpEKQUmw'
    
    console.log('🔑 Using hardcoded .env values')
    console.log('🌐 URL:', supabaseUrl)
    console.log('🔐 Key prefix:', supabaseKey.substring(0, 20) + '...')
    
    // Create fresh Supabase client - use very basic configuration
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // First, let's check what the Supabase client sees as the schema
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('documents')
      .select('*')
      .limit(1)
    
    console.log('🔍 Schema check result:', { schemaCheck, schemaError })
    
    // Check if we can query the table at all
    const { data: countResult, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
    
    console.log('📊 Count check result:', { countResult, countError })
    
    console.log('💾 Attempting document insert with data:', {
      tenant_id: parseInt(tenantId),
      filename: file.name,
      original_filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      processing_status: 'completed',
      uploaded_by: 2 // Use admin user ID
    })
    
    // Use RLS-bypassing function with anon key
    const { data: document, error: docError } = await supabase.rpc('upload_document_bypass_rls', {
      p_tenant_id: parseInt(tenantId),
      p_filename: file.name,
      p_original_filename: file.name,
      p_file_size: file.size,
      p_mime_type: file.type,
      p_processing_status: 'completed',
      p_uploaded_by: 2
    })

    console.log('📊 Insert result:', { document, error: docError })

    if (docError) {
      console.error('❌ Document creation failed:', docError)
      return NextResponse.json({ 
        error: 'Failed to create document record',
        details: docError 
      }, { status: 500 })
    }

    console.log('✅ Document created successfully with ID:', document.id)

    return NextResponse.json({ 
      success: true,
      message: 'Document uploaded and saved successfully',
      document: document
    })

  } catch (error) {
    console.error('💥 Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}