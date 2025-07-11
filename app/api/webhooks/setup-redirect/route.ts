import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/cloud-drives?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/cloud-drives?error=missing_code`)
    }

    console.log(`✅ OAuth callback received for ${state} with code: ${code.substring(0, 10)}...`)

    // Exchange code for tokens based on provider
    let tokenData
    if (state === 'dropbox') {
      tokenData = await exchangeDropboxCode(code)
    } else if (state === 'google') {
      tokenData = await exchangeGoogleCode(code)
    } else {
      throw new Error('Unknown provider state')
    }

    if (tokenData) {
      // Save configuration via webhook endpoint
      const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/save-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: state,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          user_email: 'aki.diamondnxt@gmail.com' // In production, get from session
        })
      })

      if (saveResponse.ok) {
        console.log(`✅ Successfully saved ${state} configuration`)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/cloud-drives?success=connected`)
      } else {
        throw new Error('Failed to save configuration')
      }
    }

    throw new Error('Failed to exchange authorization code')

  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/cloud-drives?error=callback_failed`)
  }
}

async function exchangeDropboxCode(code: string) {
  try {
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.DROPBOX_CLIENT_ID || '',
        client_secret: process.env.DROPBOX_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/setup-redirect`
      })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange Dropbox code')
    }

    return await response.json()
  } catch (error) {
    console.error('Error exchanging Dropbox code:', error)
    return null
  }
}

async function exchangeGoogleCode(code: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/setup-redirect`
      })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange Google code')
    }

    return await response.json()
  } catch (error) {
    console.error('Error exchanging Google code:', error)
    return null
  }
}