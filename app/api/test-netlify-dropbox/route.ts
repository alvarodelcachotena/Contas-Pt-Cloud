import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando configuración de Dropbox en Netlify...')
    
    const clientId = process.env.DROPBOX_CLIENT_ID
    const clientSecret = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const configStatus = {
      hasClientId: !!clientId,
      clientIdPreview: clientId ? clientId.substring(0, 10) + '...' : null,
      hasClientSecret: !!clientSecret,
      clientSecretPreview: clientSecret ? clientSecret.substring(0, 10) + '...' : null,
      environment: process.env.NODE_ENV,
      isNetlify: !!process.env.NETLIFY,
      netlifyUrl: process.env.NETLIFY_URL || 'No definido'
    }
    
    console.log('📊 Estado de configuración:', configStatus)
    
    if (configStatus.hasClientId && configStatus.hasClientSecret) {
      console.log('✅ Configuración de Dropbox OK en Netlify.')
      return NextResponse.json({ 
        success: true, 
        config: configStatus,
        message: 'Configuración de Dropbox correcta en Netlify'
      })
    } else {
      console.error('❌ Faltan variables de entorno de Dropbox en Netlify.')
      return NextResponse.json({ 
        success: false, 
        error: 'DROPBOX_CLIENT_ID o SUPABASE_SERVICE_ROLE_KEY no configurados en Netlify.', 
        config: configStatus 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error verificando configuración:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno verificando configuración' 
    }, { status: 500 })
  }
}
