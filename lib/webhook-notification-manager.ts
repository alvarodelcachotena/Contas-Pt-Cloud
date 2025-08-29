import { WebSocket } from 'ws'

interface WebhookEvent {
  type: string;
  service: string;
  status: string;
  message: string;
  details?: any;
}

interface WebhookNotification {
  id: string;
  type: string;
  service: string;
  status: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class WebhookNotificationManager {
  private connections: Map<number, Set<WebSocket>> = new Map()
  private notifications: Map<number, WebhookNotification[]> = new Map()

  addConnection(tenantId: number, ws: WebSocket) {
    if (!this.connections.has(tenantId)) {
      this.connections.set(tenantId, new Set())
    }
    this.connections.get(tenantId)?.add(ws)

    ws.on('close', () => {
      this.connections.get(tenantId)?.delete(ws)
      if (this.connections.get(tenantId)?.size === 0) {
        this.connections.delete(tenantId)
      }
    })
  }

  private broadcast(tenantId: number, message: any) {
    const connections = this.connections.get(tenantId)
    if (!connections) return

    const messageStr = JSON.stringify(message)
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr)
      }
    })
  }

  private addNotification(tenantId: number, notification: WebhookNotification) {
    if (!this.notifications.has(tenantId)) {
      this.notifications.set(tenantId, [])
    }
    this.notifications.get(tenantId)?.push(notification)

    // Keep only last 1000 notifications
    const notifications = this.notifications.get(tenantId)
    if (notifications && notifications.length > 1000) {
      notifications.shift()
    }
  }

  getNotifications(tenantId: number, limit: number = 50): WebhookNotification[] {
    const notifications = this.notifications.get(tenantId) || []
    return notifications.slice(-limit).reverse()
  }

  notifyWebhookEvent(
    tenantId: number,
    event: {
      service: string;
      status: string;
      message: string;
      details?: any;
    }
  ) {
    const notification: WebhookNotification = {
      id: Math.random().toString(36).substring(2),
      type: 'webhook_notification',
      ...event,
      timestamp: new Date().toISOString(),
    }

    this.addNotification(tenantId, notification)
    this.broadcast(tenantId, notification)
  }

  notifyProcessingStatus(
    tenantId: number,
    event: {
      service: string;
      status: string;
      message: string;
      details?: any;
    }
  ) {
    const notification: WebhookNotification = {
      id: Math.random().toString(36).substring(2),
      type: 'processing_status',
      ...event,
      timestamp: new Date().toISOString(),
    }

    this.addNotification(tenantId, notification)
    this.broadcast(tenantId, notification)
  }

  notifyError(
    tenantId: number,
    event: {
      service: string;
      message: string;
      details?: any;
    }
  ) {
    const notification: WebhookNotification = {
      id: Math.random().toString(36).substring(2),
      type: 'error_notification',
      status: 'error',
      ...event,
      timestamp: new Date().toISOString(),
    }

    this.addNotification(tenantId, notification)
    this.broadcast(tenantId, notification)
  }
} 