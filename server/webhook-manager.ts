import { storage } from './storage'

export class WebhookManager {
  private static instance: WebhookManager
  private webhookUrl: string = ''
  
  static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager()
    }
    return WebhookManager.instance
  }

  /**
   * Initialize webhook URL based on environment
   */
  init() {
    // Determine the base URL for webhooks
    const baseUrl = this.getBaseUrl()
    this.webhookUrl = `${baseUrl}/api/webhooks/dropbox`
    
    console.log(`🔗 Webhook URL configured: ${this.webhookUrl}`)
  }

  /**
   * Get the webhook URL for Dropbox configuration
   */
  getWebhookUrl(): string {
    if (!this.webhookUrl) {
      this.init()
    }
    return this.webhookUrl
  }

  /**
   * Check if webhooks can be used (requires public URL)
   */
  canUseWebhooks(): boolean {
    const url = this.getWebhookUrl()
    // Webhooks require publicly accessible URLs
    return !url.includes('localhost') && !url.includes('127.0.0.1')
  }

  /**
   * Get environment-appropriate base URL
   */
  private getBaseUrl(): string {
    // Check for Replit environment first
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`
    }
    
    // Check for production or staging environment
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    
    // Check for custom domain
    if (process.env.CUSTOM_DOMAIN) {
      return `https://${process.env.CUSTOM_DOMAIN}`
    }
    
    // For local development
    const port = process.env.PORT || 5000
    return `http://localhost:${port}`
  }

  /**
   * Get webhook setup instructions for manual configuration
   */
  getWebhookInstructions(): string {
    const webhookUrl = this.getWebhookUrl()
    
    return `
To enable real-time Dropbox notifications:

1. Go to your Dropbox App Console: https://www.dropbox.com/developers/apps
2. Select your app: "${process.env.DROPBOX_APP_NAME || 'Your App'}"
3. Navigate to the "Webhooks" section
4. Add this webhook URL: ${webhookUrl}
5. Dropbox will send a verification request that our system will handle automatically
6. Once verified, you'll receive instant notifications instead of 5-minute polling

Current status: ${this.canUseWebhooks() ? '✅ Ready for webhooks' : '⚠️ Using polling (localhost detected)'}
    `.trim()
  }

  /**
   * Log webhook status and instructions
   */
  logWebhookStatus() {
    const instructions = this.getWebhookInstructions()
    console.log('📋 Dropbox Webhook Setup Instructions:')
    console.log(instructions)
    
    if (!this.canUseWebhooks()) {
      console.log('\n⚠️ Note: Webhooks require a publicly accessible URL. In development mode, the system will continue using the 5-minute polling approach.')
    }
  }
}

export const webhookManager = WebhookManager.getInstance()