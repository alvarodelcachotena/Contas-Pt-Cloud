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

// WebSocket connection manager for real-time notifications
class WebhookNotificationManager {
  private static instance: WebhookNotificationManager
  private connections: Map<number, WebSocket[]> = new Map()

  static getInstance(): WebhookNotificationManager {
    if (!WebhookNotificationManager.instance) {
      WebhookNotificationManager.instance = new WebhookNotificationManager()
    }
    return WebhookNotificationManager.instance
  }

  addConnection(tenantId: number, ws: WebSocket) {
    if (!this.connections.has(tenantId)) {
      this.connections.set(tenantId, [])
    }
    this.connections.get(tenantId)!.push(ws)
  }

  removeConnection(tenantId: number, ws: WebSocket) {
    const connections = this.connections.get(tenantId)
    if (connections) {
      const index = connections.indexOf(ws)
      if (index > -1) {
        connections.splice(index, 1)
      }
    }
  }

  broadcast(tenantId: number, message: any) {
    const connections = this.connections.get(tenantId)
    if (connections) {
      const payload = JSON.stringify(message)
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload)
        }
      })
    }
  }

  notifyWebhookEvent(tenantId: number, event: {
    type: 'webhook_triggered' | 'document_processed' | 'error' | 'status_change'
    service: string
    message: string
    data?: any
    timestamp: string
  }) {
    this.broadcast(tenantId, {
      type: 'webhook_notification',
      ...event
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()
    const tenantId = await getTenantId(request)

    const notificationManager = WebhookNotificationManager.getInstance()

    switch (action) {
      case 'webhook_triggered':
        await logWebhookEvent(tenantId, data.service, 'triggered', data)
        notificationManager.notifyWebhookEvent(tenantId, {
          type: 'webhook_triggered',
          service: data.service,
          message: `Webhook ${data.service} foi acionado`,
          data: data,
          timestamp: new Date().toISOString()
        })
        break

      case 'document_processed':
        await logWebhookEvent(tenantId, data.service, 'document_processed', data)
        notificationManager.notifyWebhookEvent(tenantId, {
          type: 'document_processed',
          service: data.service,
          message: `Documento processado via ${data.service}`,
          data: data,
          timestamp: new Date().toISOString()
        })
        break

      case 'error_occurred':
        await logWebhookEvent(tenantId, data.service, 'error', data)
        notificationManager.notifyWebhookEvent(tenantId, {
          type: 'error',
          service: data.service,
          message: `Erro no webhook ${data.service}: ${data.error}`,
          data: data,
          timestamp: new Date().toISOString()
        })
        break

      case 'status_change':
        await logWebhookEvent(tenantId, data.service, 'status_change', data)
        notificationManager.notifyWebhookEvent(tenantId, {
          type: 'status_change',
          service: data.service,
          message: `Status do ${data.service} alterado para ${data.status}`,
          data: data,
          timestamp: new Date().toISOString()
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error handling webhook notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const supabase = createSupabaseClient()

    // Get recent webhook notifications/events
    const { data: logs, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching webhook notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Transform logs into notification format
    const notifications = logs?.map(log => ({
      id: log.id,
      type: log.activity_type,
      service: log.service_type,
      message: generateNotificationMessage(log),
      timestamp: log.created_at,
      data: log.details
    })) || []

    return NextResponse.json({
      success: true,
      notifications,
      total: notifications.length
    })

  } catch (error) {
    console.error('Error fetching webhook notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

async function logWebhookEvent(tenantId: number, service: string, activity: string, details: any) {
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
    console.error('Failed to log webhook event:', error)
  }
}

function generateNotificationMessage(log: any): string {
  const service = log.service_type
  const activity = log.activity_type

  switch (activity) {
    case 'triggered':
      return `Webhook ${service} foi acionado`
    case 'document_processed':
      return `Documento processado via ${service}`
    case 'error':
      return `Erro no webhook ${service}`
    case 'test':
      return `Teste realizado no ${service}`
    case 'status_change':
      return `Status do ${service} foi alterado`
    default:
      return `Atividade no webhook ${service}`
  }
}

export { WebhookNotificationManager }