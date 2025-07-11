import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../server/dropbox-api-client'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, path = "" } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    console.log(`📂 Exploring Dropbox folders at path: ${path || 'root'}`)
    
    // Create Dropbox API client
    const dropboxClient = new DropboxApiClient(accessToken, refreshToken)
    
    // List folder contents
    const result = await dropboxClient.listFolder(path)
    
    // Filter and format folders
    const folders = result.entries
      .filter(entry => entry['.tag'] === 'folder')
      .map(folder => ({
        id: folder.id,
        name: folder.name,
        path: folder.path_display,
        hasChildren: true // We'll assume folders might have subfolders
      }))
    
    // Count documents in each folder
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        try {
          const folderResult = await dropboxClient.listFolder(folder.path)
          const documentCount = folderResult.entries.filter(entry => 
            entry['.tag'] === 'file' && isDocumentFile(entry.name)
          ).length
          
          return {
            ...folder,
            documentCount
          }
        } catch (error) {
          console.warn(`Could not count documents in ${folder.path}:`, error)
          return {
            ...folder,
            documentCount: 0
          }
        }
      })
    )
    
    console.log(`📋 Found ${foldersWithCounts.length} folders`)
    
    return NextResponse.json({
      success: true,
      currentPath: path,
      folders: foldersWithCounts
    })
    
  } catch (error) {
    console.error('❌ Error exploring Dropbox folders:', error)
    return NextResponse.json({ 
      error: 'Failed to explore folders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function isDocumentFile(fileName: string): boolean {
  const extension = fileName.toLowerCase().split('.').pop()
  return ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'].includes(extension || '')
}