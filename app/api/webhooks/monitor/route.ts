import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '@/lib/env-loader'
import { getTenantId } from '@/lib/tenant-utils'

loadEnvStrict()

interface WebhookLog {
  activity_type: string;
  created_at: string;
}

interface WebhookConfig {
  is_active: boolean;
  last_status: string;
}

interface WebhookStats {
  totalEvents: number;
  eventsByType: { [key: string]: number };
  lastActivity: string | null;
  activeWebhooks: number;
  failedWebhooks: number;
  totalWebhooks: number;
  healthScore: number;
}

export async function GET(request: NextRequest) {
  try {
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

    // Get webhook logs
    const { data: allLogs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (logsError) {
      console.error('❌ Error fetching webhook logs:', logsError)
      return NextResponse.json(
        { error: 'Failed to fetch webhook logs' },
        { status: 500 }
      )
    }

    // Get webhook configurations
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhook_configs')
      .select('*')

    if (webhooksError) {
      console.error('❌ Error fetching webhook configs:', webhooksError)
      return NextResponse.json(
        { error: 'Failed to fetch webhook configs' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats: WebhookStats = {
      totalEvents: 0,
      eventsByType: {},
      lastActivity: null,
      activeWebhooks: 0,
      failedWebhooks: 0,
      totalWebhooks: webhooks?.length || 0,
      healthScore: 0,
    }

    // Process webhook logs
    if (allLogs) {
      stats.totalEvents = allLogs.length

      allLogs.forEach((log: WebhookLog) => {
        if (log.activity_type) {
          stats.eventsByType[log.activity_type] = (stats.eventsByType[log.activity_type] || 0) + 1
        }
        
        if (!stats.lastActivity || log.created_at > stats.lastActivity) {
          stats.lastActivity = log.created_at
        }
      })
    }

    // Process webhook configurations
    if (webhooks) {
      webhooks.forEach((webhook: WebhookConfig) => {
        if (webhook.is_active) {
          stats.activeWebhooks++
        }
        if (webhook.last_status === 'failed') {
          stats.failedWebhooks++
        }
      })

      // Calculate health score (0-100)
      const successRate = stats.totalEvents > 0
        ? 1 - (stats.failedWebhooks / stats.totalWebhooks)
        : 0

      const activityScore = stats.totalEvents > 0 ? 1 : 0

      stats.healthScore = Math.round((successRate * 0.7 + activityScore * 0.3) * 100)
    }

    return NextResponse.json({
      status: 'success',
      data: stats,
    })
  } catch (error) {
    console.error('❌ Error in webhook monitor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, service } = await request.json()
    const tenantId = await getTenantId(request)

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter required' },
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

    switch (action) {
      case 'test_webhook': {
        if (!service) {
          return NextResponse.json(
            { error: 'Service parameter required' },
            { status: 400 }
          )
        }

        // Log test event
        const { error: logError } = await supabase
          .from('webhook_logs')
          .insert([{
            tenant_id: tenantId,
            service_type: service,
            activity_type: 'test',
            status: 'success',
            details: 'Manual test event',
            created_at: new Date().toISOString(),
          }])

        if (logError) {
          console.error('❌ Error logging test event:', logError)
          return NextResponse.json(
            { error: 'Failed to log test event' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          status: 'success',
          message: 'Test event logged successfully',
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('❌ Error in webhook monitor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}