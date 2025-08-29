#!/usr/bin/env node

/**
 * Setup Vector Store for Contas-PT
 * This script enables pgvector extension and creates the documents_embedding table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupVectorStore() {
  console.log('🚀 Setting up Vector Store for Contas-PT...\n');

  try {
    // Step 1: Enable pgvector extension
    console.log('📦 Step 1: Enabling pgvector extension...');
    const { data: extensionData, error: extensionError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS vector;'
    });

    if (extensionError) {
      console.log('ℹ️  Extension might already be enabled or requires manual setup');
      console.log('   You may need to enable it manually in Supabase dashboard');
    } else {
      console.log('✅ pgvector extension enabled successfully');
    }

    // Step 2: Create documents_embedding table
    console.log('\n📋 Step 2: Creating documents_embedding table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS documents_embedding (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        document_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        document_type TEXT,
        ocr_text TEXT,
        metadata JSONB DEFAULT '{}',
        embedding vector(1536),
        created_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_documents_embedding_tenant 
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT fk_documents_embedding_document 
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        
        CONSTRAINT unique_document_embedding 
          UNIQUE (tenant_id, document_id)
      );
    `;

    const { data: tableData, error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (tableError) {
      console.log('ℹ️  Table creation might require manual setup');
      console.log('   Error:', tableError.message);
    } else {
      console.log('✅ documents_embedding table created successfully');
    }

    // Step 3: Create indexes
    console.log('\n🔍 Step 3: Creating performance indexes...');
    
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_documents_embedding_tenant 
        ON documents_embedding(tenant_id);
      
      CREATE INDEX IF NOT EXISTS idx_documents_embedding_type 
        ON documents_embedding(document_type);
      
      CREATE INDEX IF NOT EXISTS idx_documents_embedding_created 
        ON documents_embedding(created_at);
    `;

    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexesSQL
    });

    if (indexError) {
      console.log('ℹ️  Index creation might require manual setup');
      console.log('   Error:', indexError.message);
    } else {
      console.log('✅ Performance indexes created successfully');
    }

    // Step 4: Create vector similarity search index
    console.log('\n🎯 Step 4: Creating vector similarity search index...');
    
    const vectorIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_documents_embedding_vector 
        ON documents_embedding 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    `;

    const { data: vectorIndexData, error: vectorIndexError } = await supabase.rpc('exec_sql', {
      sql: vectorIndexSQL
    });

    if (vectorIndexError) {
      console.log('ℹ️  Vector index creation might require manual setup');
      console.log('   Error:', vectorIndexError.message);
      console.log('   This is normal if pgvector extension is not fully enabled');
    } else {
      console.log('✅ Vector similarity search index created successfully');
    }

    // Step 5: Verify setup
    console.log('\n🔍 Step 5: Verifying setup...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('documents_embedding')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.log('⚠️  Table verification failed:', verifyError.message);
      console.log('   You may need to run the SQL scripts manually');
    } else {
      console.log('✅ Table verification successful');
    }

    console.log('\n🎉 Vector Store setup completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. If any steps failed, run the SQL scripts manually in Supabase SQL Editor');
    console.log('   2. Test the vector operations with sample embeddings');
    console.log('   3. Integrate with your AI processing pipeline');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n💡 Manual setup required:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Run the SQL scripts from the scripts/ folder');
    console.log('   3. Enable pgvector extension in Extensions section');
  }
}

// Run the setup
setupVectorStore();
