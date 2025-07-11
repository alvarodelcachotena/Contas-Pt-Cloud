/**
 * Simple webhook table creation
 * Creates the webhook_credentials table using direct Supabase connection
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

async function createWebhookTables() {
  console.log('🔧 Creating webhook tables...')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Create webhook_credentials table directly
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS webhook_credentials (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          service_type VARCHAR(50) NOT NULL,
          credential_name VARCHAR(100) NOT NULL,
          encrypted_value TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by INTEGER REFERENCES users(id),
          is_active BOOLEAN DEFAULT true,
          UNIQUE(tenant_id, service_type, credential_name)
        );
        
        CREATE INDEX IF NOT EXISTS idx_webhook_credentials_tenant_service ON webhook_credentials(tenant_id, service_type);
      `
    })

    if (error) {
      console.error('❌ Error creating webhook tables:', error)
    } else {
      console.log('✅ Webhook tables created successfully')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createWebhookTables()