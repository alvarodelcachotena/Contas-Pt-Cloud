import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../lib/dropbox-api-client'

export async function POST(request: NextRequest) {
    try {
        const { accessToken, refreshToken, path } = await request.json()

        if (!accessToken || !path) {
            return NextResponse.json({ error: 'Access token and path are required' }, { status: 400 })
        }

        console.log(`📥 Downloading file from Dropbox: ${path}`)

        // Create Dropbox API client
        const dropboxClient = new DropboxApiClient(accessToken, refreshToken)

        // Download file
        const fileBuffer = await dropboxClient.downloadFile(path)

        console.log(`✅ Downloaded file: ${path}`)

        // Return file as response
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`
            }
        })

    } catch (error) {
        console.error('❌ Error downloading file from Dropbox:', error)
        return NextResponse.json({
            error: 'Failed to download file',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
