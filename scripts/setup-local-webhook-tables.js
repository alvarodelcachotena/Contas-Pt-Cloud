/**
 * Simple Local Webhook Table Setup
 * Creates webhook tables using direct SQL execution
 */

import { loadEnvStrict } from '../lib/env-loader.js'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env file
loadEnvStrict()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.log('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function setupTables() {
  console.log('🔧 Setting up webhook tables...')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Create webhook_credentials table
    const { error: credentialsError } = await supabase.rpc('exec_sql', {
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
      `
    })

    if (credentialsError) {
      console.error('❌ Error creating webhook_credentials table:', credentialsError)
    } else {
      console.log('✅ webhook_credentials table ready')
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_webhook_credentials_tenant_service ON webhook_credentials(tenant_id, service_type);
      `
    })

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError)
    } else {
      console.log('✅ Indexes created')
    }

    console.log('🎉 Webhook tables setup completed!')
    
  } catch (error) {
    console.error('❌ Error setting up tables:', error)
  }
}

setupTables()