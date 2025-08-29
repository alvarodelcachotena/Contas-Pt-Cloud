import { NextRequest, NextResponse } from 'next/server'
import { WebhookNotificationManager } from '@/lib/webhook-notification-manager'
import { getTenantId } from '@/lib/tenant-utils'

// Create a singleton instance
const notificationManager = new WebhookNotificationManager()

export async function POST(request: NextRequest) {
  try {
    const { action, service, message, data } = await request.json()
    const tenantId = await getTenantId(request)

    switch (action) {
      case 'webhook_triggered':
        notificationManager.notifyWebhookEvent(tenantId, {
          service,
          status: 'triggered',
          message,
          details: data,
        })
        break

      case 'document_processed':
        notificationManager.notifyProcessingStatus(tenantId, {
          service,
          status: 'completed',
          message,
          details: data,
        })
        break

      case 'error':
        notificationManager.notifyError(tenantId, {
          service,
          message,
          details: data,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Get recent webhook notifications/events
    const notifications = notificationManager.getNotifications(tenantId, limit)

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

