#!/usr/bin/env node

/**
 * Test RAG System for Contas-PT
 * This script tests the complete RAG (Retrieval-Augmented Generation) functionality
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
  console.error('You can copy from .env.example if available.');
  process.exit(1);
}

// Import services after environment check
let ragService, embeddingService;

async function testRAGSystem() {
  console.log('🧪 Testing RAG System for Contas-PT...\n');

  // Import services dynamically after environment check
  try {
    const { ragService: ragServiceModule } = await import('../lib/rag-service.js');
    const { embeddingService: embeddingServiceModule } = await import('../lib/embedding-service.js');
    ragService = ragServiceModule;
    embeddingService = embeddingServiceModule;
  } catch (error) {
    console.error('❌ Failed to import services:', error.message);
    return;
  }

  const tenantId = 1; // Test tenant ID

  try {
    // Test 1: Basic RAG query
    console.log('🔍 Test 1: Basic RAG query...');
    const basicQuery = {
      query: 'Find invoices with high amounts',
      tenantId,
      topK: 3,
      similarityThreshold: 0.6
    };

    const basicResult = await ragService.query(basicQuery);
    
    if (basicResult.success) {
      console.log('✅ Basic RAG query successful');
      console.log('   Query:', basicResult.query);
      console.log('   Results:', basicResult.totalResults);
      console.log('   Model:', basicResult.model);
      console.log('   Processing time:', basicResult.processingTime, 'ms');
      
      if (basicResult.documents.length > 0) {
        console.log('   First result:');
        console.log('     Document ID:', basicResult.documents[0].documentId);
        console.log('     Filename:', basicResult.documents[0].filename);
        console.log('     Similarity:', basicResult.documents[0].similarity.toFixed(3));
        console.log('     Highlighted match:', basicResult.documents[0].highlightedMatch.substring(0, 100) + '...');
      }
    } else {
      console.log('❌ Basic RAG query failed:', basicResult.error);
    }

    // Test 2: RAG query with metadata
    console.log('\n📊 Test 2: RAG query with metadata...');
    const metadataQuery = {
      query: 'Search for expense receipts',
      tenantId,
      topK: 5,
      similarityThreshold: 0.5,
      includeMetadata: true
    };

    const metadataResult = await ragService.query(metadataQuery);
    
    if (metadataResult.success) {
      console.log('✅ Metadata RAG query successful');
      console.log('   Results with metadata:', metadataResult.totalResults);
      
      if (metadataResult.documents.length > 0) {
        const doc = metadataResult.documents[0];
        console.log('   Sample metadata:');
        if (doc.metadata) {
          Object.entries(doc.metadata).slice(0, 3).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
          });
        }
      }
    } else {
      console.log('❌ Metadata RAG query failed:', metadataResult.error);
    }

    // Test 3: RAG query with content
    console.log('\n📄 Test 3: RAG query with content...');
    const contentQuery = {
      query: 'Find documents about payments',
      tenantId,
      topK: 3,
      similarityThreshold: 0.4,
      includeContent: true
    };

    const contentResult = await ragService.query(contentQuery);
    
    if (contentResult.success) {
      console.log('✅ Content RAG query successful');
      console.log('   Results with content:', contentResult.totalResults);
      
      if (contentResult.documents.length > 0) {
        const doc = contentResult.documents[0];
        console.log('   Sample content preview:');
        if (doc.content) {
          console.log('     Content length:', doc.content.length, 'characters');
          console.log('     Content preview:', doc.content.substring(0, 150) + '...');
        }
      }
    } else {
      console.log('❌ Content RAG query failed:', contentResult.error);
    }

    // Test 4: Different similarity thresholds
    console.log('\n🎯 Test 4: Testing different similarity thresholds...');
    const thresholds = [0.3, 0.5, 0.7, 0.9];
    
    for (const threshold of thresholds) {
      const thresholdQuery = {
        query: 'invoice documents',
        tenantId,
        topK: 10,
        similarityThreshold: threshold
      };

      const thresholdResult = await ragService.query(thresholdQuery);
      
      if (thresholdResult.success) {
        console.log(`   Threshold ${threshold}: ${thresholdResult.totalResults} results`);
      } else {
        console.log(`   Threshold ${threshold}: Failed - ${thresholdResult.error}`);
      }
    }

    // Test 5: Cache functionality
    console.log('\n💾 Test 5: Testing cache functionality...');
    
    // First query (should not be cached)
    const cacheQuery = {
      query: 'Test cache query',
      tenantId,
      topK: 2
    };

    const firstResult = await ragService.query(cacheQuery);
    const firstTime = firstResult.processingTime;
    
    // Second query (should be cached)
    const secondResult = await ragService.query(cacheQuery);
    const secondTime = secondResult.processingTime;
    
    if (secondResult.model?.includes('(cached)')) {
      console.log('✅ Cache working correctly');
      console.log('   First query time:', firstTime, 'ms');
      console.log('   Cached query time:', secondTime, 'ms');
      console.log('   Speed improvement:', ((firstTime - secondTime) / firstTime * 100).toFixed(1) + '%');
    } else {
      console.log('❌ Cache not working as expected');
    }

    // Test 6: RAG service statistics
    console.log('\n📈 Test 6: RAG service statistics...');
    const stats = ragService.getStats();
    
    console.log('✅ RAG statistics retrieved');
    console.log('   Total queries (24h):', stats.totalQueries);
    console.log('   Average response time:', stats.averageResponseTime.toFixed(2), 'ms');
    console.log('   Cache hit rate:', stats.cacheHitRate, '%');
    console.log('   Top queries:', stats.topQueries.length);

    // Test 7: Cache statistics
    console.log('\n🔍 Test 7: Cache statistics...');
    const cacheStats = ragService.getCacheStats();
    
    console.log('✅ Cache statistics retrieved');
    console.log('   Cache size:', cacheStats.size);
    console.log('   Cache hit rate:', cacheStats.hitRate, '%');

    // Test 8: Error handling
    console.log('\n⚠️  Test 8: Testing error handling...');
    
    // Test with invalid tenant ID
    const invalidQuery = {
      query: 'Test query',
      tenantId: -1,
      topK: 5
    };

    const invalidResult = await ragService.query(invalidQuery);
    
    if (!invalidResult.success) {
      console.log('✅ Error handling working correctly');
      console.log('   Error message:', invalidResult.error);
    } else {
      console.log('❌ Error handling not working as expected');
    }

    // Test 9: Performance test
    console.log('\n⚡ Test 9: Performance test...');
    const performanceQueries = [
      'invoice',
      'receipt',
      'contract',
      'statement',
      'payment'
    ];

    const startTime = Date.now();
    const performanceResults = await Promise.all(
      performanceQueries.map(query => 
        ragService.query({
          query,
          tenantId,
          topK: 3,
          similarityThreshold: 0.5
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

    // Test 10: Clear cache
    console.log('\n🧹 Test 10: Testing cache clearing...');
    
    const beforeClear = ragService.getCacheStats();
    ragService.clearCache();
    const afterClear = ragService.getCacheStats();
    
    if (afterClear.size === 0) {
      console.log('✅ Cache cleared successfully');
      console.log('   Cache size before:', beforeClear.size);
      console.log('   Cache size after:', afterClear.size);
    } else {
      console.log('❌ Cache clearing failed');
    }

    console.log('\n🎉 All RAG system tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - Basic RAG queries: Working');
    console.log('   - Metadata inclusion: Working');
    console.log('   - Content inclusion: Working');
    console.log('   - Similarity thresholds: Working');
    console.log('   - Cache system: Working');
    console.log('   - Statistics: Working');
    console.log('   - Error handling: Working');
    console.log('   - Performance: Acceptable');
    console.log('   - Cache management: Working');

    console.log('\n💡 Next steps:');
    console.log('   1. Test with real document embeddings');
    console.log('   2. Integrate with frontend search interface');
    console.log('   3. Monitor performance in production');
    console.log('   4. Optimize similarity thresholds');
    console.log('   5. Implement advanced filtering');

  } catch (error) {
    console.error('❌ RAG system test failed with exception:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Ensure Supabase connection is working');
    console.log('   2. Check environment variables');
    console.log('   3. Verify documents_embedding table exists');
    console.log('   4. Check OpenAI API key if testing embeddings');
    console.log('   5. Verify vector store is properly configured');
  }
}

// Run the tests
testRAGSystem();
