import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../server/dropbox-api-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Testing Dropbox document processing...')
    
    // Get the integration from the request
    const { integrationId } = await request.json()
    
    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    // Get the integration details
    const integrationResponse = await fetch(`http://localhost:5000/api/cloud-integrations`)
    const integrationsData = await integrationResponse.json()
    
    console.log('🔍 Available integrations:', integrationsData)
    
    const integration = integrationsData.integrations?.find((i: any) => i.id === integrationId)
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    console.log('📁 Found integration:', {
      id: integration.id,
      provider: integration.provider,
      userEmail: integration.user_email,
      folderPath: integration.folder_path,
      hasAccessToken: !!integration.access_token,
      hasRefreshToken: !!integration.refresh_token
    })

    // Create Dropbox API client
    const dropboxClient = new DropboxApiClient(integration.access_token, integration.refresh_token)
    
    // Test listing files in the folder
    try {
      console.log(`📂 Listing files in folder: ${integration.folder_path}`)
      
      const result = await dropboxClient.listFolder(integration.folder_path || '/input')
      
      console.log(`📄 Found ${result.entries.length} entries in folder`)
      
      // Filter for document files
      const documentFiles = result.entries.filter(entry => 
        entry['.tag'] === 'file' && 
        isDocumentFile(entry.name)
      )
      
      console.log(`📋 Found ${documentFiles.length} document files:`)
      documentFiles.forEach(file => {
        console.log(`  - ${file.name} (${formatFileSize(file.size || 0)})`)
      })
      
      return NextResponse.json({
        success: true,
        integration: {
          id: integration.id,
          provider: integration.provider,
          userEmail: integration.user_email,
          folderPath: integration.folder_path
        },
        files: {
          total: result.entries.length,
          documents: documentFiles.length,
          documentList: documentFiles.map(file => ({
            name: file.name,
            size: formatFileSize(file.size || 0),
            modified: file.server_modified,
            path: file.path_display
          }))
        }
      })
      
    } catch (apiError) {
      console.error('❌ Dropbox API error:', apiError)
      return NextResponse.json({ 
        error: 'Failed to access Dropbox folder',
        details: apiError instanceof Error ? apiError.message : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Test processing error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function isDocumentFile(fileName: string): boolean {
  const extension = fileName.toLowerCase().split('.').pop()
  return ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'].includes(extension || '')
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}