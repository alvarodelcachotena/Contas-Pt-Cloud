import { Pool } from 'pg'
import { getServiceCredentials } from './webhook-credentials'

interface WebhookConfig {
  tenantId: number
  serviceType: string
  credentials: Record<string, string>
  isActive: boolean
}

interface ProcessingResult {
  success: boolean
  documentsProcessed: number
  expensesCreated: number
  errors: string[]
}

export class MultiTenantWebhookManager {
  private static instance: MultiTenantWebhookManager
  private activeConfigs: Map<string, WebhookConfig[]> = new Map()
  private processingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private pool: Pool

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
  }

  static getInstance(): MultiTenantWebhookManager {
    if (!MultiTenantWebhookManager.instance) {
      MultiTenantWebhookManager.instance = new MultiTenantWebhookManager()
    }
    return MultiTenantWebhookManager.instance
  }

  /**
   * Load all active webhook configurations from database
   */
  async loadActiveConfigurations(): Promise<void> {
    try {
      console.log('🔄 Loading active webhook configurations...')
      
      // Get all active tenants
      const { rows: tenants } = await this.pool.query(
        'SELECT id, name FROM tenants WHERE id > 0'
      )

      for (const tenant of tenants) {
        const tenantConfigs: WebhookConfig[] = []
        
        // Load configurations for each service type
        for (const serviceType of ['whatsapp', 'gmail', 'dropbox']) {
          const credentials = await getServiceCredentials(tenant.id, serviceType)
          
          if (Object.keys(credentials).length > 0) {
            tenantConfigs.push({
              tenantId: tenant.id,
              serviceType,
              credentials,
              isActive: true
            })
            
            console.log(`✅ Loaded ${serviceType} config for tenant ${tenant.id} (${tenant.name})`)
          }
        }
        
        if (tenantConfigs.length > 0) {
          this.activeConfigs.set(`tenant-${tenant.id}`, tenantConfigs)
          console.log(`📋 Tenant ${tenant.id} has ${tenantConfigs.length} active webhook configurations`)
        }
      }
      
      console.log(`🎯 Loaded configurations for ${this.activeConfigs.size} tenants`)
    } catch (error) {
      console.error('❌ Error loading webhook configurations:', error)
    }
  }

  /**
   * Start processing for all active configurations
   */
  startAllProcessing(): void {
    console.log('🚀 Starting webhook processing for all tenants...')
    
    this.activeConfigs.forEach((configs, tenantKey) => {
      const tenantId = parseInt(tenantKey.split('-')[1])
      this.startTenantProcessing(tenantId, configs)
    })
  }

  /**
   * Start processing for a specific tenant
   */
  private startTenantProcessing(tenantId: number, configs: WebhookConfig[]): void {
    const intervalKey = `tenant-${tenantId}`
    
    // Clear existing interval if any
    if (this.processingIntervals.has(intervalKey)) {
      clearInterval(this.processingIntervals.get(intervalKey)!)
    }

    // Start new processing interval (every 2 minutes)
    const interval = setInterval(async () => {
      await this.processTenantConfigs(tenantId, configs)
    }, 120000) // 2 minutes

    this.processingIntervals.set(intervalKey, interval)
    
    console.log(`⏰ Started processing interval for tenant ${tenantId}`)
    
    // Run immediately once
    this.processTenantConfigs(tenantId, configs)
  }

  /**
   * Process all configurations for a tenant
   */
  private async processTenantConfigs(tenantId: number, configs: WebhookConfig[]): Promise<void> {
    console.log(`🔄 Processing webhook configs for tenant ${tenantId}...`)
    
    for (const config of configs) {
      try {
        await this.processServiceConfig(config)
      } catch (error) {
        console.error(`❌ Error processing ${config.serviceType} for tenant ${tenantId}:`, error)
      }
    }
  }

  /**
   * Process a specific service configuration
   */
  private async processServiceConfig(config: WebhookConfig): Promise<ProcessingResult> {
    const { tenantId, serviceType, credentials } = config
    
    console.log(`📱 Processing ${serviceType} for tenant ${tenantId}`)
    
    try {
      switch (serviceType) {
        case 'whatsapp':
          return await this.processWhatsAppConfig(config)
        case 'gmail':
          return await this.processGmailConfig(config)
        case 'dropbox':
          return await this.processDropboxConfig(config)
        default:
          console.warn(`⚠️ Unknown service type: ${serviceType}`)
          return { success: false, documentsProcessed: 0, expensesCreated: 0, errors: ['Unknown service type'] }
      }
    } catch (error) {
      console.error(`❌ Error processing ${serviceType} for tenant ${tenantId}:`, error)
      return { success: false, documentsProcessed: 0, expensesCreated: 0, errors: [error.message] }
    }
  }

  /**
   * Process WhatsApp configuration
   */
  private async processWhatsAppConfig(config: WebhookConfig): Promise<ProcessingResult> {
    const { tenantId, credentials } = config
    
    console.log(`📱 Processing WhatsApp for tenant ${tenantId}`)
    
    // WhatsApp is webhook-based, so we just validate the configuration
    const requiredFields = ['access_token', 'phone_number_id', 'verify_token']
    const missingFields = requiredFields.filter(field => !credentials[field])
    
    if (missingFields.length > 0) {
      return {
        success: false,
        documentsProcessed: 0,
        expensesCreated: 0,
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      }
    }

    // Update last processed time
    await this.updateLastProcessedTime(tenantId, 'whatsapp')
    
    return {
      success: true,
      documentsProcessed: 0,
      expensesCreated: 0,
      errors: []
    }
  }

  /**
   * Process Gmail configuration
   */
  private async processGmailConfig(config: WebhookConfig): Promise<ProcessingResult> {
    const { tenantId, credentials } = config
    
    console.log(`📧 Processing Gmail for tenant ${tenantId}`)
    
    // Gmail processing would involve IMAP checking
    // For now, we'll just validate the configuration
    const requiredFields = ['imap_user', 'imap_pass']
    const missingFields = requiredFields.filter(field => !credentials[field])
    
    if (missingFields.length > 0) {
      return {
        success: false,
        documentsProcessed: 0,
        expensesCreated: 0,
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      }
    }

    // In a real implementation, we would:
    // 1. Connect to IMAP
    // 2. Check for new emails with PDF attachments
    // 3. Download and process attachments
    // 4. Upload to tenant's Dropbox folder
    
    await this.updateLastProcessedTime(tenantId, 'gmail')
    
    return {
      success: true,
      documentsProcessed: 0,
      expensesCreated: 0,
      errors: []
    }
  }

  /**
   * Process Dropbox configuration
   */
  private async processDropboxConfig(config: WebhookConfig): Promise<ProcessingResult> {
    const { tenantId, credentials } = config
    
    console.log(`☁️ Processing Dropbox for tenant ${tenantId}`)
    
    // Dropbox processing is handled by the existing scheduler
    // We just validate the configuration here
    const requiredFields = ['access_token']
    const missingFields = requiredFields.filter(field => !credentials[field])
    
    if (missingFields.length > 0) {
      return {
        success: false,
        documentsProcessed: 0,
        expensesCreated: 0,
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      }
    }

    await this.updateLastProcessedTime(tenantId, 'dropbox')
    
    return {
      success: true,
      documentsProcessed: 0,
      expensesCreated: 0,
      errors: []
    }
  }

  /**
   * Update last processed time for a service
   */
  private async updateLastProcessedTime(tenantId: number, serviceType: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE webhook_configs 
         SET last_triggered_at = NOW() 
         WHERE tenant_id = $1 AND webhook_type = $2`,
        [tenantId, serviceType]
      )
    } catch (error) {
      console.error('Error updating last processed time:', error)
    }
  }

  /**
   * Get status of all active configurations
   */
  getActiveConfigStatus(): Record<string, any> {
    const status = {}
    
    this.activeConfigs.forEach((configs, tenantKey) => {
      const tenantId = tenantKey.split('-')[1]
      status[tenantId] = {
        tenantId: parseInt(tenantId),
        services: configs.map(config => ({
          serviceType: config.serviceType,
          isActive: config.isActive,
          hasCredentials: Object.keys(config.credentials).length > 0
        })),
        processingActive: this.processingIntervals.has(tenantKey)
      }
    })
    
    return status
  }

  /**
   * Stop all processing
   */
  stopAllProcessing(): void {
    console.log('🛑 Stopping all webhook processing...')
    
    this.processingIntervals.forEach((interval, key) => {
      clearInterval(interval)
      console.log(`⏸️ Stopped processing for ${key}`)
    })
    
    this.processingIntervals.clear()
  }

  /**
   * Reload configurations (useful for when new configurations are added)
   */
  async reloadConfigurations(): Promise<void> {
    console.log('🔄 Reloading webhook configurations...')
    
    // Stop current processing
    this.stopAllProcessing()
    
    // Clear current configs
    this.activeConfigs.clear()
    
    // Load new configurations
    await this.loadActiveConfigurations()
    
    // Start processing again
    this.startAllProcessing()
  }
}

// Export singleton instance
export const webhookManager = MultiTenantWebhookManager.getInstance()