import { NextRequest, NextResponse } from 'next/server'

const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET

// Get the correct base URL for redirects
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  
  // Use HTTPS for Replit domains
  if (host && host.includes('replit.dev')) {
    return `https://${host}`
  }
  
  return `${protocol}://${host}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  const baseUrl = getBaseUrl(request)
  const redirectUri = `${baseUrl}/api/auth/dropbox/callback`

  if (error) {
    console.error('Erro na autenticação Dropbox:', error)
    return NextResponse.redirect(`${baseUrl}/cloud-drives?error=auth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/cloud-drives?error=no_code`)
  }

  try {
    // Trocar o código por um token de acesso
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: DROPBOX_CLIENT_ID!,
        client_secret: DROPBOX_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('🎫 Resposta de token do Dropbox:', { 
      ok: tokenResponse.ok, 
      status: tokenResponse.status,
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type
    })

    if (!tokenResponse.ok) {
      console.error('❌ Erro ao obter token do Dropbox:', tokenData)
      return NextResponse.redirect(`${baseUrl}/cloud-drives?error=token_failed`)
    }

    // Obter informação do usuário do Dropbox
    console.log('🔑 Token de acceso obtenido:', tokenData.access_token ? 'SÍ' : 'NO')
    
    const userResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: 'null'
    })

    console.log('📡 Resposta do Dropbox - Status:', userResponse.status)
    console.log('📡 Resposta do Dropbox - Headers:', Object.fromEntries(userResponse.headers.entries()))

    if (!userResponse.ok) {
      console.error('❌ Erro ao obter dados do usuário Dropbox - Status:', userResponse.status)
      const errorText = await userResponse.text()
      console.error('❌ Resposta de erro completa:', errorText)
      return NextResponse.redirect(`${baseUrl}/cloud-drives?error=user_failed`)
    }

    // Tentar fazer parse do JSON de forma segura
    let userData
    try {
      const responseText = await userResponse.text()
      console.log('📄 Resposta bruta do Dropbox:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''))
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Resposta vazia do Dropbox')
      }
      
      userData = JSON.parse(responseText)
      console.log('✅ Dados do usuário parseados:', { 
        account_id: userData.account_id, 
        email: userData.email,
        name: userData.name 
      })
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta JSON do Dropbox:', parseError)
      return NextResponse.redirect(`${baseUrl}/cloud-drives?error=user_failed`)
    }

    // Guardar la configuración usando la API interna
    try {
      const saveResponse = await fetch(`${baseUrl}/api/cloud-integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'dropbox',
          provider_user_id: userData.account_id,
          user_email: userData.email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        }),
      })

      if (!saveResponse.ok) {
        console.error('Erro ao guardar configuração Dropbox na API')
        return NextResponse.redirect(`${baseUrl}/cloud-drives?error=save_failed`)
      }

      console.log('✅ Configuração Dropbox guardada com sucesso')
    } catch (saveError) {
      console.error('Erro ao guardar configuração Dropbox:', saveError)
      return NextResponse.redirect(`${baseUrl}/cloud-drives?error=save_failed`)
    }

    return NextResponse.redirect(`${baseUrl}/cloud-drives?success=dropbox_connected`)
  } catch (error) {
    console.error('Erro no callback Dropbox:', error)
    return NextResponse.redirect(`${baseUrl}/cloud-drives?error=callback_failed`)
  }
} 