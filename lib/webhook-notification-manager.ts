// WebSocket connection manager for real-time notifications
export class WebhookNotificationManager {
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