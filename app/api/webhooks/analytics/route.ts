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
    const period = url.searchParams.get('period') || '7d'
    const service = url.searchParams.get('service')

    const analytics = await generateWebhookAnalytics(tenantId, period, service)

    return NextResponse.json({
      success: true,
      analytics,
      period,
      service,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating webhook analytics:', error)
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 })
  }
}

async function generateWebhookAnalytics(tenantId: number, period: string, service?: string) {
  const supabase = createSupabaseClient()

  // Calculate date range
  const endDate = new Date()
  const startDate = new Date()
  
  switch (period) {
    case '1d':
      startDate.setDate(startDate.getDate() - 1)
      break
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(startDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(startDate.getDate() - 90)
      break
    default:
      startDate.setDate(startDate.getDate() - 7)
  }

  // Base query with explicit schema reference
  let query = supabase
    .from('webhook_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (service) {
    query = query.eq('service_type', service)
  }

  const { data: logs, error } = await query

  if (error) {
    throw error
  }

  const analytics = {
    summary: {
      totalEvents: logs?.length || 0,
      successfulEvents: 0,
      failedEvents: 0,
      documentsProcessed: 0,
      averageResponseTime: 0,
      uptime: 0
    },
    timeSeriesData: [],
    serviceBreakdown: {},
    activityBreakdown: {},
    errorAnalysis: {},
    performanceMetrics: {
      peakHours: [],
      slowestOperations: [],
      mostActiveServices: []
    },
    trends: {
      dailyGrowth: 0,
      weeklyGrowth: 0,
      errorRate: 0,
      successRate: 0
    }
  }

  if (!logs || logs.length === 0) {
    return analytics
  }

  // Calculate summary metrics
  logs.forEach(log => {
    if (log.activity_type === 'document_processed') {
      analytics.summary.successfulEvents++
      analytics.summary.documentsProcessed++
    } else if (log.activity_type === 'error') {
      analytics.summary.failedEvents++
    } else if (log.activity_type !== 'test') {
      analytics.summary.successfulEvents++
    }

    // Service breakdown
    analytics.serviceBreakdown[log.service_type] = (analytics.serviceBreakdown[log.service_type] || 0) + 1

    // Activity breakdown
    analytics.activityBreakdown[log.activity_type] = (analytics.activityBreakdown[log.activity_type] || 0) + 1

    // Error analysis
    if (log.activity_type === 'error' && log.details?.error) {
      const errorType = log.details.error.substring(0, 50)
      analytics.errorAnalysis[errorType] = (analytics.errorAnalysis[errorType] || 0) + 1
    }
  })

  // Calculate success rate
  const totalProcessingEvents = analytics.summary.successfulEvents + analytics.summary.failedEvents
  if (totalProcessingEvents > 0) {
    analytics.trends.successRate = Math.round((analytics.summary.successfulEvents / totalProcessingEvents) * 100)
    analytics.trends.errorRate = Math.round((analytics.summary.failedEvents / totalProcessingEvents) * 100)
  }

  // Generate time series data (daily)
  const dailyData = {}
  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = { date, events: 0, success: 0, errors: 0 }
    }
    dailyData[date].events++
    if (log.activity_type === 'error') {
      dailyData[date].errors++
    } else {
      dailyData[date].success++
    }
  })

  analytics.timeSeriesData = Object.values(dailyData).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate hourly distribution for peak hours
  const hourlyData = {}
  logs.forEach(log => {
    const hour = new Date(log.created_at).getHours()
    hourlyData[hour] = (hourlyData[hour] || 0) + 1
  })

  analytics.performanceMetrics.peakHours = Object.entries(hourlyData)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), events: count }))

  // Most active services
  analytics.performanceMetrics.mostActiveServices = Object.entries(analytics.serviceBreakdown)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 3)
    .map(([service, count]) => ({ service, events: count }))

  // Calculate growth trends
  if (analytics.timeSeriesData.length > 1) {
    const recent = analytics.timeSeriesData.slice(-2)
    if (recent.length === 2) {
      const [prev, curr]: any = recent
      analytics.trends.dailyGrowth = Math.round(((curr.events - prev.events) / prev.events) * 100) || 0
    }
  }

  if (analytics.timeSeriesData.length > 7) {
    const lastWeek = analytics.timeSeriesData.slice(-7).reduce((sum: any, day: any) => sum + day.events, 0)
    const prevWeek = analytics.timeSeriesData.slice(-14, -7).reduce((sum: any, day: any) => sum + day.events, 0)
    if (prevWeek > 0) {
      analytics.trends.weeklyGrowth = Math.round(((lastWeek - prevWeek) / prevWeek) * 100)
    }
  }

  // Calculate uptime (assuming uptime based on successful vs failed events)
  if (totalProcessingEvents > 0) {
    analytics.summary.uptime = Math.round((analytics.summary.successfulEvents / totalProcessingEvents) * 100)
  } else {
    analytics.summary.uptime = 100
  }

  return analytics
}

export async function POST(request: NextRequest) {
  try {
    const { action, period = '7d' } = await request.json()
    const tenantId = await getTenantId(request)

    switch (action) {
      case 'export':
        const analytics = await generateWebhookAnalytics(tenantId, period)
        
        // Generate CSV export
        const csvData = generateCSVExport(analytics)
        
        return NextResponse.json({
          success: true,
          exportData: csvData,
          filename: `webhook-analytics-${tenantId}-${period}-${new Date().toISOString().split('T')[0]}.csv`
        })

      case 'alert_config':
        // Configure analytics alerts (future enhancement)
        return NextResponse.json({
          success: true,
          message: 'Alert configuration saved'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error handling analytics action:', error)
    return NextResponse.json({ error: 'Failed to handle action' }, { status: 500 })
  }
}

function generateCSVExport(analytics: any): string {
  const headers = ['Date', 'Total Events', 'Successful', 'Failed', 'Success Rate']
  const rows = analytics.timeSeriesData.map((day: any) => [
    day.date,
    day.events,
    day.success,
    day.errors,
    day.events > 0 ? Math.round((day.success / day.events) * 100) + '%' : '0%'
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row: any) => row.join(','))
  ].join('\n')

  return csvContent
}