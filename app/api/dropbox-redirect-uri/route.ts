import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const host = request.headers.get('host')
        const protocol = request.headers.get('x-forwarded-proto') || 'http'

        // Handle localhost and development environments
        let baseUrl: string
        if (host && host.includes('localhost')) {
            baseUrl = `http://${host}`
        } else if (host && host.includes('replit.dev')) {
            baseUrl = `https://${host}`
        } else {
            baseUrl = `${protocol}://${host}`
        }

        const redirectUri = `${baseUrl}/api/auth/dropbox/callback`

        return NextResponse.json({
            success: true,
            host,
            protocol,
            baseUrl,
            redirectUri,
            message: `Configura esta URL en tu aplicación de Dropbox: ${redirectUri}`
        })

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
