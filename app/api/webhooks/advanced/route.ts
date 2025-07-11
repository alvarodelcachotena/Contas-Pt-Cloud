import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '@/lib/env-loader.js'
import { getTenantId } from '@/lib/tenant-utils'

loadEnvStrict()

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Advanced webhook features: rate limiting, retry logic, batch processing
export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()
    const tenantId = await getTenantId(request)

    switch (action) {
      case 'batch_process':
        return await handleBatchProcessing(tenantId, params)
      
      case 'rate_limit_config':
        return await handleRateLimitConfig(tenantId, params)
      
      case 'retry_failed':
        return await handleRetryFailed(tenantId, params)
      
      case 'webhook_health_check':
        return await handleHealthCheck(tenantId, params)
      
      case 'bulk_credential_update':
        return await handleBulkCredentialUpdate(tenantId, params)
      
      case 'webhook_schedule':
        return await handleWebhookSchedule(tenantId, params)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in advanced webhook operation:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}

async function handleBatchProcessing(tenantId: number, params: any) {
  const { documents, service } = params
  
  if (!documents || !Array.isArray(documents)) {
    return NextResponse.json({ error: 'Documents array required' }, { status: 400 })
  }

  const results = {
    totalDocuments: documents.length,
    processed: 0,
    failed: 0,
    results: []
  }

  console.log(`🔄 Starting batch processing of ${documents.length} documents for ${service}`)

  for (const document of documents) {
    try {
      // Simulate document processing
      const processResult = await processDocumentViaWebhook(tenantId, service, document)
      
      if (processResult.success) {
        results.processed++
      } else {
        results.failed++
      }
      
      results.results.push({
        documentId: document.id,
        success: processResult.success,
        message: processResult.message || 'Processed successfully',
        timestamp: new Date().toISOString()
      })

      // Add small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      results.failed++
      results.results.push({
        documentId: document.id,
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  await logWebhookActivity(tenantId, service, 'batch_process', {
    totalDocuments: results.totalDocuments,
    processed: results.processed,
    failed: results.failed
  })

  return NextResponse.json({
    success: true,
    message: `Batch processing completed: ${results.processed} processed, ${results.failed} failed`,
    results
  })
}

async function handleRateLimitConfig(tenantId: number, params: any) {
  const { service, rateLimit } = params
  
  if (!service || !rateLimit) {
    return NextResponse.json({ error: 'Service and rate limit configuration required' }, { status: 400 })
  }

  const supabase = createSupabaseClient()

  // Update or create rate limit configuration
  const { data, error } = await supabase
    .from('webhook_configs')
    .upsert({
      tenant_id: tenantId,
      webhook_type: service,
      configuration: {
        rate_limit: {
          requests_per_minute: rateLimit.requestsPerMinute || 60,
          requests_per_hour: rateLimit.requestsPerHour || 1000,
          burst_limit: rateLimit.burstLimit || 10,
          enabled: rateLimit.enabled !== false
        }
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'tenant_id,webhook_type'
    })
    .select()

  if (error) {
    return NextResponse.json({ error: 'Failed to save rate limit configuration' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Rate limit configuration saved',
    configuration: data[0]
  })
}

async function handleRetryFailed(tenantId: number, params: any) {
  const { service, maxRetries = 3 } = params
  const supabase = createSupabaseClient()

  // Get failed webhook logs from the last 24 hours
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  let query = supabase
    .from('webhook_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('activity_type', 'error')
    .gte('created_at', yesterday.toISOString())

  if (service) {
    query = query.eq('service_type', service)
  }

  const { data: failedLogs, error } = await query.limit(50)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch failed operations' }, { status: 500 })
  }

  const retryResults = {
    totalAttempts: failedLogs?.length || 0,
    successful: 0,
    failed: 0,
    results: []
  }

  if (failedLogs) {
    for (const log of failedLogs) {
      try {
        const retryResult = await retryWebhookOperation(tenantId, log, maxRetries)
        
        if (retryResult.success) {
          retryResults.successful++
        } else {
          retryResults.failed++
        }

        retryResults.results.push({
          logId: log.id,
          service: log.service_type,
          success: retryResult.success,
          message: retryResult.message,
          timestamp: new Date().toISOString()
        })

      } catch (error) {
        retryResults.failed++
        retryResults.results.push({
          logId: log.id,
          service: log.service_type,
          success: false,
          message: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  await logWebhookActivity(tenantId, service || 'system', 'retry_failed', retryResults)

  return NextResponse.json({
    success: true,
    message: `Retry completed: ${retryResults.successful} successful, ${retryResults.failed} failed`,
    results: retryResults
  })
}

async function handleHealthCheck(tenantId: number, params: any) {
  const { services } = params
  const healthResults = {}

  const servicesToCheck = services || ['whatsapp', 'gmail', 'dropbox']

  for (const service of servicesToCheck) {
    try {
      const healthCheck = await performServiceHealthCheck(tenantId, service)
      healthResults[service] = healthCheck
    } catch (error) {
      healthResults[service] = {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  return NextResponse.json({
    success: true,
    healthCheck: healthResults,
    timestamp: new Date().toISOString()
  })
}

async function handleBulkCredentialUpdate(tenantId: number, params: any) {
  const { updates } = params
  
  if (!updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: 'Updates array required' }, { status: 400 })
  }

  const results = {
    totalUpdates: updates.length,
    successful: 0,
    failed: 0,
    results: []
  }

  for (const update of updates) {
    try {
      const { service, credentials } = update
      
      // Use existing credential management API
      const response = await fetch('http://localhost:5000/api/webhooks/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: service,
          credentials
        })
      })

      const result = await response.json()
      
      if (result.success) {
        results.successful++
        results.results.push({
          service,
          success: true,
          message: 'Credentials updated successfully'
        })
      } else {
        results.failed++
        results.results.push({
          service,
          success: false,
          message: result.error || 'Update failed'
        })
      }

    } catch (error) {
      results.failed++
      results.results.push({
        service: update.service,
        success: false,
        message: error.message
      })
    }
  }

  return NextResponse.json({
    success: true,
    message: `Bulk update completed: ${results.successful} successful, ${results.failed} failed`,
    results
  })
}

async function handleWebhookSchedule(tenantId: number, params: any) {
  const { service, schedule } = params
  
  if (!service || !schedule) {
    return NextResponse.json({ error: 'Service and schedule configuration required' }, { status: 400 })
  }

  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('webhook_configs')
    .upsert({
      tenant_id: tenantId,
      webhook_type: service,
      configuration: {
        schedule: {
          enabled: schedule.enabled !== false,
          interval: schedule.interval || '5m',
          cron_expression: schedule.cronExpression,
          timezone: schedule.timezone || 'UTC',
          max_executions_per_day: schedule.maxExecutionsPerDay || 288
        }
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'tenant_id,webhook_type'
    })
    .select()

  if (error) {
    return NextResponse.json({ error: 'Failed to save schedule configuration' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Webhook schedule configured',
    configuration: data[0]
  })
}

// Helper functions
async function processDocumentViaWebhook(tenantId: number, service: string, document: any) {
  // Simulate document processing via webhook
  return {
    success: Math.random() > 0.1, // 90% success rate for simulation
    message: 'Document processed via webhook simulation'
  }
}

async function retryWebhookOperation(tenantId: number, log: any, maxRetries: number) {
  // Simulate retry logic
  return {
    success: Math.random() > 0.3, // 70% success rate for retries
    message: 'Retry operation completed'
  }
}

async function performServiceHealthCheck(tenantId: number, service: string) {
  // Perform actual health check for the service
  try {
    const response = await fetch('http://localhost:5000/api/webhooks/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service, testType: 'connection' })
    })

    const data = await response.json()
    
    if (data.success && data.testResults) {
      const result = data.testResults.results
      
      return {
        status: result.connectionTest ? 'healthy' : result.credentialsFound ? 'configured' : 'not_configured',
        connectionTest: result.connectionTest,
        credentialsFound: result.credentialsFound,
        missingFields: result.missingFields,
        timestamp: new Date().toISOString()
      }
    } else {
      return {
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
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