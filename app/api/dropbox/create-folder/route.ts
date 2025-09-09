import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../lib/dropbox-api-client'

export async function POST(request: NextRequest) {
    try {
        const { accessToken, refreshToken, path } = await request.json()

        if (!accessToken || !path) {
            return NextResponse.json({ error: 'Access token and path are required' }, { status: 400 })
        }

        console.log(`📁 Creating Dropbox folder at path: ${path}`)

        // Create Dropbox API client
        const dropboxClient = new DropboxApiClient(accessToken, refreshToken)

        // Create folder
        const result = await dropboxClient.createFolder(path)

        console.log(`✅ Created folder: ${result.name}`)

        return NextResponse.json({
            success: true,
            folder: {
                id: result.id,
                name: result.name,
                path: result.path_display,
                type: 'folder'
            }
        })

    } catch (error) {
        console.error('❌ Error creating Dropbox folder:', error)
        return NextResponse.json({
            error: 'Failed to create folder',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
