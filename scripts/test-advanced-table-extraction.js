#!/usr/bin/env node

/**
 * Advanced Table & Line-Item Extraction Test Script
 * Tests the complete pipeline including LayoutLMv3, Donut, and consensus engine
 */

import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Check if environment variables are available
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('⚠️  Supabase credentials not found. Using mock mode for testing.');
  console.log('   This is expected in development environments.');
  console.log('   The system will use simulated data for testing.\n');
}

// Dynamic imports after environment variables are loaded
let advancedTableParser, pdfLayoutRouter, consensusEngine;

async function testAdvancedTableParser() {
  console.log('\n🚀 Testing Advanced Table Parser...');
  
  try {
    // Load modules dynamically
    const { advancedTableParser: parser } = await import('../lib/advanced-table-parser.js');
    advancedTableParser = parser;
    
    // Test 1: Initialize models
    console.log('\n📊 Test 1: Model Initialization');
    await advancedTableParser.initialize();
    console.log('✅ Models initialized successfully');
    
    // Test 2: Create mock PDF buffer
    console.log('\n📄 Test 2: Mock PDF Processing');
    const mockPdfBuffer = Buffer.from('Mock PDF content with tables');
    const tenantId = 1;
    const documentId = 999;
    
    // Test 3: Extract tables and line items
    console.log('\n🔍 Test 3: Table and Line Item Extraction');
    const extractionResult = await advancedTableParser.extractTablesAndLineItems(
      mockPdfBuffer,
      tenantId,
      documentId
    );
    
    if (extractionResult.success) {
      console.log(`✅ Extraction successful:`);
      console.log(`   - Tables: ${extractionResult.totalTables}`);
      console.log(`   - Line Items: ${extractionResult.totalLineItems}`);
      console.log(`   - Processing Time: ${extractionResult.processingTime}ms`);
      console.log(`   - Fallback Used: ${extractionResult.fallbackUsed}`);
      
      // Display extracted data
      if (extractionResult.tables.length > 0) {
        console.log('\n📊 Extracted Tables:');
        extractionResult.tables.forEach((table, index) => {
          console.log(`   Table ${index + 1}:`);
          console.log(`     - Method: ${table.extractionMethod}`);
          console.log(`     - Confidence: ${table.confidence}`);
          console.log(`     - Rows: ${table.rows.length}`);
          console.log(`     - Columns: ${table.columns.length}`);
        });
      }
      
      if (extractionResult.lineItems.length > 0) {
        console.log('\n📋 Extracted Line Items:');
        extractionResult.lineItems.forEach((item, index) => {
          console.log(`   Item ${index + 1}:`);
          console.log(`     - Description: ${item.description}`);
          console.log(`     - Quantity: ${item.quantity || 'N/A'}`);
          console.log(`     - Unit Price: ${item.unitPrice ? `€${item.unitPrice}` : 'N/A'}`);
          console.log(`     - Total: €${item.totalAmount}`);
          console.log(`     - VAT Rate: ${item.vatRate ? `${item.vatRate}%` : 'N/A'}`);
          console.log(`     - Category: ${item.category || 'N/A'}`);
          console.log(`     - Confidence: ${item.confidence.toFixed(2)}`);
        });
      }
      
    } else {
      console.log(`❌ Extraction failed: ${extractionResult.error}`);
    }
    
    // Test 4: Get extraction statistics
    console.log('\n📈 Test 4: Extraction Statistics');
    const stats = await advancedTableParser.getExtractionStats(tenantId);
    console.log('✅ Statistics retrieved:', stats);
    
  } catch (error) {
    console.error('❌ Advanced Table Parser test failed:', error);
  }
}

async function testPDFLayoutRouter() {
  console.log('\n🔄 Testing PDF Layout Router...');
  
  try {
    // Load modules dynamically
    const { pdfLayoutRouter: router } = await import('../lib/pdf-layout-router.js');
    pdfLayoutRouter = router;
    
    // Test 1: Layout analysis
    console.log('\n🔍 Test 1: Layout Analysis');
    const mockPdfBuffer = Buffer.from('Mock PDF content for layout analysis');
    const analysis = await pdfLayoutRouter.analyzeLayout(mockPdfBuffer);
    
    console.log('✅ Layout analysis completed:');
    console.log(`   - Has Tables: ${analysis.hasTables}`);
    console.log(`   - Table Count: ${analysis.tableCount}`);
    console.log(`   - Layout Type: ${analysis.layoutType}`);
    console.log(`   - Confidence: ${analysis.confidence.toFixed(2)}`);
    console.log(`   - Recommended Pipeline: ${analysis.recommendedPipeline}`);
    console.log(`   - Processing Time: ${analysis.processingTime}ms`);
    
    // Test 2: Routing decision
    console.log('\n🎯 Test 2: Routing Decision');
    const routingDecision = pdfLayoutRouter.makeRoutingDecision(analysis);
    
    console.log('✅ Routing decision made:');
    console.log(`   - Use Advanced Table Parser: ${routingDecision.useAdvancedTableParser}`);
    console.log(`   - Use Basic Text Extraction: ${routingDecision.useBasicTextExtraction}`);
    console.log(`   - Use Hybrid Approach: ${routingDecision.useHybridApproach}`);
    console.log(`   - Confidence: ${routingDecision.confidence.toFixed(2)}`);
    console.log(`   - Reasoning: ${routingDecision.reasoning}`);
    
    // Test 3: PDF routing
    console.log('\n🛣️ Test 3: PDF Routing');
    const tenantId = 1;
    const documentId = 999;
    
    const routingResult = await pdfLayoutRouter.routePDF(
      mockPdfBuffer,
      tenantId,
      documentId
    );
    
    if (routingResult.success) {
      console.log('✅ PDF routing successful:');
      console.log(`   - Pipeline: ${routingResult.pipeline}`);
      console.log(`   - Processing Time: ${routingResult.processingTime}ms`);
      
      if (routingResult.result) {
        console.log(`   - Tables: ${routingResult.result.totalTables}`);
        console.log(`   - Line Items: ${routingResult.result.totalLineItems}`);
      }
    } else {
      console.log(`❌ PDF routing failed: ${routingResult.error}`);
    }
    
    // Test 4: Routing statistics
    console.log('\n📊 Test 4: Routing Statistics');
    const routingStats = await pdfLayoutRouter.getRoutingStats(tenantId);
    console.log('✅ Routing statistics retrieved:', routingStats);
    
  } catch (error) {
    console.error('❌ PDF Layout Router test failed:', error);
  }
}

async function testConsensusEngine() {
  console.log('\n🔍 Testing Consensus Engine...');
  
  try {
    // Load modules dynamically
    const { consensusEngine: engine } = await import('../lib/consensus-engine.js');
    consensusEngine = engine;
    
    // Test 1: Mock extraction results
    console.log('\n📋 Test 1: Mock Extraction Results');
    const mockExtractionResults = [
      {
        data: {
          invoiceNumber: 'INV-001',
          totalAmount: 1500.00,
          vatRate: 23,
          issuer: 'Company A'
        },
        confidence: 0.85,
        extractionMethod: 'openai'
      },
      {
        data: {
          invoiceNumber: 'INV-001',
          totalAmount: 1500.00,
          vatRate: 23,
          issuer: 'Company A Ltd'
        },
        confidence: 0.92,
        extractionMethod: 'gemini'
      }
    ];
    
    console.log('✅ Mock extraction results created');
    
    // Test 2: Build consensus
    console.log('\n🤝 Test 2: Building Consensus');
    const documentId = 999;
    const tenantId = 1;
    
    const consensusResult = await consensusEngine.buildConsensus(
      documentId,
      tenantId,
      mockExtractionResults
    );
    
    if (consensusResult.success) {
      console.log('✅ Consensus built successfully:');
      console.log(`   - Method: ${consensusResult.consensusMethod}`);
      console.log(`   - Confidence: ${consensusResult.confidence.toFixed(2)}`);
      console.log(`   - Processing Time: ${consensusResult.processingTime}ms`);
      console.log(`   - Line Items: ${consensusResult.lineItems.length}`);
      
      // Display consensus data
      console.log('\n📊 Consensus Data:');
      Object.entries(consensusResult.finalData).forEach(([key, value]) => {
        if (key !== 'lineItems') {
          console.log(`   ${key}: ${value}`);
        }
      });
      
      if (consensusResult.lineItems.length > 0) {
        console.log('\n📋 Consensus Line Items:');
        consensusResult.lineItems.forEach((item, index) => {
          console.log(`   Item ${index + 1}:`);
          console.log(`     - Description: ${item.description}`);
          console.log(`     - Total: €${item.totalAmount}`);
          console.log(`     - Confidence: ${item.confidence.toFixed(2)}`);
          console.log(`     - Sources: ${item.sources.join(', ')}`);
        });
      }
      
    } else {
      console.log(`❌ Consensus building failed: ${consensusResult.error}`);
    }
    
    // Test 3: Store consensus results
    console.log('\n💾 Test 3: Storing Consensus Results');
    if (consensusResult.success) {
      await consensusEngine.storeConsensusResults(
        documentId,
        tenantId,
        consensusResult
      );
      console.log('✅ Consensus results stored successfully');
    }
    
  } catch (error) {
    console.error('❌ Consensus Engine test failed:', error);
  }
}

async function runIntegrationTest() {
  console.log('\n🔗 Running Integration Test...');
  
  try {
    // Test complete pipeline
    console.log('\n📄 Test: Complete Pipeline Integration');
    const mockPdfBuffer = Buffer.from('Mock PDF with tables for integration test');
    const tenantId = 1;
    const documentId = 999;
    
    // Step 1: Route PDF
    console.log('\n🔄 Step 1: PDF Routing');
    const routingResult = await pdfLayoutRouter.routePDF(
      mockPdfBuffer,
      tenantId,
      documentId
    );
    
    if (routingResult.success && routingResult.result) {
      console.log('✅ PDF routed successfully');
      
      // Step 2: Build consensus
      console.log('\n🤝 Step 2: Building Consensus');
      const mockExtractions = [
        {
          data: { documentType: 'invoice', confidence: 0.9 },
          confidence: 0.9,
          extractionMethod: 'advanced_table'
        }
      ];
      
      const consensusResult = await consensusEngine.buildConsensus(
        documentId,
        tenantId,
        mockExtractions
      );
      
      if (consensusResult.success) {
        console.log('✅ Integration test completed successfully!');
        console.log(`   - Final Confidence: ${consensusResult.confidence.toFixed(2)}`);
        console.log(`   - Line Items: ${consensusResult.lineItems.length}`);
        console.log(`   - Total Processing Time: ${routingResult.processingTime + consensusResult.processingTime}ms`);
      } else {
        console.log('❌ Consensus step failed in integration test');
      }
    } else {
      console.log('❌ PDF routing step failed in integration test');
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

async function main() {
  console.log('🚀 Advanced Table & Line-Item Extraction Test Suite');
  console.log('=' .repeat(60));
  
  try {
    // Check environment variables
    console.log('\n🔍 Environment Check:');
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      console.log('⚠️ Some tests may fail without proper configuration');
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    // Run individual component tests
    await testAdvancedTableParser();
    await testPDFLayoutRouter();
    await testConsensusEngine();
    
    // Run integration test
    await runIntegrationTest();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
main().catch(console.error);

export { main as testAdvancedTableExtraction };
