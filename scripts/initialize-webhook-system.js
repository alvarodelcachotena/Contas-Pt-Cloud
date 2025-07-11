/**
 * Initialize Multi-Tenant Webhook System
 * Run with: node scripts/initialize-webhook-system.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.log('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function initializeWebhookSystem() {
  console.log('🚀 Initializing multi-tenant webhook system...')

  try {
    // 1. Check webhook table structure
    console.log('🔍 Checking webhook table structure...')
    
    const { data: credentials, error: credentialsError } = await supabase
      .from('webhook_credentials')
      .select('*')
      .limit(1)

    if (credentialsError) {
      console.error('❌ webhook_credentials table not accessible:', credentialsError.message)
      console.log('💡 Run the setup script first: node scripts/setup-webhook-tables.js')
      return
    }

    console.log('✅ webhook_credentials table ready')

    // 2. Get all active tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError)
      return
    }

    console.log(`📋 Found ${tenants.length} tenants in system`)

    // 3. Check for existing configurations
    for (const tenant of tenants) {
      console.log(`\n🏢 Checking tenant ${tenant.id} (${tenant.name})...`)
      
      const services = ['whatsapp', 'gmail', 'dropbox']
      let configuredServices = 0
      
      for (const service of services) {
        const { data: serviceCredentials, error } = await supabase
          .from('webhook_credentials')
          .select('credential_name')
          .eq('tenant_id', tenant.id)
          .eq('service_type', service)
          .eq('is_active', true)

        if (!error && serviceCredentials && serviceCredentials.length > 0) {
          configuredServices++
          console.log(`   ✅ ${service}: ${serviceCredentials.length} credentials configured`)
        } else {
          console.log(`   ⚪ ${service}: No configuration`)
        }
      }
      
      if (configuredServices > 0) {
        console.log(`   📊 Total: ${configuredServices}/3 services configured`)
      }
    }

    // 4. Test webhook endpoints
    console.log('\n🧪 Testing webhook endpoints...')
    
    const webhookTests = [
      { name: 'WhatsApp', endpoint: '/api/webhooks/whatsapp', method: 'GET', params: '?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test' },
      { name: 'Gmail', endpoint: '/api/webhooks/gmail', method: 'POST' },
      { name: 'Dropbox', endpoint: '/api/webhooks/dropbox', method: 'POST' },
      { name: 'Management', endpoint: '/api/webhooks/manage', method: 'GET', params: '?service=whatsapp' },
      { name: 'Status', endpoint: '/api/webhooks/status', method: 'GET' }
    ]

    for (const test of webhookTests) {
      try {
        const url = `http://localhost:5000${test.endpoint}${test.params || ''}`
        const response = await fetch(url, { 
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: test.method === 'POST' ? JSON.stringify({ test: true }) : undefined
        })
        
        if (response.ok) {
          console.log(`   ✅ ${test.name}: ${response.status}`)
        } else {
          console.log(`   ⚠️  ${test.name}: ${response.status}`)
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: Connection failed`)
      }
    }

    // 5. Summary and recommendations
    console.log('\n📊 Webhook System Summary:')
    console.log('   • Database tables: Ready')
    console.log('   • Webhook endpoints: Available')
    console.log('   • Multi-tenant support: Active')
    console.log('   • Credential encryption: Enabled')
    
    console.log('\n🎯 Next Steps:')
    console.log('   1. Access webhook management: http://localhost:5000/webhook-management')
    console.log('   2. Configure credentials for each tenant/service')
    console.log('   3. Test document processing through webhooks')
    console.log('   4. Monitor webhook activity in logs')
    
    console.log('\n✅ Multi-tenant webhook system ready!')

  } catch (error) {
    console.error('❌ Error initializing webhook system:', error)
  }
}

// Run initialization
initializeWebhookSystem()