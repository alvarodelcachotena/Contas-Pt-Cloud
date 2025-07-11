import { webhookManager } from '../lib/webhook-manager'

/**
 * Initialize webhook management system on server startup
 */
export async function initializeWebhookSystem() {
  console.log('🚀 Initializing multi-tenant webhook system...')
  
  try {
    // Load all active configurations from database
    await webhookManager.loadActiveConfigurations()
    
    // Start processing for all tenants
    webhookManager.startAllProcessing()
    
    console.log('✅ Multi-tenant webhook system initialized successfully')
    
    // Log initial status
    const status = webhookManager.getActiveConfigStatus()
    console.log(`📊 Active webhook configurations:`)
    Object.entries(status).forEach(([tenantId, config]: [string, any]) => {
      console.log(`   Tenant ${tenantId}: ${config.services.length} services configured`)
      config.services.forEach((service: any) => {
        console.log(`     - ${service.serviceType}: ${service.isActive ? '✅' : '❌'}`)
      })
    })
    
  } catch (error) {
    console.error('❌ Failed to initialize webhook system:', error)
  }
}

/**
 * Graceful shutdown of webhook system
 */
export function shutdownWebhookSystem() {
  console.log('🛑 Shutting down webhook system...')
  webhookManager.stopAllProcessing()
  console.log('✅ Webhook system shutdown complete')
}

// Handle process termination
process.on('SIGTERM', shutdownWebhookSystem)
process.on('SIGINT', shutdownWebhookSystem)