import { NextRequest, NextResponse } from 'next/server'

const ONEDRIVE_CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID
const ONEDRIVE_CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET
const REDIRECT_URI = `http://localhost:5000/api/auth/onedrive/callback`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'connect') {
    if (!ONEDRIVE_CLIENT_ID) {
      return NextResponse.json({ 
        error: 'OneDrive no está configurado. Añade ONEDRIVE_CLIENT_ID y ONEDRIVE_CLIENT_SECRET al archivo .env' 
      }, { status: 400 })
    }

    // Iniciar el flujo OAuth de OneDrive
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${ONEDRIVE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/User.Read')}&` +
      `response_mode=query`

    return NextResponse.redirect(authUrl)
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
} 