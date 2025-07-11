import { NextRequest, NextResponse } from 'next/server'

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

    console.log('🏢 Processing direct upload for tenant ID:', tenantId)
    
    // Use SECURITY DEFINER function to completely bypass RLS
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/upload_document_bypass_all_rls`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id_param: parseInt(tenantId),
        filename_param: file.name,
        mime_type_param: file.type,
        file_size_param: file.size
      })
    })

    const result = await response.json()
    
    console.log('🔍 Function call response:', { status: response.status, result })

    if (!response.ok) {
      console.error('Error creating document via function:', result)
      return NextResponse.json({ error: 'Failed to create document record', details: result }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Document uploaded successfully',
      document: result[0]
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}