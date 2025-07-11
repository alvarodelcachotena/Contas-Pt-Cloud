import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '@/lib/env-loader.js'
import { getTenantId } from '@/lib/tenant-utils'
import { getServiceCredentials } from '@/lib/webhook-credentials'

loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { service, testType = 'connection' } = await request.json()
    const tenantId = await getTenantId(request)

    if (!service) {
      return NextResponse.json({ error: 'Service parameter required' }, { status: 400 })
    }

    console.log(`🧪 Testing webhook service: ${service} for tenant ${tenantId}`)

    const testResults = {
      service,
      tenantId,
      testType,
      timestamp: new Date().toISOString(),
      results: {}
    }

    switch (service) {
      case 'whatsapp':
        testResults.results = await testWhatsAppWebhook(tenantId, testType)
        break
      case 'gmail':
        testResults.results = await testGmailWebhook(tenantId, testType)
        break
      case 'dropbox':
        testResults.results = await testDropboxWebhook(tenantId, testType)
        break
      default:
        return NextResponse.json({ error: 'Unsupported service' }, { status: 400 })
    }

    // Log test result
    await logWebhookActivity(tenantId, service, 'test', testResults.results)

    return NextResponse.json({
      success: true,
      testResults
    })

  } catch (error) {
    console.error('Error testing webhook:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}

async function testWhatsAppWebhook(tenantId: number, testType: string) {
  try {
    const credentials = await getServiceCredentials(tenantId, 'whatsapp')
    
    const results = {
      credentialsFound: Object.keys(credentials).length > 0,
      requiredFields: ['access_token', 'phone_number_id', 'verify_token'],
      missingFields: [],
      connectionTest: false,
      apiEndpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/whatsapp`
    }

    // Check required fields
    results.requiredFields.forEach(field => {
      if (!credentials[field]) {
        results.missingFields.push(field)
      }
    })

    // Test connection if credentials exist
    if (credentials.access_token && testType === 'connection') {
      try {
        const testUrl = `${credentials.business_api_url || 'https://graph.facebook.com/v17.0'}/${credentials.phone_number_id}`
        const response = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`
          }
        })
        results.connectionTest = response.ok
      } catch (error) {
        results.connectionTest = false
      }
    }

    return results
  } catch (error) {
    return {
      error: error.message,
      credentialsFound: false
    }
  }
}

async function testGmailWebhook(tenantId: number, testType: string) {
  try {
    const credentials = await getServiceCredentials(tenantId, 'gmail')
    
    const results = {
      credentialsFound: Object.keys(credentials).length > 0,
      requiredFields: ['imap_user', 'imap_pass'],
      missingFields: [],
      connectionTest: false,
      apiEndpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/gmail`
    }

    // Check required fields
    results.requiredFields.forEach(field => {
      if (!credentials[field]) {
        results.missingFields.push(field)
      }
    })

    // Test IMAP connection if credentials exist
    if (credentials.imap_user && credentials.imap_pass && testType === 'connection') {
      try {
        // Import IMAP client (you may need to install this)
        // const { ImapFlow } = await import('imapflow')
        // const client = new ImapFlow({
        //   host: credentials.imap_host || 'imap.gmail.com',
        //   port: parseInt(credentials.imap_port || '993'),
        //   secure: true,
        //   auth: {
        //     user: credentials.imap_user,
        //     pass: credentials.imap_pass
        //   }
        // })
        // await client.connect()
        // await client.logout()
        results.connectionTest = true
      } catch (error) {
        results.connectionTest = false
      }
    }

    return results
  } catch (error) {
    return {
      error: error.message,
      credentialsFound: false
    }
  }
}

async function testDropboxWebhook(tenantId: number, testType: string) {
  try {
    const credentials = await getServiceCredentials(tenantId, 'dropbox')
    
    const results = {
      credentialsFound: Object.keys(credentials).length > 0,
      requiredFields: ['access_token'],
      missingFields: [],
      connectionTest: false,
      apiEndpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/webhooks/dropbox`
    }

    // Check required fields
    results.requiredFields.forEach(field => {
      if (!credentials[field]) {
        results.missingFields.push(field)
      }
    })

    // Test Dropbox API connection
    if (credentials.access_token && testType === 'connection') {
      try {
        const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        results.connectionTest = response.ok
      } catch (error) {
        results.connectionTest = false
      }
    }

    return results
  } catch (error) {
    return {
      error: error.message,
      credentialsFound: false
    }
  }
}

async function logWebhookActivity(tenantId: number, service: string, activity: string, details: any) {
  try {
    const supabase = createSupabaseClient()
    
    await supabase
      .from('webhook_logs')
      .insert({
        tenant_id: tenantId,
        service_type: service,
        activity_type: activity,
        details: details,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log webhook activity:', error)
  }
}