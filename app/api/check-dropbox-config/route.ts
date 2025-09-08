import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Verificando configuración de Dropbox...')

        // Verificar variables de entorno
        const hasClientId = !!process.env.DROPBOX_CLIENT_ID
        const hasClientSecret = !!process.env.DROPBOX_CLIENT_SECRET

        const config = {
            hasClientId,
            hasClientSecret,
            clientIdLength: process.env.DROPBOX_CLIENT_ID?.length || 0,
            clientSecretLength: process.env.DROPBOX_CLIENT_SECRET?.length || 0,
            clientIdPreview: process.env.DROPBOX_CLIENT_ID?.substring(0, 10) + '...' || 'No configurado',
            clientSecretPreview: process.env.DROPBOX_CLIENT_SECRET?.substring(0, 10) + '...' || 'No configurado'
        }

        console.log('📋 Configuración de Dropbox:', config)

        return NextResponse.json({
            success: true,
            config,
            message: hasClientId && hasClientSecret
                ? 'Configuración de Dropbox completa'
                : 'Faltan variables de entorno de Dropbox'
        })

    } catch (error) {
        console.error('❌ Error verificando configuración:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
