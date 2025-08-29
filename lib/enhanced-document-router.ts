import { mlDocumentClassifier, type DocumentFeatures, type RoutingDecision } from './ml-document-classifier';
import { advancedTableParser } from './advanced-table-parser';
import { consensusEngine } from './consensus-engine';
import { pdfLayoutRouter } from './pdf-layout-router';

export interface EnhancedRoutingResult {
  success: boolean;
  routingDecision: RoutingDecision;
  processingPipeline: string;
  estimatedTime: number;
  confidence: number;
  features: DocumentFeatures;
  error?: string;
}

export interface ProcessingPipeline {
  name: string;
  description: string;
  estimatedTime: number;
  confidence: number;
  steps: string[];
}

export class EnhancedDocumentRouter {
  private processingPipelines!: Map<string, ProcessingPipeline>;
  
  constructor() {
    this.initializeProcessingPipelines();
  }

  private initializeProcessingPipelines(): void {
    this.processingPipelines = new Map([
      ['vision_enhanced', {
        name: 'Vision Enhanced Processing',
        description: 'Uses advanced computer vision for table and image analysis',
        estimatedTime: 3000,
        confidence: 0.85,
        steps: [
          'Document layout analysis',
          'Table structure detection',
          'Image content analysis',
          'OCR text extraction',
          'Structured data extraction'
        ]
      }],
      ['consensus_enhanced', {
        name: 'Consensus Enhanced Processing',
        description: 'Combines multiple AI models for optimal extraction',
        estimatedTime: 5000,
        confidence: 0.90,
        steps: [
          'Multi-model text extraction',
          'Consensus building',
          'Confidence scoring',
          'Data validation',
          'Result fusion'
        ]
      }],
      ['basic_extraction', {
        name: 'Basic Text Extraction',
        description: 'Standard OCR and text processing',
        estimatedTime: 1500,
        confidence: 0.75,
        steps: [
          'OCR text extraction',
          'Basic text processing',
          'Simple data extraction'
        ]
      }]
    ]);
  }

  /**
   * Main routing method using ML classifier
   */
  async routeDocument(documentBuffer: Buffer, metadata: any, tenantId: number): Promise<EnhancedRoutingResult> {
    console.log('🚀 Enhanced document router processing document...');
    
    try {
      // Step 1: Extract document features for ML classification
      console.log('🔍 Step 1: Extracting document features...');
      const features = await mlDocumentClassifier.extractDocumentFeatures(documentBuffer, metadata);
      
      // Step 2: Use ML classifier to make routing decision
      console.log('🤖 Step 2: ML classification...');
      const routingDecision = await mlDocumentClassifier.classifyDocument(features);
      
      // Step 3: Select appropriate processing pipeline
      console.log('🎯 Step 3: Pipeline selection...');
      const pipeline = this.selectProcessingPipeline(routingDecision);
      
      // Step 4: Execute routing decision
      console.log('⚡ Step 4: Executing routing decision...');
      const result = await this.executeRoutingDecision(
        documentBuffer, 
        routingDecision, 
        pipeline, 
        tenantId
      );
      
      console.log('✅ Enhanced routing completed successfully');
      return {
        success: true,
        routingDecision,
        processingPipeline: pipeline.name,
        estimatedTime: pipeline.estimatedTime,
        confidence: routingDecision.confidence,
        features
      };

    } catch (error) {
      console.error('❌ Enhanced routing failed:', error);
      return {
        success: false,
        routingDecision: this.getFallbackRoutingDecision(),
        processingPipeline: 'fallback',
        estimatedTime: 2000,
        confidence: 0.5,
        features: {} as DocumentFeatures,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Select processing pipeline based on routing decision
   */
  private selectProcessingPipeline(routingDecision: RoutingDecision): ProcessingPipeline {
    const pipelineKey = routingDecision.recommendedPipeline;
    const pipeline = this.processingPipelines.get(pipelineKey);
    
    if (!pipeline) {
      console.warn('⚠️ Pipeline not found, using basic extraction');
      return this.processingPipelines.get('basic_extraction')!;
    }
    
    // Adjust pipeline parameters based on routing decision
    pipeline.estimatedTime = routingDecision.estimatedProcessingTime;
    pipeline.confidence = routingDecision.confidence;
    
    return pipeline;
  }

  /**
   * Execute the routing decision with appropriate pipeline
   */
  private async executeRoutingDecision(
    documentBuffer: Buffer,
    routingDecision: RoutingDecision,
    pipeline: ProcessingPipeline,
    tenantId: number
  ): Promise<any> {
    console.log(`🚀 Executing ${pipeline.name} pipeline...`);
    
    try {
      let result: any;
      
      if (routingDecision.useVision && routingDecision.useConsensus) {
        // Vision + Consensus pipeline
        result = await this.executeVisionConsensusPipeline(documentBuffer, tenantId);
      } else if (routingDecision.useVision) {
        // Vision-only pipeline
        result = await this.executeVisionPipeline(documentBuffer, tenantId);
      } else if (routingDecision.useConsensus) {
        // Consensus-only pipeline
        result = await this.executeConsensusPipeline(documentBuffer, tenantId);
      } else {
        // Basic pipeline
        result = await this.executeBasicPipeline(documentBuffer, tenantId);
      }
      
      console.log('✅ Pipeline execution completed');
      return result;
      
    } catch (error) {
      console.error('❌ Pipeline execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute Vision + Consensus pipeline
   */
  private async executeVisionConsensusPipeline(documentBuffer: Buffer, tenantId: number): Promise<any> {
    console.log('🔍 Executing Vision + Consensus pipeline...');
    
    // Step 1: Advanced table parsing
    const tableResult = await advancedTableParser.extractTablesAndLineItems(
      documentBuffer,
      tenantId,
      Date.now() // Use timestamp as document ID
    );
    
    // Step 2: Consensus building
    const consensusResult = await consensusEngine.buildConsensus(
      Date.now(), // documentId
      tenantId,
      [{
        tableStructures: tableResult.tables || [],
        lineItems: tableResult.lineItems || [],
        extractedData: {},
        confidence: tableResult.totalTables > 0 ? 0.85 : 0.65,
        extractionMethod: 'vision_consensus',
        processingTime: Date.now()
      }]
    );
    
    return {
      pipeline: 'vision_consensus',
      tableResult,
      consensusResult,
      totalProcessingTime: Date.now()
    };
  }

  /**
   * Execute Vision-only pipeline
   */
  private async executeVisionPipeline(documentBuffer: Buffer, tenantId: number): Promise<any> {
    console.log('👁️ Executing Vision pipeline...');
    
    // Use advanced table parser for visual analysis
    const result = await advancedTableParser.extractTablesAndLineItems(
      documentBuffer,
      tenantId,
      Date.now()
    );
    
    return {
      pipeline: 'vision_only',
      result,
      totalProcessingTime: Date.now()
    };
  }

  /**
   * Execute Consensus-only pipeline
   */
  private async executeConsensusPipeline(documentBuffer: Buffer, tenantId: number): Promise<any> {
    console.log('🤝 Executing Consensus pipeline...');
    
    // Use consensus engine for text-based consensus
    const result = await consensusEngine.buildConsensus(
      Date.now(), // documentId
      tenantId,
      [{
        tableStructures: [],
        lineItems: [],
        extractedData: { text: 'Extracted text content' },
        confidence: 0.75,
        extractionMethod: 'consensus_only',
        processingTime: Date.now()
      }]
    );
    
    return {
      pipeline: 'consensus_only',
      result,
      totalProcessingTime: Date.now()
    };
  }

  /**
   * Execute Basic pipeline
   */
  private async executeBasicPipeline(documentBuffer: Buffer, tenantId: number): Promise<any> {
    console.log('📝 Executing Basic pipeline...');
    
    // Basic text extraction (placeholder)
    const result = {
      text: 'Basic extracted text',
      confidence: 0.65,
      processingTime: Date.now()
    };
    
    return {
      pipeline: 'basic',
      result,
      totalProcessingTime: Date.now()
    };
  }

  /**
   * Get fallback routing decision
   */
  private getFallbackRoutingDecision(): RoutingDecision {
    return {
      useVision: false,
      useConsensus: false,
      priorityLevel: 'medium',
      confidence: 0.5,
      reasoning: 'Fallback routing due to error',
      recommendedPipeline: 'basic_extraction',
      estimatedProcessingTime: 2000
    };
  }

  /**
   * Batch process multiple documents with ML routing
   */
  async batchRouteDocuments(
    documents: Array<{ buffer: Buffer; metadata: any; tenantId: number }>
  ): Promise<EnhancedRoutingResult[]> {
    console.log(`🚀 Batch routing ${documents.length} documents...`);
    
    const results: EnhancedRoutingResult[] = [];
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      console.log(`📄 Processing document ${i + 1}/${documents.length}`);
      
      try {
        const result = await this.routeDocument(doc.buffer, doc.metadata, doc.tenantId);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error processing document ${i + 1}:`, error);
        results.push({
          success: false,
          routingDecision: this.getFallbackRoutingDecision(),
          processingPipeline: 'error',
          estimatedTime: 0,
          confidence: 0,
          features: {} as DocumentFeatures,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`✅ Batch routing completed: ${results.filter(r => r.success).length}/${documents.length} successful`);
    return results;
  }

  /**
   * Get routing statistics and performance metrics
   */
  async getRoutingStatistics(tenantId: number): Promise<{
    totalDocuments: number;
    successfulRoutings: number;
    averageConfidence: number;
    pipelineUsage: { [key: string]: number };
    averageProcessingTime: number;
    mlClassifierStatus: any;
  }> {
    try {
      // Get ML classifier status
      const classifierStatus = mlDocumentClassifier.getClassifierStatus();
      
      // Placeholder statistics (would come from database)
      const stats = {
        totalDocuments: 150,
        successfulRoutings: 142,
        averageConfidence: 0.82,
        pipelineUsage: {
          'vision_enhanced': 45,
          'consensus_enhanced': 38,
          'basic_extraction': 67
        },
        averageProcessingTime: 3200,
        mlClassifierStatus: classifierStatus
      };
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error getting routing statistics:', error);
      throw error;
    }
  }

  /**
   * Retrain ML classifier with new data
   */
  async retrainClassifier(trainingData: any[]): Promise<{
    success: boolean;
    accuracy: number;
    trainingTime: number;
    samplesUsed: number;
  }> {
    try {
      console.log('🎯 Retraining ML classifier...');
      const startTime = Date.now();
      
      // Train the classifier
      await mlDocumentClassifier.trainClassifier(trainingData);
      
      // Evaluate performance
      const evaluation = await mlDocumentClassifier.evaluateClassifier(trainingData.slice(-20)); // Use last 20 samples for evaluation
      
      const trainingTime = Date.now() - startTime;
      
      console.log('✅ Classifier retraining completed');
      
      return {
        success: true,
        accuracy: evaluation.accuracy,
        trainingTime,
        samplesUsed: trainingData.length
      };
      
    } catch (error) {
      console.error('❌ Error retraining classifier:', error);
      throw error;
    }
  }

  /**
   * Get available processing pipelines
   */
  getAvailablePipelines(): ProcessingPipeline[] {
    return Array.from(this.processingPipelines.values());
  }

  /**
   * Update pipeline configuration
   */
  updatePipelineConfiguration(
    pipelineName: string, 
    updates: Partial<ProcessingPipeline>
  ): boolean {
    const pipeline = this.processingPipelines.get(pipelineName);
    if (!pipeline) return false;
    
    Object.assign(pipeline, updates);
    this.processingPipelines.set(pipelineName, pipeline);
    
    console.log(`✅ Pipeline ${pipelineName} updated`);
    return true;
  }
}

// Export singleton instance
export const enhancedDocumentRouter = new EnhancedDocumentRouter();
