import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from './env-loader'

loadEnvStrict()

interface WebhookConfig {
  id: number;
  tenantId: number;
  serviceType: string;
  isActive: boolean;
  credentials: any;
  lastSync?: Date;
  lastStatus?: string;
}

interface ProcessingResult {
  success: boolean;
  documentsProcessed: number;
  expensesCreated: number;
  errors: string[];
}

export class WebhookManager {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  async getActiveConfigs(tenantId: number, serviceType?: string): Promise<WebhookConfig[]> {
    try {
      let query = this.supabase
        .from('webhook_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      if (serviceType) {
        query = query.eq('service_type', serviceType)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error: unknown) {
      console.error('❌ Error fetching webhook configs:', error)
      return []
    }
  }

  async processWebhooks(tenantId: number, serviceType?: string): Promise<ProcessingResult> {
    try {
      const configs = await this.getActiveConfigs(tenantId, serviceType)
      
      if (configs.length === 0) {
        return {
          success: true,
          documentsProcessed: 0,
          expensesCreated: 0,
          errors: [],
        }
      }

      let totalDocuments = 0
      let totalExpenses = 0
      const errors: string[] = []

      for (const config of configs) {
        try {
          const result = await this.processServiceConfig(config)
          totalDocuments += result.documentsProcessed
          totalExpenses += result.expensesCreated
          errors.push(...result.errors)
        } catch (error: unknown) {
          console.error(`❌ Error processing ${config.serviceType} for tenant ${tenantId}:`, error)
          errors.push(error instanceof Error ? error.message : String(error))
        }
      }

      return {
        success: errors.length === 0,
        documentsProcessed: totalDocuments,
        expensesCreated: totalExpenses,
        errors,
      }
    } catch (error: unknown) {
      console.error(`❌ Error processing webhooks for tenant ${tenantId}:`, error)
      return {
        success: false,
        documentsProcessed: 0,
        expensesCreated: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      }
    }
  }

  private async processServiceConfig(config: WebhookConfig): Promise<ProcessingResult> {
    const { tenantId, serviceType } = config

    try {
      // Log processing start
      await this.logWebhookActivity(tenantId, serviceType, 'processing_start', {
        configId: config.id,
      })

      // Process based on service type
      let result: ProcessingResult
      switch (serviceType) {
        case 'dropbox':
          result = await this.processDropboxWebhook(config)
          break
        case 'gmail':
          result = await this.processGmailWebhook(config)
          break
        case 'whatsapp':
          result = await this.processWhatsAppWebhook(config)
          break
        default:
          throw new Error(`Unsupported service type: ${serviceType}`)
      }

      // Log processing result
      await this.logWebhookActivity(tenantId, serviceType, 'processing_complete', {
        configId: config.id,
        ...result,
      })

      return result
    } catch (error: unknown) {
      // Log processing error
      await this.logWebhookActivity(tenantId, serviceType, 'processing_error', {
        configId: config.id,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        success: false,
        documentsProcessed: 0,
        expensesCreated: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      }
    }
  }

  private async processDropboxWebhook(config: WebhookConfig): Promise<ProcessingResult> {
    // Implement Dropbox webhook processing
    return {
      success: true,
      documentsProcessed: 0,
      expensesCreated: 0,
      errors: [],
    }
  }

  private async processGmailWebhook(config: WebhookConfig): Promise<ProcessingResult> {
    // Implement Gmail webhook processing
    return {
      success: true,
      documentsProcessed: 0,
      expensesCreated: 0,
      errors: [],
    }
  }

  private async processWhatsAppWebhook(config: WebhookConfig): Promise<ProcessingResult> {
    // Implement WhatsApp webhook processing
    return {
      success: true,
      documentsProcessed: 0,
      expensesCreated: 0,
      errors: [],
    }
  }

  private async logWebhookActivity(
    tenantId: number,
    serviceType: string,
    activityType: string,
    details: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('webhook_logs')
        .insert({
          tenant_id: tenantId,
          service_type: serviceType,
          activity_type: activityType,
          details,
          created_at: new Date().toISOString(),
        })
    } catch (error: unknown) {
      console.error('❌ Error logging webhook activity:', error)
    }
  }

  // Methods required by webhook-startup.ts
  async loadActiveConfigurations(): Promise<void> {
    console.log('📋 Loading active webhook configurations...');
    // This method would load configurations from database
    // For now, just log the action
  }

  startAllProcessing(): void {
    console.log('🚀 Starting all webhook processing...');
    // This method would start processing for all tenants
    // For now, just log the action
  }

  stopAllProcessing(): void {
    console.log('🛑 Stopping all webhook processing...');
    // This method would stop processing for all tenants
    // For now, just log the action
  }

  getActiveConfigStatus(): Record<string, any> {
    console.log('📊 Getting active webhook configuration status...');
    // This method would return status for all tenants
    // For now, return empty status
    return {};
  }
}

// Export a singleton instance
export const webhookManager = new WebhookManager();