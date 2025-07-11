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

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    const url = new URL(request.url)
    const service = url.searchParams.get('service')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const supabase = createSupabaseClient()

    // Get webhook configurations
    let configQuery = supabase
      .from('webhook_configs')
      .select('*')
      .eq('tenant_id', tenantId)

    if (service) {
      configQuery = configQuery.eq('webhook_type', service)
    }

    const { data: configs, error: configError } = await configQuery
      .order('created_at', { ascending: false })

    if (configError) {
      console.error('Error fetching webhook configs:', configError)
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
    }

    // Get webhook activity logs
    let logsQuery = supabase
      .from('webhook_logs')
      .select('*')
      .eq('tenant_id', tenantId)

    if (service) {
      logsQuery = logsQuery.eq('service_type', service)
    }

    const { data: logs, error: logsError } = await logsQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (logsError) {
      console.error('Error fetching webhook logs:', logsError)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // Get statistics
    const stats = await getWebhookStats(tenantId, service)

    return NextResponse.json({
      success: true,
      tenantId,
      configs: configs || [],
      logs: logs || [],
      stats,
      pagination: {
        limit,
        offset,
        hasMore: (logs?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('Error monitoring webhooks:', error)
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 })
  }
}

async function getWebhookStats(tenantId: number, service?: string) {
  try {
    const supabase = createSupabaseClient()
    
    // Base query
    let baseQuery = supabase
      .from('webhook_logs')
      .select('activity_type, created_at')
      .eq('tenant_id', tenantId)
    
    if (service) {
      baseQuery = baseQuery.eq('service_type', service)
    }

    // Get recent activity (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: recentLogs } = await baseQuery
      .gte('created_at', yesterday.toISOString())

    // Get all-time stats
    const { data: allLogs } = await baseQuery

    const stats = {
      totalEvents: allLogs?.length || 0,
      recentEvents: recentLogs?.length || 0,
      eventsByType: {},
      recentEventsByType: {},
      successRate: 0,
      lastActivity: null
    }

    // Calculate event statistics
    if (allLogs) {
      allLogs.forEach(log => {
        stats.eventsByType[log.activity_type] = (stats.eventsByType[log.activity_type] || 0) + 1
        if (!stats.lastActivity || log.created_at > stats.lastActivity) {
          stats.lastActivity = log.created_at
        }
      })
    }

    if (recentLogs) {
      recentLogs.forEach(log => {
        stats.recentEventsByType[log.activity_type] = (stats.recentEventsByType[log.activity_type] || 0) + 1
      })
    }

    // Calculate success rate
    const successEvents = (stats.eventsByType['document_processed'] || 0) + (stats.eventsByType['test'] || 0)
    const errorEvents = stats.eventsByType['error'] || 0
    const totalProcessingEvents = successEvents + errorEvents
    
    if (totalProcessingEvents > 0) {
      stats.successRate = Math.round((successEvents / totalProcessingEvents) * 100)
    }

    return stats
  } catch (error) {
    console.error('Error calculating webhook stats:', error)
    return {
      totalEvents: 0,
      recentEvents: 0,
      eventsByType: {},
      recentEventsByType: {},
      successRate: 0,
      lastActivity: null
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, service } = await request.json()
    const tenantId = await getTenantId(request)

    if (!action) {
      return NextResponse.json({ error: 'Action parameter required' }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    switch (action) {
      case 'clear_logs':
        let deleteQuery = supabase
          .from('webhook_logs')
          .delete()
          .eq('tenant_id', tenantId)

        if (service) {
          deleteQuery = deleteQuery.eq('service_type', service)
        }

        const { error } = await deleteQuery

        if (error) {
          return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Logs cleared successfully' })

      case 'toggle_service':
        if (!service) {
          return NextResponse.json({ error: 'Service parameter required for toggle action' }, { status: 400 })
        }

        const { data: config } = await supabase
          .from('webhook_configs')
          .select('is_active')
          .eq('tenant_id', tenantId)
          .eq('webhook_type', service)
          .single()

        const newStatus = !config?.is_active

        const { error: updateError } = await supabase
          .from('webhook_configs')
          .update({ is_active: newStatus, updated_at: new Date().toISOString() })
          .eq('tenant_id', tenantId)
          .eq('webhook_type', service)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to toggle service' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: `Service ${newStatus ? 'enabled' : 'disabled'}`,
          isActive: newStatus
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error handling monitor action:', error)
    return NextResponse.json({ error: 'Failed to handle action' }, { status: 500 })
  }
}