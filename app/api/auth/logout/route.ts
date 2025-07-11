import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔓 Logout request received')
    
    // Create response with logout success
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
    // Clear any authentication cookies if they exist
    response.cookies.delete('connect.sid')
    response.cookies.delete('session')
    response.cookies.delete('auth-token')
    
    console.log('✅ Logout successful - cookies cleared')
    
    return response
  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}