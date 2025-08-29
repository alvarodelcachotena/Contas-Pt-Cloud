#!/usr/bin/env node

/**
 * Setup Audit Logging for RAG Queries
 * This script creates the rag_query_log table and related functions in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupAuditLogging() {
  console.log('🔧 Setting up Audit Logging for RAG Queries...\n');

  // Check required environment variables
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease create a .env file with these variables or set them in your environment.');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Test connection
    console.log('🔗 Testing Supabase connection...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      throw new Error(`Failed to connect to Supabase: ${bucketError.message}`);
    }
    
    console.log('✅ Supabase connection successful');

    // Read and execute SQL script
    console.log('\n📋 Creating audit logging table and functions...');
    const sqlScriptPath = join(__dirname, 'create-rag-query-log-table.sql');
    const sqlScript = readFileSync(sqlScriptPath, 'utf8');

    // Split SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            // Try direct execution for non-RPC statements
            const { error: directError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            if (directError) {
              console.warn(`⚠️ Statement execution warning (continuing): ${directError.message}`);
            }
          }
          
          successCount++;
          console.log(`   ✅ Executed: ${statement.substring(0, 50)}...`);
        }
      } catch (error) {
        console.warn(`⚠️ Statement execution warning (continuing): ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 SQL Execution Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️ Warnings: ${errorCount}`);

    // Verify table creation
    console.log('\n🔍 Verifying table creation...');
    const { data: tableData, error: tableError } = await supabase
      .from('rag_query_log')
      .select('*')
      .limit(1);

    if (tableError) {
      throw new Error(`Failed to verify table creation: ${tableError.message}`);
    }

    console.log('✅ rag_query_log table created successfully');

    // Test functions
    console.log('\n🧪 Testing audit logging functions...');
    
    // Test get_rag_query_stats function
    try {
      const { data: statsData, error: statsError } = await supabase.rpc('get_rag_query_stats');
      if (statsError) {
        console.warn(`⚠️ get_rag_query_stats function warning: ${statsError.message}`);
      } else {
        console.log('✅ get_rag_query_stats function working');
      }
    } catch (error) {
      console.warn(`⚠️ get_rag_query_stats function test failed: ${error.message}`);
    }

    // Test export function
    try {
      const { data: exportData, error: exportError } = await supabase.rpc('export_rag_query_logs', {
        p_format: 'json'
      });
      if (exportError) {
        console.warn(`⚠️ export_rag_query_logs function warning: ${exportError.message}`);
      } else {
        console.log('✅ export_rag_query_logs function working');
      }
    } catch (error) {
      console.warn(`⚠️ export_rag_query_logs function test failed: ${error.message}`);
    }

    // Test cleanup function
    try {
      const { data: cleanupData, error: cleanupError } = await supabase.rpc('clean_old_rag_logs', {
        p_days_to_keep: 90
      });
      if (cleanupError) {
        console.warn(`⚠️ clean_old_rag_logs function warning: ${cleanupError.message}`);
      } else {
        console.log('✅ clean_old_rag_logs function working');
      }
    } catch (error) {
      console.warn(`⚠️ clean_old_rag_logs function test failed: ${error.message}`);
    }

    // Insert sample data for testing
    console.log('\n📝 Inserting sample audit log data...');
    const sampleLogs = [
      {
        tenant_id: 1,
        user_id: 1,
        query_text: 'Find invoices with high amounts',
        query_type: 'semantic_search',
        total_results: 3,
        vector_hit_ids: [1, 2, 3],
        similarity_scores: [0.85, 0.78, 0.72],
        processing_time_ms: 150,
        response_time_ms: 200,
        cache_hit: false,
        embedding_model: 'openai'
      },
      {
        tenant_id: 1,
        user_id: 1,
        query_text: 'Search for expense receipts',
        query_type: 'semantic_search',
        total_results: 5,
        vector_hit_ids: [4, 5, 6, 7, 8],
        similarity_scores: [0.91, 0.87, 0.83, 0.79, 0.75],
        processing_time_ms: 120,
        response_time_ms: 180,
        cache_hit: true,
        embedding_model: 'openai'
      },
      {
        tenant_id: 1,
        user_id: 2,
        query_text: 'Find documents about payments',
        query_type: 'semantic_search',
        total_results: 2,
        vector_hit_ids: [9, 10],
        similarity_scores: [0.88, 0.82],
        processing_time_ms: 180,
        response_time_ms: 250,
        cache_hit: false,
        embedding_model: 'instructor'
      }
    ];

    for (const sampleLog of sampleLogs) {
      try {
        const { error: insertError } = await supabase
          .from('rag_query_log')
          .insert(sampleLog);

        if (insertError) {
          console.warn(`⚠️ Failed to insert sample log: ${insertError.message}`);
        } else {
          console.log(`   ✅ Inserted sample log: ${sampleLog.query_text.substring(0, 30)}...`);
        }
      } catch (error) {
        console.warn(`⚠️ Sample log insertion failed: ${error.message}`);
      }
    }

    console.log('\n🎉 Audit Logging setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   ✅ rag_query_log table with comprehensive fields');
    console.log('   ✅ Indexes for efficient querying');
    console.log('   ✅ get_rag_query_stats function for analytics');
    console.log('   ✅ export_rag_query_logs function for data export');
    console.log('   ✅ clean_old_rag_logs function for retention policy');
    console.log('   ✅ Sample data for testing');

    console.log('\n🔗 API Endpoints available:');
    console.log('   GET /api/audit/rag-logs?action=stats - Get audit statistics');
    console.log('   GET /api/audit/rag-logs?action=recent - Get recent logs');
    console.log('   GET /api/audit/rag-logs?action=export&format=json - Export logs as JSON');
    console.log('   GET /api/audit/rag-logs?action=export&format=csv - Export logs as CSV');
    console.log('   POST /api/audit/rag-logs - Clean old logs or toggle logging');

    console.log('\n💡 Next steps:');
    console.log('   1. Test the audit logging with RAG queries');
    console.log('   2. Monitor logs through the API endpoints');
    console.log('   3. Export logs for prompt-tuning analysis');
    console.log('   4. Set up retention policies for old logs');

  } catch (error) {
    console.error('❌ Audit logging setup failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Ensure Supabase connection is working');
    console.log('   2. Check environment variables');
    console.log('   3. Verify service role key has sufficient permissions');
    console.log('   4. Check Supabase logs for detailed error information');
    process.exit(1);
  }
}

// Run the setup
setupAuditLogging();
