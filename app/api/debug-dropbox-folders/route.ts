import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../server/dropbox-api-client'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, path = "" } = await request.json()
    
    console.log('🔍 Debug Dropbox folders request:')
    console.log('- Access token length:', accessToken?.length || 0)
    console.log('- Refresh token length:', refreshToken?.length || 0)
    console.log('- Path:', path || 'root')
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

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
          hasClientSecret: !!clientSecret
        }
      }, { status: 500 })
    }
    
    console.log(`📂 Exploring Dropbox folders at path: ${path || 'root'}`)
    
    // Create Dropbox API client
    const dropboxClient = new DropboxApiClient(accessToken, refreshToken)
    
    // Test basic API call first
    try {
      console.log('🧪 Testing basic API call...')
      const result = await dropboxClient.listFolder(path)
      console.log('✅ Basic API call successful')
      console.log('- Entries count:', result.entries.length)
      
      // Filter and format folders
      const folders = result.entries
        .filter(entry => entry['.tag'] === 'folder')
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          path: folder.path_display,
          hasChildren: true // We'll assume folders might have subfolders
        }))
      
      console.log(`📋 Found ${folders.length} folders`)
      
      // For now, return folders without document counts to avoid additional API calls
      return NextResponse.json({
        success: true,
        currentPath: path,
        folders: folders.map(folder => ({
          ...folder,
          documentCount: 0 // Simplified for now
        }))
      })
      
    } catch (apiError) {
      console.error('❌ Dropbox API error:', apiError)
      return NextResponse.json({ 
        error: 'Dropbox API error',
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        apiError: apiError
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Error in debug Dropbox folders:', error)
    return NextResponse.json({ 
      error: 'Failed to debug folders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
