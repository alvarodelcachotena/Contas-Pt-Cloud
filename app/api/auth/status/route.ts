import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check for authentication data in localStorage (client-side persistence)
    // Since we can't access localStorage server-side, we'll check for auth headers
    const authHeader = request.headers.get('authorization')
    const userIdHeader = request.headers.get('x-user-id')
    const tenantIdHeader = request.headers.get('x-tenant-id')
    
    if (authHeader === 'authenticated' && userIdHeader && tenantIdHeader) {
      return NextResponse.json({
        isAuthenticated: true,
        user: {
          id: userIdHeader,
          email: request.headers.get('x-user-email') || '',
          name: request.headers.get('x-user-name') || '',
          role: request.headers.get('x-user-role') || 'user'
        },
        tenant: {
          id: tenantIdHeader,
          name: request.headers.get('x-tenant-name') || '',
          nif: request.headers.get('x-tenant-nif') || ''
        }
      })
    }

    return NextResponse.json({
      isAuthenticated: false,
      user: null,
      tenant: null
    })
  } catch (error) {
    console.error('Auth status error:', error)
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
      tenant: null
    })
  }
}