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

    console.log('🏢 Processing simple upload for tenant ID:', tenantId)
    console.log('📄 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // For now, just return success to verify the upload flow works
    // We'll fix the database insertion separately
    return NextResponse.json({ 
      success: true,
      message: 'File received successfully',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}