import { advancedTableParser, type TableExtractionResult } from './advanced-table-parser';

export interface LayoutAnalysisResult {
  hasTables: boolean;
  tableCount: number;
  layoutType: 'tabular' | 'text' | 'mixed' | 'image';
  confidence: number;
  recommendedPipeline: 'advanced_table' | 'basic_text' | 'hybrid';
  tableRegions: any[];
  processingTime: number;
}

export interface PipelineRoutingDecision {
  useAdvancedTableParser: boolean;
  useBasicTextExtraction: boolean;
  useHybridApproach: boolean;
  confidence: number;
  reasoning: string;
}

export class PDFLayoutRouter {
  private readonly TABLE_DETECTION_THRESHOLD = 0.7;
  private readonly LAYOUT_ANALYSIS_TIMEOUT = 30000; // 30 seconds

  /**
   * Analyze PDF layout and determine the best processing pipeline
   */
  async analyzeLayout(pdfBuffer: Buffer): Promise<LayoutAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Analyzing PDF layout for optimal routing...');
      
      // Step 1: Quick layout analysis using basic heuristics
      const basicAnalysis = this.performBasicLayoutAnalysis(pdfBuffer);
      
      // Step 2: Enhanced table detection if basic analysis suggests tables
      let tableRegions: any[] = [];
      let tableCount = 0;
      let hasTables = false;
      
      if (basicAnalysis.suggestsTables) {
        try {
          console.log('📊 Performing enhanced table detection...');
          
          // Use a timeout to prevent hanging on complex documents
          const tableDetectionPromise = this.detectTableRegions(pdfBuffer);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Table detection timeout')), this.LAYOUT_ANALYSIS_TIMEOUT)
          );
          
          tableRegions = await Promise.race([tableDetectionPromise, timeoutPromise]) as any[];
          tableCount = tableRegions.length;
          hasTables = tableCount > 0;
          
        } catch (error) {
          console.warn('⚠️ Enhanced table detection failed, using basic analysis:', error);
          hasTables = basicAnalysis.suggestsTables;
          tableCount = basicAnalysis.estimatedTableCount || 0;
        }
      }
      
      // Step 3: Determine layout type and recommended pipeline
      const layoutType = this.determineLayoutType(hasTables, basicAnalysis);
      const recommendedPipeline = this.recommendPipeline(layoutType, hasTables, tableCount);
      
      const processingTime = Date.now() - startTime;
      
      const result: LayoutAnalysisResult = {
        hasTables,
        tableCount,
        layoutType,
        confidence: this.calculateConfidence(hasTables, tableCount, basicAnalysis),
        recommendedPipeline,
        tableRegions,
        processingTime
      };
      
      console.log(`✅ Layout analysis complete: ${layoutType} layout, ${tableCount} tables, recommended: ${recommendedPipeline}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Layout analysis failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      // Return safe fallback
      return {
        hasTables: false,
        tableCount: 0,
        layoutType: 'text',
        confidence: 0.5,
        recommendedPipeline: 'basic_text',
        tableRegions: [],
        processingTime
      };
    }
  }

  /**
   * Make routing decision based on layout analysis
   */
  makeRoutingDecision(analysis: LayoutAnalysisResult): PipelineRoutingDecision {
    const decision: PipelineRoutingDecision = {
      useAdvancedTableParser: false,
      useBasicTextExtraction: false,
      useHybridApproach: false,
      confidence: analysis.confidence,
      reasoning: ''
    };
    
    try {
      switch (analysis.recommendedPipeline) {
        case 'advanced_table':
          decision.useAdvancedTableParser = true;
          decision.reasoning = `Document has ${analysis.tableCount} tables with ${analysis.confidence.toFixed(2)} confidence. Using advanced table parser.`;
          break;
          
        case 'basic_text':
          decision.useBasicTextExtraction = true;
          decision.reasoning = `Document appears to be text-based with no significant tables. Using basic text extraction.`;
          break;
          
        case 'hybrid':
          decision.useAdvancedTableParser = true;
          decision.useBasicTextExtraction = true;
          decision.reasoning = `Document has mixed content (${analysis.tableCount} tables + text). Using hybrid approach.`;
          break;
          
        default:
          decision.useBasicTextExtraction = true;
          decision.reasoning = 'Unable to determine optimal pipeline, falling back to basic text extraction.';
      }
      
      console.log(`🎯 Routing decision: ${decision.reasoning}`);
      
    } catch (error) {
      console.error('❌ Failed to make routing decision:', error);
      decision.useBasicTextExtraction = true;
      decision.reasoning = 'Error in routing decision, using basic text extraction as fallback.';
    }
    
    return decision;
  }

  /**
   * Route PDF to appropriate processing pipeline
   */
  async routePDF(
    pdfBuffer: Buffer,
    tenantId: number,
    documentId: number
  ): Promise<{
    success: boolean;
    result?: TableExtractionResult;
    pipeline: string;
    processingTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Routing PDF to optimal processing pipeline...');
      
      // Step 1: Analyze layout
      const layoutAnalysis = await this.analyzeLayout(pdfBuffer);
      
      // Step 2: Make routing decision
      const routingDecision = this.makeRoutingDecision(layoutAnalysis);
      
      // Step 3: Execute appropriate pipeline
      let result: TableExtractionResult | undefined;
      let pipeline = 'unknown';
      
      if (routingDecision.useAdvancedTableParser) {
        console.log('🚀 Executing advanced table parser pipeline...');
        
        try {
          result = await advancedTableParser.extractTablesAndLineItems(pdfBuffer, tenantId, documentId);
          pipeline = 'advanced_table';
          
          if (result.success) {
            console.log(`✅ Advanced table parser completed: ${result.totalTables} tables, ${result.totalLineItems} line items`);
          } else {
            console.warn('⚠️ Advanced table parser failed, will try fallback if available');
          }
          
        } catch (error) {
          console.error('❌ Advanced table parser execution failed:', error);
          pipeline = 'advanced_table_failed';
        }
      }
      
      // Step 4: Execute basic text extraction if needed
      if (routingDecision.useBasicTextExtraction && (!result || !result.success)) {
        console.log('📝 Executing basic text extraction pipeline...');
        
        try {
          // This would integrate with your existing text extraction pipeline
          // For now, we'll simulate it
          result = await this.executeBasicTextExtraction(pdfBuffer, tenantId, documentId);
          pipeline = pipeline === 'advanced_table_failed' ? 'fallback_text' : 'basic_text';
          
          console.log('✅ Basic text extraction completed');
          
        } catch (error) {
          console.error('❌ Basic text extraction also failed:', error);
          pipeline = 'all_pipelines_failed';
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      if (result && result.success) {
        return {
          success: true,
          result,
          pipeline,
          processingTime
        };
      } else {
        return {
          success: false,
          pipeline,
          processingTime,
          error: result?.error || 'All processing pipelines failed'
        };
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ PDF routing failed:', error);
      
      return {
        success: false,
        pipeline: 'routing_failed',
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown routing error'
      };
    }
  }

  /**
   * Perform basic layout analysis using heuristics
   */
  private performBasicLayoutAnalysis(pdfBuffer: Buffer): {
    suggestsTables: boolean;
    estimatedTableCount: number;
    confidence: number;
    layoutHints: string[];
  } {
    try {
      console.log('🔍 Performing basic layout analysis...');
      
      const layoutHints: string[] = [];
      let tableScore = 0;
      let confidence = 0.5;
      
      // Analyze PDF content for table indicators
      // This is a simplified analysis - in production you'd use more sophisticated methods
      
      // Check for common table indicators in text
      const textContent = this.extractTextContent(pdfBuffer);
      
      if (textContent) {
        // Look for table-like patterns
        const lines = textContent.split('\n');
        let consecutiveAlignedLines = 0;
        let hasHeaders = false;
        let hasNumbers = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Check for header-like patterns
          if (line.match(/^(description|item|product|quantity|price|amount|total|vat|tax)/i)) {
            hasHeaders = true;
            tableScore += 2;
            layoutHints.push('Header row detected');
          }
          
          // Check for number patterns
          if (line.match(/\d+[.,]\d{2}/)) {
            hasNumbers = true;
            tableScore += 1;
          }
          
          // Check for aligned columns (simplified)
          if (line.includes('\t') || line.match(/\s{3,}/)) {
            consecutiveAlignedLines++;
            if (consecutiveAlignedLines > 2) {
              tableScore += 3;
              layoutHints.push('Aligned columns detected');
            }
          } else {
            consecutiveAlignedLines = 0;
          }
        }
        
        // Additional scoring
        if (hasHeaders && hasNumbers) {
          tableScore += 3;
          layoutHints.push('Headers and numbers present');
        }
        
        if (textContent.includes('€') || textContent.includes('$') || textContent.includes('£')) {
          tableScore += 1;
          layoutHints.push('Currency symbols detected');
        }
      }
      
      // Determine confidence based on score
      if (tableScore >= 8) {
        confidence = 0.9;
      } else if (tableScore >= 5) {
        confidence = 0.7;
      } else if (tableScore >= 3) {
        confidence = 0.5;
      } else {
        confidence = 0.3;
      }
      
      const suggestsTables = tableScore >= 5;
      const estimatedTableCount = suggestsTables ? Math.min(Math.ceil(tableScore / 3), 3) : 0;
      
      console.log(`📊 Basic analysis: score=${tableScore}, confidence=${confidence}, suggestsTables=${suggestsTables}`);
      
      return {
        suggestsTables,
        estimatedTableCount,
        confidence,
        layoutHints
      };
      
    } catch (error) {
      console.warn('⚠️ Basic layout analysis failed:', error);
      
      return {
        suggestsTables: false,
        estimatedTableCount: 0,
        confidence: 0.3,
        layoutHints: ['Analysis failed']
      };
    }
  }

  /**
   * Detect table regions in PDF
   */
  private async detectTableRegions(pdfBuffer: Buffer): Promise<any[]> {
    try {
      // This would integrate with your actual table detection logic
      // For now, we'll simulate it
      
      console.log('🔍 Detecting table regions...');
      
      // Simulate table region detection
      const mockRegions = [
        {
          id: 'table_region_1',
          page: 1,
          confidence: 0.95,
          boundingBox: { x: 50, y: 100, width: 500, height: 300 },
          type: 'invoice_table'
        }
      ];
      
      // Add some randomness to simulate real detection
      if (Math.random() > 0.3) {
        mockRegions.push({
          id: 'table_region_2',
          page: 2,
          confidence: 0.87,
          boundingBox: { x: 50, y: 150, width: 500, height: 250 },
          type: 'summary_table'
        });
      }
      
      console.log(`✅ Detected ${mockRegions.length} table regions`);
      
      return mockRegions;
      
    } catch (error) {
      console.error('❌ Table region detection failed:', error);
      return [];
    }
  }

  /**
   * Determine layout type based on analysis
   */
  private determineLayoutType(hasTables: boolean, basicAnalysis: any): 'tabular' | 'text' | 'mixed' | 'image' {
    if (hasTables && basicAnalysis.confidence > 0.7) {
      return 'tabular';
    } else if (hasTables && basicAnalysis.confidence <= 0.7) {
      return 'mixed';
    } else if (basicAnalysis.layoutHints.some((hint: string) => hint.includes('image'))) {
      return 'image';
    } else {
      return 'text';
    }
  }

  /**
   * Recommend processing pipeline based on layout
   */
  private recommendPipeline(
    layoutType: string,
    hasTables: boolean,
    tableCount: number
  ): 'advanced_table' | 'basic_text' | 'hybrid' {
    switch (layoutType) {
      case 'tabular':
        return 'advanced_table';
      case 'mixed':
        return 'hybrid';
      case 'text':
        return 'basic_text';
      case 'image':
        return 'basic_text'; // Images need OCR first
      default:
        return 'basic_text';
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(hasTables: boolean, tableCount: number, basicAnalysis: any): number {
    let confidence = basicAnalysis.confidence;
    
    if (hasTables) {
      confidence += 0.1; // Bonus for having tables
      if (tableCount > 1) {
        confidence += 0.05; // Bonus for multiple tables
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Extract text content from PDF buffer
   */
  private extractTextContent(pdfBuffer: Buffer): string | null {
    try {
      // This is a placeholder - in production you'd use pdf-parse or similar
      // For now, we'll return a mock text to demonstrate the logic
      
      return `
Description\tQuantity\tUnit Price\tTotal
Consulting Services\t10\t€150.00\t€1,500.00
Software License\t1\t€500.00\t€500.00
Office Supplies\t5\t€25.00\t€125.00
      `.trim();
      
    } catch (error) {
      console.warn('⚠️ Text extraction failed:', error);
      return null;
    }
  }

  /**
   * Execute basic text extraction pipeline
   */
  private async executeBasicTextExtraction(
    pdfBuffer: Buffer,
    tenantId: number,
    documentId: number
  ): Promise<TableExtractionResult> {
    try {
      console.log('📝 Executing basic text extraction...');
      
      // This would integrate with your existing text extraction pipeline
      // For now, we'll return a mock result
      
      const processingTime = 1000; // Simulate processing time
      
      return {
        success: true,
        tables: [],
        lineItems: [],
        totalTables: 0,
        totalLineItems: 0,
        processingTime,
        fallbackUsed: true
      };
      
    } catch (error) {
      console.error('❌ Basic text extraction failed:', error);
      
      throw error;
    }
  }

  /**
   * Get routing statistics
   */
  async getRoutingStats(tenantId: number): Promise<any> {
    try {
      // This would query your database for routing statistics
      // For now, we'll return mock data
      
      return {
        totalDocuments: 150,
        routedToAdvancedTable: 45,
        routedToBasicText: 95,
        routedToHybrid: 10,
        averageRoutingConfidence: 0.78,
        successRate: 0.94
      };
      
    } catch (error) {
      console.error('❌ Failed to get routing stats:', error);
      return {};
    }
  }
}

// Export singleton instance
export const pdfLayoutRouter = new PDFLayoutRouter();
