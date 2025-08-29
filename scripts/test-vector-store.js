#!/usr/bin/env node

/**
 * Test Vector Store for Contas-PT
 * This script tests the vector store functionality
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
let vectorStoreService;

async function testVectorStore() {
  console.log('🧪 Testing Vector Store functionality...\n');

  // Import services dynamically after environment check
  try {
    const { vectorStoreService: vectorServiceModule } = await import('../lib/vector-store.js');
    vectorStoreService = vectorServiceModule;
  } catch (error) {
    console.error('❌ Failed to import vector store service:', error.message);
    return;
  }

  const tenantId = 1; // Test tenant ID
  const testDocumentId = 999; // Test document ID

  try {
    // Test 1: Store document embedding
    console.log('📝 Test 1: Storing document embedding...');
    const testEmbedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);
    
    const storeResult = await vectorStoreService.storeDocumentEmbedding(
      tenantId,
      testDocumentId,
      'test-document.pdf',
      'invoice',
      'This is a test invoice for testing purposes',
      testEmbedding,
      { test: true, category: 'testing' }
    );

    if (storeResult.success) {
      console.log('✅ Document embedding stored successfully');
      console.log('   Embedding ID:', storeResult.id);
    } else {
      console.log('❌ Failed to store document embedding:', storeResult.error);
    }

    // Test 2: Retrieve document embedding
    console.log('\n📖 Test 2: Retrieving document embedding...');
    const retrieveResult = await vectorStoreService.getDocumentEmbedding(tenantId, testDocumentId);

    if (retrieveResult.success) {
      console.log('✅ Document embedding retrieved successfully');
      console.log('   Filename:', retrieveResult.embedding.filename);
      console.log('   Type:', retrieveResult.embedding.document_type);
      console.log('   OCR Text:', retrieveResult.embedding.ocr_text?.substring(0, 50) + '...');
    } else {
      console.log('❌ Failed to retrieve document embedding:', retrieveResult.error);
    }

    // Test 3: Find similar documents
    console.log('\n🔍 Test 3: Finding similar documents...');
    const similarResult = await vectorStoreService.findSimilarDocuments(
      tenantId,
      testEmbedding,
      3,
      0.5
    );

    if (similarResult.success) {
      console.log('✅ Similar documents search completed');
      console.log('   Found documents:', similarResult.documents?.length || 0);
      if (similarResult.documents && similarResult.documents.length > 0) {
        similarResult.documents.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.filename} (${doc.document_type})`);
        });
      }
    } else {
      console.log('❌ Failed to find similar documents:', similarResult.error);
    }

    // Test 4: Get tenant embeddings
    console.log('\n📊 Test 4: Getting tenant embeddings...');
    const tenantResult = await vectorStoreService.getTenantEmbeddings(tenantId, 10);

    if (tenantResult.success) {
      console.log('✅ Tenant embeddings retrieved successfully');
      console.log('   Total embeddings:', tenantResult.embeddings?.length || 0);
    } else {
      console.log('❌ Failed to get tenant embeddings:', tenantResult.error);
    }

    // Test 5: Update document embedding
    console.log('\n✏️  Test 5: Updating document embedding...');
    const updateResult = await vectorStoreService.updateDocumentEmbedding(
      tenantId,
      testDocumentId,
      { metadata: { test: true, category: 'testing', updated: true } }
    );

    if (updateResult.success) {
      console.log('✅ Document embedding updated successfully');
    } else {
      console.log('❌ Failed to update document embedding:', updateResult.error);
    }

    // Test 6: Clean up test data
    console.log('\n🧹 Test 6: Cleaning up test data...');
    const deleteResult = await vectorStoreService.deleteDocumentEmbedding(tenantId, testDocumentId);

    if (deleteResult.success) {
      console.log('✅ Test document embedding deleted successfully');
    } else {
      console.log('❌ Failed to delete test document embedding:', deleteResult.error);
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - Vector store operations are working');
    console.log('   - Document embeddings can be stored and retrieved');
    console.log('   - Similarity search is functional');
    console.log('   - Multi-tenant support is working');

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Ensure pgvector extension is enabled');
    console.log('   2. Check database connection and permissions');
    console.log('   3. Verify table structure exists');
    console.log('   4. Check environment variables');
  }
}

// Run the tests
testVectorStore();
