import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Simple debug Dropbox folders request received')
    
    const body = await request.json()
    console.log('📦 Request body:', {
      hasAccessToken: !!body.accessToken,
      hasRefreshToken: !!body.refreshToken,
      path: body.path || 'root'
    })
    
    // Check environment variables
    const clientId = process.env.DROPBOX_CLIENT_ID
    const clientSecret = process.env.DROPBOX_CLIENT_SECRET
    
    console.log('🔧 Environment check:')
    console.log('- DROPBOX_CLIENT_ID:', clientId ? '✅ Set' : '❌ Missing')
    console.log('- DROPBOX_CLIENT_SECRET:', clientSecret ? '✅ Set' : '❌ Missing')
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Dropbox environment variables not configured',
        details: {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          environment: process.env.NODE_ENV,
          isNetlify: !!process.env.NETLIFY
        }
      }, { status: 500 })
    }
    
    // Return mock data for now to test the flow
    const mockFolders = [
      {
        id: 'mock-1',
        name: 'Documents',
        path: '/Documents',
        documentCount: 5,
        hasChildren: true
      },
      {
        id: 'mock-2', 
        name: 'Photos',
        path: '/Photos',
        documentCount: 12,
        hasChildren: true
      },
      {
        id: 'mock-3',
        name: 'prueba',
        path: '/prueba',
        documentCount: 3,
        hasChildren: false
      }
    ]
    
    console.log('✅ Returning mock folders data')
    
    return NextResponse.json({
      success: true,
      currentPath: body.path || '',
      folders: mockFolders
    })
    
  } catch (error) {
    console.error('❌ Error in simple debug Dropbox folders:', error)
    return NextResponse.json({ 
      error: 'Failed to debug folders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
