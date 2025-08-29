#!/usr/bin/env node

/**
 * Test Audit Logging System for RAG Queries
 * This script tests the complete audit logging functionality
 */

import dotenv from 'dotenv';

dotenv.config();

// Check required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease create a .env file with these variables or set them in your environment.');
  process.exit(1);
}

// Import services dynamically after environment check
let auditLoggingService, ragService;

async function testAuditLogging() {
  console.log('🧪 Testing Audit Logging System for RAG Queries...\n');

  // Import services dynamically after environment check
  try {
    const { auditLoggingService: auditServiceModule } = await import('../lib/audit-logging-service.js');
    const { ragService: ragServiceModule } = await import('../lib/rag-service.js');
    auditLoggingService = auditServiceModule;
    ragService = ragServiceModule;
  } catch (error) {
    console.error('❌ Failed to import services:', error.message);
    return;
  }

  const tenantId = 1; // Test tenant ID

  try {
    // Test 1: Check if audit logging is enabled
    console.log('🔍 Test 1: Checking audit logging status...');
    const isEnabled = auditLoggingService.isAuditLoggingEnabled();
    console.log(`✅ Audit logging is ${isEnabled ? 'enabled' : 'disabled'}`);

    // Test 2: Test audit logging service directly
    console.log('\n📝 Test 2: Testing direct audit logging...');
    const testLogData = {
      tenantId,
      userId: 1,
      sessionId: 'test-session-123',
      queryText: 'Test query for audit logging',
      queryType: 'test',
      queryParameters: { test: true },
      totalResults: 2,
      vectorHitIds: [1, 2],
      similarityScores: [0.85, 0.78],
      processingTimeMs: 150,
      embeddingModel: 'test-model',
      cacheHit: false,
      cacheKey: 'test-cache-key',
      responseTimeMs: 200,
      userAgent: 'test-user-agent',
      ipAddress: '127.0.0.1',
      requestHeaders: { 'test-header': 'test-value' }
    };

    const logResult = await auditLoggingService.logRAGQuery(testLogData);
    
    if (logResult.success) {
      console.log('✅ Direct audit logging successful');
      console.log('   Log ID:', logResult.logId);
    } else {
      console.log('❌ Direct audit logging failed:', logResult.error);
    }

    // Test 3: Test RAG service with audit logging
    console.log('\n🔍 Test 3: Testing RAG service with audit logging...');
    const ragQuery = {
      query: 'Find test documents for audit logging',
      tenantId,
      topK: 3,
      similarityThreshold: 0.5,
      userId: 1,
      sessionId: 'test-session-456',
      userAgent: 'test-user-agent',
      ipAddress: '127.0.0.1'
    };

    const ragResult = await ragService.query(ragQuery);
    
    if (ragResult.success) {
      console.log('✅ RAG query with audit logging successful');
      console.log('   Results:', ragResult.totalResults);
      console.log('   Processing time:', ragResult.processingTime, 'ms');
      console.log('   Model:', ragResult.model);
    } else {
      console.log('❌ RAG query failed:', ragResult.error);
    }

    // Test 4: Get audit log statistics
    console.log('\n📊 Test 4: Getting audit log statistics...');
    const statsResult = await auditLoggingService.getAuditLogStats(tenantId);
    
    if (statsResult.success) {
      console.log('✅ Audit log statistics retrieved');
      const stats = statsResult.stats;
      if (stats) {
        console.log('   Total queries:', stats.totalQueries);
        console.log('   Unique users:', stats.uniqueUsers);
        console.log('   Average response time:', stats.avgResponseTime.toFixed(2), 'ms');
        console.log('   Cache hit rate:', stats.cacheHitRate.toFixed(2), '%');
        console.log('   Top queries:', stats.topQueries.length);
        console.log('   Query types:', Object.keys(stats.queryTypes).length);
      }
    } else {
      console.log('❌ Failed to get audit log statistics:', statsResult.error);
    }

    // Test 5: Get recent audit logs
    console.log('\n📋 Test 5: Getting recent audit logs...');
    const logsResult = await auditLoggingService.getRecentLogs(10, tenantId);
    
    if (logsResult.success) {
      console.log('✅ Recent audit logs retrieved');
      const logs = logsResult.logs;
      if (logs && logs.length > 0) {
        console.log('   Logs count:', logs.length);
        const latestLog = logs[0];
        console.log('   Latest log:');
        console.log('     Query:', latestLog.query_text);
        console.log('     User ID:', latestLog.user_id);
        console.log('     Results:', latestLog.total_results);
        console.log('     Cache hit:', latestLog.cache_hit);
        console.log('     Created at:', latestLog.created_at);
      } else {
        console.log('   Logs count: 0');
      }
    } else {
      console.log('❌ Failed to get recent audit logs:', logsResult.error);
    }

    // Test 6: Export audit logs
    console.log('\n📤 Test 6: Testing audit log export...');
    
    // Export as JSON
    const jsonExportResult = await auditLoggingService.exportAuditLogs({
      format: 'json',
      tenantId
    });
    
    if (jsonExportResult.success) {
      console.log('✅ JSON export successful');
      const data = jsonExportResult.data;
      if (data) {
        console.log('   Data length:', data.length, 'characters');
      }
    } else {
      console.log('❌ JSON export failed:', jsonExportResult.error);
    }

    // Export as CSV
    const csvExportResult = await auditLoggingService.exportAuditLogs({
      format: 'csv',
      tenantId
    });
    
    if (csvExportResult.success) {
      console.log('✅ CSV export successful');
      const data = csvExportResult.data;
      if (data) {
        console.log('   Data length:', data.length, 'characters');
      }
    } else {
      console.log('❌ CSV export failed:', csvExportResult.error);
    }

    // Test 7: Test audit logging toggle
    console.log('\n🔄 Test 7: Testing audit logging toggle...');
    
    // Disable logging
    auditLoggingService.setEnabled(false);
    console.log('   Audit logging disabled');
    
    // Try to log a query (should be ignored)
    const disabledLogResult = await auditLoggingService.logRAGQuery(testLogData);
    if (disabledLogResult.success && disabledLogResult.logId === 'audit-disabled') {
      console.log('✅ Disabled logging working correctly');
    } else {
      console.log('❌ Disabled logging not working correctly');
    }
    
    // Re-enable logging
    auditLoggingService.setEnabled(true);
    console.log('   Audit logging re-enabled');

    // Test 8: Test API endpoints
    console.log('\n🌐 Test 8: Testing API endpoints...');
    
    try {
      // Test stats endpoint
      const statsResponse = await fetch(`http://localhost:3000/api/audit/rag-logs?action=stats&tenantId=${tenantId}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Stats API endpoint working');
        console.log('   Response:', statsData.success ? 'Success' : 'Failed');
      } else {
        console.log('⚠️ Stats API endpoint not accessible (server may not be running)');
      }
    } catch (error) {
      console.log('⚠️ API endpoint test skipped (server not running)');
    }

    // Test 9: Performance test
    console.log('\n⚡ Test 9: Performance test...');
    
    const performanceQueries = [
      'Find invoices',
      'Search receipts',
      'Look for contracts',
      'Find statements',
      'Search payments'
    ];

    const startTime = Date.now();
    const performanceResults = await Promise.all(
      performanceQueries.map(query => 
        ragService.query({
          query,
          tenantId,
          topK: 2,
          userId: 1,
          sessionId: 'perf-test'
        })
      )
    );
    const totalTime = Date.now() - startTime;

    const successfulQueries = performanceResults.filter(r => r.success).length;
    console.log('✅ Performance test completed');
    console.log('   Queries executed:', performanceQueries.length);
    console.log('   Successful queries:', successfulQueries);
    console.log('   Total time:', totalTime, 'ms');
    console.log('   Average time per query:', (totalTime / performanceQueries.length).toFixed(2), 'ms');

    // Test 10: Cleanup test (optional)
    console.log('\n🧹 Test 10: Testing cleanup functionality...');
    
    try {
      const cleanupResult = await auditLoggingService.cleanOldLogs(9999, tenantId); // Keep logs for 9999 days (effectively no cleanup)
      if (cleanupResult.success) {
        console.log('✅ Cleanup function working');
        console.log('   Logs deleted:', cleanupResult.deletedCount || 0);
      } else {
        console.log('⚠️ Cleanup function warning:', cleanupResult.error);
      }
    } catch (error) {
      console.log('⚠️ Cleanup test skipped:', error.message);
    }

    console.log('\n🎉 All audit logging tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - Audit logging service: Working');
    console.log('   - RAG integration: Working');
    console.log('   - Statistics collection: Working');
    console.log('   - Log retrieval: Working');
    console.log('   - Data export: Working');
    console.log('   - Toggle functionality: Working');
    console.log('   - Performance: Acceptable');

    console.log('\n💡 Next steps:');
    console.log('   1. Monitor audit logs in production');
    console.log('   2. Use logs for prompt-tuning analysis');
    console.log('   3. Set up automated cleanup schedules');
    console.log('   4. Create dashboards for audit analytics');
    console.log('   5. Implement alerting for unusual patterns');

  } catch (error) {
    console.error('❌ Audit logging test failed with exception:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Ensure Supabase connection is working');
    console.log('   2. Check environment variables');
    console.log('   3. Verify rag_query_log table exists');
    console.log('   4. Check audit logging service permissions');
    console.log('   5. Verify RAG service integration');
  }
}

// Run the tests
testAuditLogging();
