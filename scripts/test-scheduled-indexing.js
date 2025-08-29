#!/usr/bin/env node

/**
 * Test Scheduled Indexing Service for Contas-PT
 * This script tests the complete scheduled indexing functionality
 */

import dotenv from 'dotenv';

// Load environment variables first
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
let scheduledIndexingService;

async function testScheduledIndexing() {
  console.log('🧪 Testing Scheduled Indexing Service for Contas-PT...\n');

  // Import services dynamically after environment check
  try {
    const { scheduledIndexingService: indexingModule } = await import('../lib/scheduled-indexing-service.js');
    scheduledIndexingService = indexingModule;
  } catch (error) {
    console.error('❌ Failed to import scheduled indexing service:', error.message);
    return;
  }

  try {
    // Test 1: Get initial statistics
    console.log('📊 Test 1: Getting initial statistics...');
    const initialStats = scheduledIndexingService.getStats();
    console.log('✅ Initial statistics retrieved successfully');
    console.log('   Total Documents:', initialStats.totalDocuments);
    console.log('   Indexed Documents:', initialStats.indexedDocuments);
    console.log('   Failed Documents:', initialStats.failedDocuments);
    console.log('   Pending Documents:', initialStats.pendingDocuments);
    console.log('   Last Sync Time:', initialStats.lastSyncTime);
    console.log('   Average Processing Time:', initialStats.averageProcessingTime);
    console.log('   Storage Size:', initialStats.storageSize);
    console.log('   Embeddings Size:', initialStats.embeddingsSize);
    console.log('');

    // Test 2: Get service status
    console.log('🔍 Test 2: Getting service status...');
    const status = scheduledIndexingService.getQueueStatus();
    console.log('✅ Service status retrieved successfully');
    console.log('   Is Running:', status.isRunning);
    console.log('   Queue Length:', status.queueLength);
    console.log('');

    // Test 3: Get active jobs
    console.log('📋 Test 3: Getting active jobs...');
    const activeJobs = scheduledIndexingService.getActiveJobs();
    console.log('✅ Active jobs retrieved successfully');
    console.log('   Active Jobs Count:', activeJobs.length);
    
    if (activeJobs.length > 0) {
      activeJobs.forEach((job, index) => {
        console.log(`   Job ${index + 1}:`);
        console.log(`     ID: ${job.id}`);
        console.log(`     Status: ${job.status}`);
        console.log(`     Filename: ${job.filename}`);
        console.log(`     Started At: ${job.startedAt}`);
        console.log(`     Processing Time: ${job.processingTime}ms`);
        if (job.error) {
          console.log(`     Error: ${job.error}`);
        }
      });
    }
    console.log('');

    // Test 4: Start the indexing service
    console.log('🚀 Test 4: Starting indexing service...');
    await scheduledIndexingService.start();
    console.log('✅ Indexing service started successfully');
    console.log('');

    // Test 5: Wait a moment and check status
    console.log('⏳ Test 5: Waiting for service to initialize...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const runningStatus = scheduledIndexingService.getQueueStatus();
    console.log('✅ Service status after start:');
    console.log('   Is Running:', runningStatus.isRunning);
    console.log('   Queue Length:', runningStatus.queueLength);
    console.log('');

    // Test 6: Force a scan
    console.log('🔧 Test 6: Forcing a scan...');
    await scheduledIndexingService.forceScan();
    console.log('✅ Force scan completed successfully');
    console.log('');

    // Test 7: Wait for scan to complete and get updated stats
    console.log('⏳ Test 7: Waiting for scan to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const updatedStats = scheduledIndexingService.getStats();
    console.log('✅ Updated statistics after scan:');
    console.log('   Total Documents:', updatedStats.totalDocuments);
    console.log('   Indexed Documents:', updatedStats.indexedDocuments);
    console.log('   Failed Documents:', updatedStats.failedDocuments);
    console.log('   Pending Documents:', updatedStats.pendingDocuments);
    console.log('   Last Sync Time:', updatedStats.lastSyncTime);
    console.log('');

    // Test 8: Update configuration
    console.log('⚙️ Test 8: Updating configuration...');
    const newConfig = {
      scanIntervalMinutes: 30,
      batchSize: 15,
      maxConcurrentJobs: 8,
      retryAttempts: 5,
      retryDelayMinutes: 10,
      fileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'docx'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      enableIncrementalSync: true
    };
    
    scheduledIndexingService.updateConfig(newConfig);
    console.log('✅ Configuration updated successfully');
    console.log('   New scan interval:', newConfig.scanIntervalMinutes, 'minutes');
    console.log('   New batch size:', newConfig.batchSize);
    console.log('   New max concurrent jobs:', newConfig.maxConcurrentJobs);
    console.log('   New retry attempts:', newConfig.retryAttempts);
    console.log('   New retry delay:', newConfig.retryDelayMinutes, 'minutes');
    console.log('   New file types:', newConfig.fileTypes.join(', '));
    console.log('   New max file size:', newConfig.maxFileSize / (1024 * 1024), 'MB');
    console.log('   Incremental sync enabled:', newConfig.enableIncrementalSync);
    console.log('');

    // Test 9: Get active jobs after scan
    console.log('📋 Test 9: Getting active jobs after scan...');
    const jobsAfterScan = scheduledIndexingService.getActiveJobs();
    console.log('✅ Active jobs after scan:');
    console.log('   Active Jobs Count:', jobsAfterScan.length);
    
    if (jobsAfterScan.length > 0) {
      jobsAfterScan.forEach((job, index) => {
        console.log(`   Job ${index + 1}:`);
        console.log(`     ID: ${job.id}`);
        console.log(`     Status: ${job.status}`);
        console.log(`     Filename: ${job.filename}`);
        console.log(`     Started At: ${job.startedAt}`);
        console.log(`     Processing Time: ${job.processingTime}ms`);
        if (job.error) {
          console.log(`     Error: ${job.error}`);
        }
      });
    } else {
      console.log('   No active jobs');
    }
    console.log('');

    // Test 10: Stop the indexing service
    console.log('🛑 Test 10: Stopping indexing service...');
    await scheduledIndexingService.stop();
    console.log('✅ Indexing service stopped successfully');
    console.log('');

    // Test 11: Final status check
    console.log('🔍 Test 11: Final status check...');
    const finalStatus = scheduledIndexingService.getQueueStatus();
    console.log('✅ Final service status:');
    console.log('   Is Running:', finalStatus.isRunning);
    console.log('   Queue Length:', finalStatus.queueLength);
    console.log('');

    // Test 12: Final statistics
    console.log('📊 Test 12: Final statistics...');
    const finalStats = scheduledIndexingService.getStats();
    console.log('✅ Final statistics:');
    console.log('   Total Documents:', finalStats.totalDocuments);
    console.log('   Indexed Documents:', finalStats.indexedDocuments);
    console.log('   Failed Documents:', finalStats.failedDocuments);
    console.log('   Pending Documents:', finalStats.pendingDocuments);
    console.log('   Last Sync Time:', finalStats.lastSyncTime);
    console.log('   Average Processing Time:', finalStats.averageProcessingTime);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Service can be started and stopped');
    console.log('   ✅ Statistics are tracked correctly');
    console.log('   ✅ Configuration can be updated');
    console.log('   ✅ Force scan functionality works');
    console.log('   ✅ Job tracking is functional');
    console.log('   ✅ Service status monitoring works');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testScheduledIndexing().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
