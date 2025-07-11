import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `http://localhost:5000/api/auth/google-drive/callback`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('Erro na autenticação Google Drive:', error)
    return NextResponse.redirect('http://localhost:5000/cloud-drives?error=auth_failed')
  }

  if (!code) {
    return NextResponse.redirect('http://localhost:5000/cloud-drives?error=no_code')
  }

  try {
    // Intercambiar el código por un token de acceso
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Error obteniendo token Google Drive:', tokenData)
      return NextResponse.redirect('http://localhost:5000/cloud-drives?error=token_failed')
    }

    // Obtener información del usuario de Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Error obteniendo datos de usuario Google. Status:', userResponse.status)
      const errorText = await userResponse.text()
      console.error('Respuesta de error:', errorText)
      return NextResponse.redirect('http://localhost:5000/cloud-drives?error=user_failed')
    }

    const userData = await userResponse.json()

    // Guardar la configuración usando la API interna
    try {
      const saveResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:5000'}/api/cloud-integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'googledrive',
          provider_user_id: userData.id,
          user_email: userData.email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        }),
      })

      if (!saveResponse.ok) {
        console.error('Error guardando configuración Google Drive en API')
        return NextResponse.redirect('http://localhost:5000/cloud-drives?error=save_failed')
      }

      console.log('✅ Configuración Google Drive guardada com sucesso')
    } catch (saveError) {
      console.error('Error guardando configuración Google Drive:', saveError)
      return NextResponse.redirect('http://localhost:5000/cloud-drives?error=save_failed')
    }

    return NextResponse.redirect('http://localhost:5000/cloud-drives?success=googledrive_connected')
  } catch (error) {
    console.error('Erro no callback Google Drive:', error)
    return NextResponse.redirect('http://localhost:5000/cloud-drives?error=callback_failed')
  }
} 