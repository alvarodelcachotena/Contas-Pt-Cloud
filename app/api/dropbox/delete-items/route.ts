import { NextRequest, NextResponse } from 'next/server'
import { DropboxApiClient } from '../../../../lib/dropbox-api-client'

export async function POST(request: NextRequest) {
    try {
        const { accessToken, refreshToken, paths } = await request.json()

        if (!accessToken || !paths || !Array.isArray(paths)) {
            return NextResponse.json({ error: 'Access token and paths array are required' }, { status: 400 })
        }

        console.log(`🗑️ Deleting Dropbox items: ${paths.join(', ')}`)

        // Create Dropbox API client
        const dropboxClient = new DropboxApiClient(accessToken, refreshToken)

        // Delete each item
        const results = await Promise.all(
            paths.map(async (path: string) => {
                try {
                    const response = await dropboxClient.makeRequest('https://api.dropboxapi.com/2/files/delete_v2', {
                        method: 'POST',
                        body: JSON.stringify({ path })
                    })

                    if (!response.ok) {
                        throw new Error(`Failed to delete ${path}: ${response.status}`)
                    }

                    return { path, success: true }
                } catch (error) {
                    console.error(`❌ Error deleting ${path}:`, error)
                    return { path, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
                }
            })
        )

        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

        console.log(`✅ Deleted ${successful.length} items, ${failed.length} failed`)

        return NextResponse.json({
            success: true,
            deleted: successful.length,
            failed: failed.length,
            results
        })

    } catch (error) {
        console.error('❌ Error deleting Dropbox items:', error)
        return NextResponse.json({
            error: 'Failed to delete items',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
