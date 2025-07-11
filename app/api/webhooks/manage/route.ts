import { NextRequest, NextResponse } from 'next/server'
import { loadEnvStrict } from '@/lib/env-loader.js'
import { getTenantId } from '@/lib/tenant-utils'
import { saveServiceCredentials, getServiceCredentials } from '@/lib/webhook-credentials'

loadEnvStrict()

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    const url = new URL(request.url)
    const service = url.searchParams.get('service')
    
    if (!service) {
      return NextResponse.json({ error: 'Service parameter required' }, { status: 400 })
    }

    const credentials = await getServiceCredentials(tenantId, service)
    
    // Return configuration info without exposing actual credentials
    const config = {
      tenantId,
      serviceType: service,
      hasCredentials: Object.keys(credentials).length > 0,
      credentialNames: Object.keys(credentials),
      isActive: true
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching webhook configuration:', error)
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    const { serviceType, credentials } = await request.json()

    if (!serviceType || !credentials) {
      return NextResponse.json({ error: 'Service type and credentials required' }, { status: 400 })
    }

    // Save credentials securely
    const success = await saveServiceCredentials(tenantId, serviceType, credentials)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `${serviceType} credentials saved successfully`,
        tenantId 
      })
    } else {
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error saving webhook configuration:', error)
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
  }
}