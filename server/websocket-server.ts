/**
 * WebSocket Server for Real-time Updates
 * Handles tenant-scoped real-time updates for document processing
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

interface TenantConnection {
  ws: WebSocket;
  userId: number;
  tenantId: number;
  userRole: string;
}

interface ProcessingUpdate {
  type: 'document_processing' | 'expense_created' | 'sync_status' | 'error';
  tenantId: number;
  data: any;
  timestamp: Date;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private connections: Map<string, TenantConnection> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: (info: any) => {
        // Basic verification - could be enhanced with session validation
        return true;
      }
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('📡 WebSocket server initialized');
  }

  private handleConnection(ws: WebSocket, request: any) {
    const url = parse(request.url, true);
    const userId = parseInt(url.query.userId as string);
    const tenantId = parseInt(url.query.tenantId as string);
    const userRole = url.query.userRole as string;

    if (!userId || !tenantId) {
      console.log('❌ WebSocket connection rejected: missing userId or tenantId');
      ws.close(1008, 'Missing authentication parameters');
      return;
    }

    const connectionId = `${userId}-${tenantId}`;
    const connection: TenantConnection = {
      ws,
      userId,
      tenantId,
      userRole: userRole || 'viewer'
    };

    this.connections.set(connectionId, connection);
    console.log(`✅ WebSocket connected: User ${userId} in Tenant ${tenantId} (${userRole})`);

    // Send initial connection confirmation
    this.sendToConnection(connectionId, {
      type: 'connected',
      message: 'WebSocket connection established',
      tenantId,
      userId
    });

    ws.on('close', () => {
      this.connections.delete(connectionId);
      console.log(`🔌 WebSocket disconnected: User ${userId} in Tenant ${tenantId}`);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for User ${userId} in Tenant ${tenantId}:`, error);
      this.connections.delete(connectionId);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(connectionId, message);
      } catch (error) {
        console.error('❌ Invalid WebSocket message:', error);
      }
    });
  }

  private handleMessage(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'ping':
        this.sendToConnection(connectionId, { type: 'pong', timestamp: new Date() });
        break;
      case 'subscribe':
        // Handle subscription to specific events
        console.log(`📨 User ${connection.userId} subscribed to ${message.events} in tenant ${connection.tenantId}`);
        break;
      default:
        console.log(`📥 Unknown message type: ${message.type}`);
    }
  }

  private sendToConnection(connectionId: string, data: any) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Broadcast document processing update to all connections in a tenant
   */
  public broadcastDocumentProcessing(tenantId: number, data: {
    documentId: string;
    filename: string;
    status: 'processing' | 'completed' | 'failed';
    progress?: number;
    extractedData?: any;
    error?: string;
  }) {
    const update: ProcessingUpdate = {
      type: 'document_processing',
      tenantId,
      data,
      timestamp: new Date()
    };

    this.broadcastToTenant(tenantId, update);
  }

  /**
   * Broadcast expense creation update to all connections in a tenant
   */
  public broadcastExpenseCreated(tenantId: number, data: {
    expenseId: number;
    vendor: string;
    amount: number;
    sourceDocument?: string;
  }) {
    const update: ProcessingUpdate = {
      type: 'expense_created',
      tenantId,
      data,
      timestamp: new Date()
    };

    this.broadcastToTenant(tenantId, update);
  }

  /**
   * Broadcast cloud sync status update to all connections in a tenant
   */
  public broadcastSyncStatus(tenantId: number, data: {
    provider: 'googledrive' | 'dropbox';
    status: 'syncing' | 'completed' | 'error';
    filesProcessed?: number;
    totalFiles?: number;
    error?: string;
  }) {
    const update: ProcessingUpdate = {
      type: 'sync_status',
      tenantId,
      data,
      timestamp: new Date()
    };

    this.broadcastToTenant(tenantId, update);
  }

  /**
   * Broadcast error message to all connections in a tenant
   */
  public broadcastError(tenantId: number, error: string, details?: any) {
    const update: ProcessingUpdate = {
      type: 'error',
      tenantId,
      data: { error, details },
      timestamp: new Date()
    };

    this.broadcastToTenant(tenantId, update);
  }

  private broadcastToTenant(tenantId: number, update: ProcessingUpdate) {
    let sentCount = 0;

    for (const [connectionId, connection] of Array.from(this.connections.entries())) {
      if (connection.tenantId === tenantId && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(JSON.stringify(update));
          sentCount++;
        } catch (error) {
          console.error(`❌ Failed to send WebSocket message to ${connectionId}:`, error);
          // Remove dead connection
          this.connections.delete(connectionId);
        }
      }
    }

    console.log(`📡 Broadcasted ${update.type} to ${sentCount} connection(s) in tenant ${tenantId}`);
  }

  /**
   * Get connection count for a specific tenant
   */
  public getTenantConnectionCount(tenantId: number): number {
    let count = 0;
    for (const connection of Array.from(this.connections.values())) {
      if (connection.tenantId === tenantId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get total connection count
   */
  public getTotalConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Close all connections (for server shutdown)
   */
  public closeAllConnections() {
    for (const [connectionId, connection] of Array.from(this.connections.entries())) {
      try {
        connection.ws.close(1001, 'Server shutting down');
      } catch (error) {
        console.error(`❌ Error closing connection ${connectionId}:`, error);
      }
    }
    this.connections.clear();
    console.log('🔌 All WebSocket connections closed');
  }
}

// Global WebSocket manager instance
export let wsManager: WebSocketManager | null = null;

export function initializeWebSocketServer(server: Server) {
  wsManager = new WebSocketManager(server);
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}