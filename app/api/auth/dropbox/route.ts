import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../../lib/env-loader.js'

// Load environment variables strictly from .env file
loadEnvStrict()

// Use service role key to bypass RLS and avoid infinite recursion
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    console.log('🔐 Dropbox OAuth request:', { action, code: code ? 'present' : 'missing', error })

    if (error) {
      console.error('❌ Dropbox OAuth error:', error)
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dropbox Auth Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f8f9fa;
            }
            .error { 
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .error-icon {
              color: #dc3545;
              font-size: 3rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <div class="error-icon">✗</div>
            <h2>Authentication Cancelled</h2>
            <p>You can close this window and try again.</p>
          </div>
          <script>
            window.opener.postMessage({
              type: 'DROPBOX_AUTH_ERROR',
              error: 'User cancelled authentication'
            }, '*');
            
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `
      
      return new NextResponse(errorHtml, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (action === 'connect') {
      // Step 1: Redirect to Dropbox OAuth
      const clientId = process.env.DROPBOX_CLIENT_ID
      if (!clientId) {
        console.error('❌ DROPBOX_CLIENT_ID not configured')
        return NextResponse.redirect(new URL('/cloud-drives?error=config_missing', request.url))
      }

      // Get the correct base URL (same logic as callback route)
      const host = request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      
      // Use HTTPS for Replit domains
      const baseUrl = (host && host.includes('replit.dev')) ? `https://${host}` : `${protocol}://${host}`
      const redirectUri = `${baseUrl}/api/auth/dropbox/callback`
      
      const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `token_access_type=offline`

      console.log('🔄 Redirecting to Dropbox OAuth:', authUrl)
      console.log('🌐 Using redirect URI:', redirectUri)
      return NextResponse.redirect(authUrl)
    }

    if (code) {
      // Step 2: Exchange code for tokens
      const clientId = process.env.DROPBOX_CLIENT_ID
      const clientSecret = process.env.DROPBOX_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error('❌ Dropbox OAuth credentials not configured')
        return NextResponse.redirect(new URL('/cloud-drives?error=config_missing', request.url))
      }

      // Get the correct base URL (same logic as callback route)
      const host = request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const baseUrl = (host && host.includes('replit.dev')) ? `https://${host}` : `${protocol}://${host}`
      const redirectUri = `${baseUrl}/api/auth/dropbox/callback`
      
      console.log('🔄 Exchanging code for tokens...')
      const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('❌ Token exchange failed:', errorText)
        return NextResponse.redirect(new URL('/cloud-drives?error=token_exchange_failed', request.url))
      }

      const tokenData = await tokenResponse.json()
      console.log('✅ Token exchange successful')
      console.log('Access token length:', tokenData.access_token?.length || 0)
      console.log('Refresh token length:', tokenData.refresh_token?.length || 0)

      // Get user info
      const userResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      let userEmail = 'unknown@dropbox.com'
      if (userResponse.ok) {
        const userData = await userResponse.json()
        userEmail = userData.email
        console.log('📧 User email:', userEmail)
      }

      // Store in database
      const tenantId = 1 // DIAMOND NXT TRADING tenant

      const { data, error: dbError } = await supabase
        .from('cloud_drive_configs')
        .insert({
          tenant_id: tenantId,
          provider: 'dropbox',
          folder_path: '/input',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          is_active: true,
        })
        .select()

      if (dbError) {
        console.error('❌ Database error:', dbError)
        return NextResponse.redirect(new URL('/cloud-drives?error=database_error', request.url))
      }

      console.log('✅ Dropbox integration saved to database')
      
      // Return a page that sends a message to parent window and closes popup
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dropbox Connected</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f8f9fa;
            }
            .success { 
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .checkmark {
              color: #28a745;
              font-size: 3rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <div class="checkmark">✓</div>
            <h2>Dropbox Connected Successfully!</h2>
            <p>You can close this window.</p>
          </div>
          <script>
            // Send success message to parent window
            window.opener.postMessage({
              type: 'DROPBOX_AUTH_SUCCESS',
              email: '${userEmail}'
            }, '*');
            
            // Close popup after a short delay
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
        </html>
      `
      
      return new NextResponse(successHtml, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    return NextResponse.redirect(new URL('/cloud-drives?error=invalid_request', request.url))
  } catch (error) {
    console.error('❌ Dropbox OAuth error:', error)
    return NextResponse.redirect(new URL('/cloud-drives?error=server_error', request.url))
  }
}