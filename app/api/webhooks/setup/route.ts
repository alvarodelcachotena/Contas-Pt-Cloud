import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')
  
  if (!provider) {
    return NextResponse.json({ error: 'Provider parameter required' }, { status: 400 })
  }

  // Setup OAuth URLs for different providers
  const setupUrls = {
    dropbox: generateDropboxAuthUrl(),
    google: generateGoogleAuthUrl(),
    // Add more providers as needed
  }

  const authUrl = setupUrls[provider as keyof typeof setupUrls]
  
  if (!authUrl) {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  }

  return NextResponse.json({ auth_url: authUrl })
}

function generateDropboxAuthUrl(): string {
  const clientId = process.env.DROPBOX_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/setup-redirect`
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId || '',
    redirect_uri: redirectUri,
    state: 'dropbox'
  })

  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`
}

function generateGoogleAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/setup-redirect`
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId || '',
    redirect_uri: redirectUri,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    state: 'google'
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}