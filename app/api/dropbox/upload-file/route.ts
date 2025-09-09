import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../lib/dropbox-api-client'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const path = formData.get('path') as string
        const accessToken = formData.get('accessToken') as string
        const refreshToken = formData.get('refreshToken') as string

        if (!file || !path || !accessToken) {
            return NextResponse.json({ error: 'File, path, and access token are required' }, { status: 400 })
        }

        console.log(`📤 Uploading file to Dropbox: ${path}`)

        // Create Dropbox API client
        const dropboxClient = new DropboxApiClient(accessToken, refreshToken)

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer())

        // Upload file
        const result = await dropboxClient.uploadFile(path, fileBuffer, 'overwrite')

        console.log(`✅ Uploaded file: ${result.name}`)

        return NextResponse.json({
            success: true,
            file: {
                id: result.id,
                name: result.name,
                path: result.path_display,
                type: 'file',
                size: result.size,
                modified: result.server_modified
            }
        })

    } catch (error) {
        console.error('❌ Error uploading file to Dropbox:', error)
        return NextResponse.json({
            error: 'Failed to upload file',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
