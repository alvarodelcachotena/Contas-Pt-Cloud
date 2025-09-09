import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../lib/dropbox-api-client'

export async function POST(request: NextRequest) {
    try {
        const { accessToken, refreshToken, path = "" } = await request.json()

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
        }

        console.log(`📂 Listing Dropbox items at path: ${path || 'root'}`)

        // Create Dropbox API client
        const dropboxClient = new DropboxApiClient(accessToken, refreshToken)

        // List folder contents
        const result = await dropboxClient.listFolder(path)

        // Format items
        const items = result.entries.map(entry => ({
            id: entry.id,
            name: entry.name,
            path: entry.path_display,
            type: entry['.tag'] as 'file' | 'folder',
            size: entry.size,
            modified: entry.server_modified,
            hasChildren: entry['.tag'] === 'folder'
        }))

        console.log(`📋 Found ${items.length} items`)

        return NextResponse.json({
            success: true,
            currentPath: path,
            items
        })

    } catch (error) {
        console.error('❌ Error listing Dropbox items:', error)
        return NextResponse.json({
            error: 'Failed to list items',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
