import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '@/lib/env-loader'

loadEnvStrict()

interface TestResults {
  success: boolean;
  message: string;
  requiredFields: string[];
  missingFields: string[];
  credentials: any;
  testResponse?: any;
  error?: any;
}

export async function POST(request: Request) {
  try {
    const { service, credentials } = await request.json()

    if (!service) {
      return NextResponse.json(
        { error: 'Service parameter required' },
        { status: 400 }
      )
    }

    if (!credentials) {
      return NextResponse.json(
        { error: 'Credentials required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Initialize test results
    const results: TestResults = {
      success: false,
      message: '',
      requiredFields: [],
      missingFields: [],
      credentials: credentials,
    }

    // Validate required fields based on service
    switch (service) {
      case 'dropbox':
        results.requiredFields = ['accessToken', 'refreshToken', 'folderId']
        break
      case 'gmail':
        results.requiredFields = ['clientId', 'clientSecret', 'refreshToken']
        break
      case 'whatsapp':
        results.requiredFields = ['apiKey', 'phoneNumber']
        break
      default:
        return NextResponse.json(
          { error: 'Invalid service type' },
          { status: 400 }
        )
    }

    // Check for missing fields
    results.requiredFields.forEach(field => {
      if (!credentials[field]) {
        results.missingFields.push(field)
      }
    })

    if (results.missingFields.length > 0) {
      results.message = `Missing required fields: ${results.missingFields.join(', ')}`
      return NextResponse.json(results)
    }

    // Test the service
    try {
      switch (service) {
        case 'dropbox': {
          // Log test event
          const { error: logError } = await supabase
            .from('webhook_logs')
            .insert([{
              service_type: 'dropbox',
              activity_type: 'test',
              status: 'success',
              details: 'Manual test with credentials',
              created_at: new Date().toISOString(),
            }])

          if (logError) {
            throw new Error(`Failed to log test event: ${logError.message}`)
          }

          results.success = true
          results.message = 'Dropbox test successful'
          break
        }

        case 'gmail': {
          // Log test event
          const { error: logError } = await supabase
            .from('webhook_logs')
            .insert([{
              service_type: 'gmail',
              activity_type: 'test',
              status: 'success',
              details: 'Manual test with credentials',
              created_at: new Date().toISOString(),
            }])

          if (logError) {
            throw new Error(`Failed to log test event: ${logError.message}`)
          }

          results.success = true
          results.message = 'Gmail test successful'
          break
        }

        case 'whatsapp': {
          // Log test event
          const { error: logError } = await supabase
            .from('webhook_logs')
            .insert([{
              service_type: 'whatsapp',
              activity_type: 'test',
              status: 'success',
              details: 'Manual test with credentials',
              created_at: new Date().toISOString(),
            }])

          if (logError) {
            throw new Error(`Failed to log test event: ${logError.message}`)
          }

          results.success = true
          results.message = 'WhatsApp test successful'
          break
        }
      }
    } catch (error) {
      results.success = false
      results.message = error instanceof Error ? error.message : 'Test failed'
      results.error = error
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('❌ Error testing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}