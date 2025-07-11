/**
 * Setup Webhook Credentials Tables
 * Creates the necessary tables for webhook credential management
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupWebhookTables() {
  console.log('🔧 Setting up webhook tables...');

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
    });

    if (credentialsError) {
      console.error('❌ Error creating webhook_credentials table:', credentialsError);
    } else {
      console.log('✅ Created webhook_credentials table');
    }

    // Create webhook_configs table
    const { error: configsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS webhook_configs (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          webhook_type VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          endpoint_url TEXT,
          verification_token TEXT,
          config_data JSONB DEFAULT '{}',
          is_enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_used_at TIMESTAMP WITH TIME ZONE,
          success_count INTEGER DEFAULT 0,
          error_count INTEGER DEFAULT 0,
          UNIQUE(tenant_id, webhook_type, name)
        );
      `
    });

    if (configsError) {
      console.error('❌ Error creating webhook_configs table:', configsError);
    } else {
      console.log('✅ Created webhook_configs table');
    }

    // Create webhook_logs table
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS webhook_logs (
          id SERIAL PRIMARY KEY,
          webhook_config_id INTEGER REFERENCES webhook_configs(id) ON DELETE CASCADE,
          tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          request_data JSONB,
          response_status INTEGER,
          response_data JSONB,
          processing_time_ms INTEGER,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
          expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL
        );
      `
    });

    if (logsError) {
      console.error('❌ Error creating webhook_logs table:', logsError);
    } else {
      console.log('✅ Created webhook_logs table');
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_webhook_credentials_tenant_service ON webhook_credentials(tenant_id, service_type);
        CREATE INDEX IF NOT EXISTS idx_webhook_configs_tenant_type ON webhook_configs(tenant_id, webhook_type);
        CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_config ON webhook_logs(webhook_config_id);
        CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
      `
    });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Created indexes');
    }

    console.log('🎉 Webhook tables setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up webhook tables:', error);
  }
}

setupWebhookTables();