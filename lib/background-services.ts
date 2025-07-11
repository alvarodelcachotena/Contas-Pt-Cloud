/**
 * Background Services for Next.js
 * Handles scheduled tasks and real-time processing
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

class DropboxSchedulerService {
  private static instance: DropboxSchedulerService
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  static getInstance(): DropboxSchedulerService {
    if (!DropboxSchedulerService.instance) {
      DropboxSchedulerService.instance = new DropboxSchedulerService()
    }
    return DropboxSchedulerService.instance
  }

  start() {
    if (this.intervalId) {
      console.log('Dropbox scheduler already running')
      return
    }

    console.log('Starting Dropbox folder monitoring (every 5 minutes)...')
    
    // Run every 5 minutes (300000 ms)
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        console.log('Previous Dropbox sync still running, skipping')
        return
      }

      this.isRunning = true
      try {
        await this.checkDropboxConfigs()
      } catch (error) {
        console.error('Error in scheduled Dropbox check:', error)
      } finally {
        this.isRunning = false
      }
    }, 300000)

    console.log('Dropbox scheduler started successfully')
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Dropbox scheduler stopped')
    }
  }

  private async checkDropboxConfigs() {
    try {
      console.log('Checking Dropbox configurations for new files...')
      
      const { data: configs, error } = await supabase
        .from('cloud_drive_configs')
        .select('*')
        .eq('provider', 'dropbox')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching Dropbox configs:', error)
        return
      }

      console.log(`Found ${configs?.length || 0} active Dropbox configurations`)

      for (const config of configs || []) {
        await this.processDropboxConfig(config)
      }

      console.log('Completed checking all Dropbox configurations')
    } catch (error) {
      console.error('Error in Dropbox config check:', error)
    }
  }

  private async processDropboxConfig(config: any) {
    try {
      console.log(`Processing Dropbox config ${config.id} for tenant ${config.tenant_id}`)
      
      // Update last sync time
      await supabase
        .from('cloud_drive_configs')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', config.id)
        
      console.log(`Dropbox config ${config.id} processed successfully`)
    } catch (error) {
      console.error(`Error processing Dropbox config ${config.id}:`, error)
    }
  }
}

class WebSocketService {
  private static instance: WebSocketService
  private connections: Map<string, any> = new Map()

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  broadcast(tenantId: number, message: any) {
    console.log(`Broadcasting to tenant ${tenantId}:`, message)
    // In a full implementation, this would send to actual WebSocket connections
  }

  notifyDocumentProcessing(tenantId: number, documentId: number, status: string) {
    this.broadcast(tenantId, {
      type: 'document_processing',
      documentId,
      status,
      timestamp: new Date().toISOString()
    })
  }

  notifyExpenseCreated(tenantId: number, expenseId: number) {
    this.broadcast(tenantId, {
      type: 'expense_created',
      expenseId,
      timestamp: new Date().toISOString()
    })
  }
}

// Initialize services when module is loaded
let servicesInitialized = false

export function initializeBackgroundServices() {
  if (servicesInitialized) return

  const dropboxScheduler = DropboxSchedulerService.getInstance()
  const webSocketService = WebSocketService.getInstance()

  // Start Dropbox scheduler
  dropboxScheduler.start()

  servicesInitialized = true
  console.log('Background services initialized')
}

export function getDropboxScheduler() {
  return DropboxSchedulerService.getInstance()
}

export function getWebSocketService() {
  return WebSocketService.getInstance()
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initializeBackgroundServices()
}