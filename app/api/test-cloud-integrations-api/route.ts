import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing cloud integrations API...')
    
    const response = await fetch(`${request.nextUrl.origin}/api/cloud-integrations`)
    const data = await response.json()
    
    console.log('📊 API Response:', {
      status: response.status,
      ok: response.ok,
      hasIntegrations: !!data.integrations,
      integrationsCount: data.integrations?.length || 0,
      error: data.error
    })
    
    if (data.integrations && data.integrations.length > 0) {
      console.log('✅ Sample integration:', data.integrations[0])
    }
    
    return NextResponse.json({
      success: true,
      apiStatus: response.status,
      apiOk: response.ok,
      data: data,
      summary: {
        hasIntegrations: !!data.integrations,
        integrationsCount: data.integrations?.length || 0,
        hasError: !!data.error,
        error: data.error
      }
    })
  } catch (error) {
    console.error('❌ Error testing API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error testing API: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
