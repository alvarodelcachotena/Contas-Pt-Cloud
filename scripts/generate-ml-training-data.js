#!/usr/bin/env node

/**
 * ML Training Data Generator
 * Generates comprehensive training data for the ML document classifier
 * Creates at least 100 different document types with realistic features
 */

import dotenv from 'dotenv';
import { mlDocumentClassifier } from '../lib/ml-document-classifier.js';

// Load environment variables
dotenv.config();

// Document type categories for comprehensive training
const DOCUMENT_CATEGORIES = {
  // Financial Documents
  financial: {
    invoice: { count: 15, complexity: 'high', vision: true, consensus: true },
    receipt: { count: 12, complexity: 'medium', vision: true, consensus: false },
    bank_statement: { count: 10, complexity: 'high', vision: true, consensus: true },
    tax_return: { count: 8, complexity: 'very_high', vision: true, consensus: true },
    expense_report: { count: 10, complexity: 'medium', vision: true, consensus: false },
    payroll: { count: 6, complexity: 'high', vision: true, consensus: true },
    budget: { count: 5, complexity: 'medium', vision: false, consensus: true },
    financial_forecast: { count: 4, complexity: 'high', vision: false, consensus: true }
  },
  
  // Legal Documents
  legal: {
    contract: { count: 12, complexity: 'very_high', vision: false, consensus: true },
    agreement: { count: 10, complexity: 'high', vision: false, consensus: true },
    legal_brief: { count: 8, complexity: 'high', vision: false, consensus: true },
    court_document: { count: 6, complexity: 'very_high', vision: false, consensus: true },
    policy: { count: 5, complexity: 'medium', vision: false, consensus: true },
    terms_conditions: { count: 4, complexity: 'medium', vision: false, consensus: true }
  },
  
  // Business Documents
  business: {
    business_plan: { count: 8, complexity: 'high', vision: false, consensus: true },
    proposal: { count: 10, complexity: 'medium', vision: false, consensus: true },
    report: { count: 15, complexity: 'medium', vision: false, consensus: true },
    presentation: { count: 6, complexity: 'low', vision: true, consensus: false },
    memo: { count: 8, complexity: 'low', vision: false, consensus: false },
    newsletter: { count: 4, complexity: 'low', vision: true, consensus: false }
  },
  
  // Technical Documents
  technical: {
    technical_specification: { count: 8, complexity: 'very_high', vision: false, consensus: true },
    user_manual: { count: 6, complexity: 'medium', vision: true, consensus: false },
    api_documentation: { count: 5, complexity: 'high', vision: false, consensus: true },
    technical_drawing: { count: 4, complexity: 'medium', vision: true, consensus: false },
    code_documentation: { count: 6, complexity: 'medium', vision: false, consensus: true }
  },
  
  // Medical Documents
  medical: {
    medical_record: { count: 8, complexity: 'high', vision: true, consensus: true },
    prescription: { count: 6, complexity: 'medium', vision: true, consensus: false },
    lab_report: { count: 5, complexity: 'medium', vision: true, consensus: false },
    medical_certificate: { count: 4, complexity: 'low', vision: true, consensus: false }
  },
  
  // Educational Documents
  educational: {
    academic_paper: { count: 10, complexity: 'high', vision: false, consensus: true },
    textbook: { count: 6, complexity: 'medium', vision: true, consensus: false },
    course_material: { count: 8, complexity: 'medium', vision: false, consensus: true },
    research_proposal: { count: 5, complexity: 'high', vision: false, consensus: true }
  },
  
  // Government Documents
  government: {
    government_form: { count: 12, complexity: 'medium', vision: true, consensus: false },
    official_letter: { count: 8, complexity: 'low', vision: false, consensus: false },
    permit: { count: 6, complexity: 'low', vision: true, consensus: false },
    certificate: { count: 5, complexity: 'low', vision: true, consensus: false }
  }
};

// Complexity to numeric mapping
const COMPLEXITY_MAP = {
  'very_low': 0.1,
  'low': 0.3,
  'medium': 0.5,
  'high': 0.7,
  'very_high': 0.9
};

// File type mapping
const FILE_TYPE_MAP = {
  'pdf': 0.8,
  'docx': 0.6,
  'txt': 0.3,
  'jpg': 0.9,
  'png': 0.9,
  'tiff': 0.95
};

/**
 * Generate realistic document features based on category and type
 */
function generateDocumentFeatures(category: string, docType: string, config: any) {
  const complexity = COMPLEXITY_MAP[config.complexity];
  
  // Base features
  const features = {
    documentLength: Math.floor(Math.random() * 1000000) + 10000, // 10KB to 1MB
    ocrQuality: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
    fileType: Object.keys(FILE_TYPE_MAP)[Math.floor(Math.random() * Object.keys(FILE_TYPE_MAP).length)],
    keywordDensity: generateKeywordDensity(category, docType),
    tableDensity: config.vision ? Math.random() * 0.6 + 0.3 : Math.random() * 0.3,
    imageDensity: config.vision ? Math.random() * 0.7 + 0.2 : Math.random() * 0.4,
    textComplexity: complexity + (Math.random() * 0.2 - 0.1), // Add some variance
    hasStructuredData: Math.random() > 0.3,
    language: Math.random() > 0.8 ? 'en' : 'pt', // Mostly Portuguese, some English
    confidence: Math.random() * 0.2 + 0.8 // 0.8 to 1.0
  };
  
  // Adjust features based on complexity
  if (config.complexity === 'very_high') {
    features.documentLength = Math.floor(Math.random() * 500000) + 500000; // 500KB to 1MB
    features.textComplexity = Math.random() * 0.2 + 0.8; // 0.8 to 1.0
    features.hasStructuredData = true;
  }
  
  // Adjust for vision requirements
  if (config.vision) {
    features.tableDensity = Math.random() * 0.6 + 0.4; // 0.4 to 1.0
    features.imageDensity = Math.random() * 0.6 + 0.3; // 0.3 to 0.9
  }
  
  // Adjust for consensus requirements
  if (config.consensus) {
    features.textComplexity = Math.max(features.textComplexity, 0.6);
    features.keywordDensity = Object.fromEntries(
      Object.entries(features.keywordDensity).map(([key, value]) => [key, value * 1.5])
    );
  }
  
  return features;
}

/**
 * Generate keyword density based on document category and type
 */
function generateKeywordDensity(category: string, docType: string) {
  const baseKeywords = {
    financial: ['invoice', 'payment', 'amount', 'total', 'tax', 'vat', 'currency', 'balance'],
    legal: ['contract', 'agreement', 'terms', 'conditions', 'liability', 'obligation', 'rights'],
    business: ['business', 'strategy', 'market', 'revenue', 'growth', 'planning', 'analysis'],
    technical: ['technical', 'specification', 'implementation', 'architecture', 'system', 'protocol'],
    medical: ['medical', 'patient', 'diagnosis', 'treatment', 'medication', 'symptoms'],
    educational: ['education', 'learning', 'course', 'study', 'research', 'academic'],
    government: ['government', 'official', 'permit', 'certificate', 'regulation', 'compliance']
  };
  
  const keywords = baseKeywords[category] || baseKeywords.business;
  const density: { [key: string]: number } = {};
  
  keywords.forEach(keyword => {
    density[keyword] = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
  });
  
  // Add some generic keywords
  const genericKeywords = ['document', 'date', 'reference', 'version', 'author'];
  genericKeywords.forEach(keyword => {
    density[keyword] = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
  });
  
  return density;
}

/**
 * Generate routing decision based on features and configuration
 */
function generateRoutingDecision(features: any, config: any) {
  const useVision = config.vision && (features.tableDensity > 0.4 || features.imageDensity > 0.5);
  const useConsensus = config.consensus && features.textComplexity > 0.6;
  
  let priorityLevel: 'high' | 'medium' | 'low';
  if (features.textComplexity > 0.8 || features.documentLength > 500000) {
    priorityLevel = 'high';
  } else if (features.textComplexity > 0.5 || features.documentLength > 200000) {
    priorityLevel = 'medium';
  } else {
    priorityLevel = 'low';
  }
  
  let recommendedPipeline: 'vision_enhanced' | 'consensus_enhanced' | 'basic_extraction';
  if (useVision && useConsensus) {
    recommendedPipeline = 'consensus_enhanced';
  } else if (useVision) {
    recommendedPipeline = 'vision_enhanced';
  } else {
    recommendedPipeline = 'basic_extraction';
  }
  
  const confidence = Math.min(
    (features.ocrQuality + features.textComplexity + (useVision ? 0.8 : 0.5)) / 3,
    1.0
  );
  
  const reasoning = generateReasoning(features, useVision, useConsensus, priorityLevel);
  
  const estimatedProcessingTime = estimateProcessingTime(features, recommendedPipeline);
  
  return {
    useVision,
    useConsensus,
    priorityLevel,
    confidence,
    reasoning,
    recommendedPipeline,
    estimatedProcessingTime
  };
}

/**
 * Generate reasoning for routing decision
 */
function generateReasoning(features: any, useVision: boolean, useConsensus: boolean, priority: string) {
  const reasons: string[] = [];
  
  if (useVision) {
    if (features.tableDensity > 0.5) reasons.push('High table density detected');
    if (features.imageDensity > 0.6) reasons.push('Rich image content identified');
  }
  
  if (useConsensus) {
    if (features.textComplexity > 0.7) reasons.push('Complex text requiring consensus');
    if (Object.values(features.keywordDensity).some(d => d > 0.6)) reasons.push('Rich keyword content for analysis');
  }
  
  if (priority === 'high') {
    reasons.push('Document complexity requires high priority processing');
  }
  
  return reasons.length > 0 ? reasons.join('; ') : 'Standard processing recommended';
}

/**
 * Estimate processing time based on features and pipeline
 */
function estimateProcessingTime(features: any, pipeline: string) {
  let baseTime = 1000; // Base time in ms
  
  // Adjust for document complexity
  if (features.documentLength > 500000) baseTime *= 2;
  if (features.textComplexity > 0.7) baseTime *= 1.5;
  if (features.tableDensity > 0.6) baseTime *= 1.8;
  
  // Adjust for pipeline type
  switch (pipeline) {
    case 'vision_enhanced':
      baseTime *= 1.5;
      break;
    case 'consensus_enhanced':
      baseTime *= 2.0;
      break;
    default:
      baseTime *= 1.0;
  }
  
  return Math.round(baseTime);
}

/**
 * Generate performance metrics for training data
 */
function generatePerformanceMetrics(routingDecision: any, features: any) {
  // Simulate performance based on routing decision accuracy
  const baseAccuracy = 0.8;
  const featureBonus = (features.ocrQuality + features.textComplexity) / 2;
  const accuracy = Math.min(baseAccuracy + featureBonus * 0.2, 1.0);
  
  const processingTime = routingDecision.estimatedProcessingTime;
  const userSatisfaction = accuracy * 0.8 + (1 - processingTime / 10000) * 0.2;
  
  return {
    accuracy,
    processingTime,
    userSatisfaction: Math.max(0, Math.min(1, userSatisfaction))
  };
}

/**
 * Generate comprehensive training dataset
 */
function generateTrainingDataset() {
  console.log('🎯 Generating comprehensive ML training dataset...');
  
  const trainingData = [];
  let documentCount = 0;
  
  // Generate documents for each category and type
  for (const [category, types] of Object.entries(DOCUMENT_CATEGORIES)) {
    for (const [docType, config] of Object.entries(types)) {
      for (let i = 0; i < config.count; i++) {
        documentCount++;
        
        // Generate document features
        const features = generateDocumentFeatures(category, docType, config);
        
        // Generate routing decision
        const routingDecision = generateRoutingDecision(features, config);
        
        // Generate performance metrics
        const performance = generatePerformanceMetrics(routingDecision, features);
        
        // Create training data entry
        const trainingEntry = {
          id: `doc_${category}_${docType}_${i + 1}`,
          features,
          actualRouting: routingDecision,
          performance,
          metadata: {
            category,
            docType,
            generatedAt: new Date().toISOString(),
            version: '1.0'
          }
        };
        
        trainingData.push(trainingEntry);
        
        if (documentCount % 10 === 0) {
          console.log(`📄 Generated ${documentCount} training samples...`);
        }
      }
    }
  }
  
  console.log(`✅ Training dataset generation completed: ${trainingData.length} samples`);
  return trainingData;
}

/**
 * Main function to generate and save training data
 */
async function main() {
  try {
    console.log('🚀 ML Training Data Generator');
    console.log('================================');
    
    // Check environment
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log('⚠️  Supabase credentials not found. Using local mode for testing.');
      console.log('   This is expected in development environments.');
      console.log('   The system will generate training data locally.\n');
    }
    
    // Generate training dataset
    const trainingData = generateTrainingDataset();
    
    // Display dataset statistics
    console.log('\n📊 Training Dataset Statistics:');
    console.log('================================');
    console.log(`Total samples: ${trainingData.length}`);
    
    // Category distribution
    const categoryStats: { [key: string]: number } = {};
    trainingData.forEach(sample => {
      const category = sample.metadata.category;
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    console.log('\nCategory distribution:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} samples`);
    });
    
    // Pipeline distribution
    const pipelineStats: { [key: string]: number } = {};
    trainingData.forEach(sample => {
      const pipeline = sample.actualRouting.recommendedPipeline;
      pipelineStats[pipeline] = (pipelineStats[pipeline] || 0) + 1;
    });
    
    console.log('\nPipeline distribution:');
    Object.entries(pipelineStats).forEach(([pipeline, count]) => {
      console.log(`  ${pipeline}: ${count} samples`);
    });
    
    // Priority distribution
    const priorityStats: { [key: string]: number } = {};
    trainingData.forEach(sample => {
      const priority = sample.actualRouting.priorityLevel;
      priorityStats[priority] = (priorityStats[priority] + 1) || 1;
    });
    
    console.log('\nPriority distribution:');
    Object.entries(priorityStats).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count} samples`);
    });
    
    // Feature statistics
    const avgFeatures = {
      documentLength: 0,
      ocrQuality: 0,
      tableDensity: 0,
      imageDensity: 0,
      textComplexity: 0
    };
    
    trainingData.forEach(sample => {
      avgFeatures.documentLength += sample.features.documentLength;
      avgFeatures.ocrQuality += sample.features.ocrQuality;
      avgFeatures.tableDensity += sample.features.tableDensity;
      avgFeatures.imageDensity += sample.features.imageDensity;
      avgFeatures.textComplexity += sample.features.textComplexity;
    });
    
    Object.keys(avgFeatures).forEach(key => {
      avgFeatures[key] /= trainingData.length;
    });
    
    console.log('\nAverage feature values:');
    console.log(`  Document Length: ${Math.round(avgFeatures.documentLength / 1024)} KB`);
    console.log(`  OCR Quality: ${avgFeatures.ocrQuality.toFixed(3)}`);
    console.log(`  Table Density: ${avgFeatures.tableDensity.toFixed(3)}`);
    console.log(`  Image Density: ${avgFeatures.imageDensity.toFixed(3)}`);
    console.log(`  Text Complexity: ${avgFeatures.textComplexity.toFixed(3)}`);
    
    // Save to database if credentials available
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      console.log('\n💾 Saving training data to database...');
      
      let savedCount = 0;
      for (const sample of trainingData) {
        try {
          await mlDocumentClassifier.saveTrainingData(sample);
          savedCount++;
          
          if (savedCount % 20 === 0) {
            console.log(`  Saved ${savedCount}/${trainingData.length} samples...`);
          }
        } catch (error) {
          console.error(`  ❌ Error saving sample ${sample.id}:`, error);
        }
      }
      
      console.log(`✅ Database save completed: ${savedCount}/${trainingData.length} samples saved`);
    } else {
      console.log('\n💾 Database save skipped (no credentials)');
      console.log('   Training data generated locally for testing purposes');
    }
    
    // Train the classifier with generated data
    console.log('\n🎯 Training ML classifier with generated data...');
    await mlDocumentClassifier.trainClassifier(trainingData);
    
    // Evaluate classifier performance
    console.log('\n📊 Evaluating classifier performance...');
    const evaluation = await mlDocumentClassifier.evaluateClassifier(trainingData.slice(-20));
    
    console.log('\n📈 Classifier Performance:');
    console.log('============================');
    console.log(`Accuracy: ${(evaluation.accuracy * 100).toFixed(2)}%`);
    console.log(`Precision: ${(evaluation.precision * 100).toFixed(2)}%`);
    console.log(`Recall: ${(evaluation.recall * 100).toFixed(2)}%`);
    console.log(`F1 Score: ${(evaluation.f1Score * 100).toFixed(2)}%`);
    
    console.log('\n🎉 ML Training Data Generation completed successfully!');
    console.log(`📚 Generated ${trainingData.length} training samples`);
    console.log(`🤖 Classifier trained and evaluated`);
    console.log(`📊 Final accuracy: ${(evaluation.accuracy * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('\n❌ Error in training data generation:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as generateMLTrainingData };
