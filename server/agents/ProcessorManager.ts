import { ExtractionResult } from '../../shared/types';
import { CloudDocumentProcessor } from './CloudDocumentProcessor';
import { ExternalDocumentProcessors, ProcessingOptions } from './ExternalDocumentProcessors';
import { VisionParser } from './VisionParser';
import { TableParser } from './TableParser';

export interface ProcessorCapabilities {
  name: string;
  type: 'internal' | 'external';
  supportedFormats: string[];
  specialties: string[];
  avgProcessingTime: number;
  costPerDocument: number;
  accuracy: number;
  isAvailable: boolean;
  description: string;
}

export interface ProcessingStrategy {
  primary: string;
  fallbacks: string[];
  enableTableExtraction: boolean;
  enableVisionParsing: boolean;
  confidenceThreshold: number;
  maxRetries: number;
}

export class ProcessorManager {
  private cloudProcessor: CloudDocumentProcessor;
  private externalProcessors: ExternalDocumentProcessors;
  private visionParser: VisionParser;
  private tableParser: TableParser;
  private processorCapabilities: Map<string, ProcessorCapabilities> = new Map();

  constructor() {
    this.cloudProcessor = new CloudDocumentProcessor();
    this.externalProcessors = new ExternalDocumentProcessors();
    this.visionParser = new VisionParser(
      process.env.OPENAI_API_KEY, 
      process.env.GOOGLE_AI_API_KEY
    );
    this.tableParser = new TableParser(
      process.env.OPENAI_API_KEY, 
      process.env.GOOGLE_AI_API_KEY
    );
    
    this.initializeCapabilities();
  }

  private initializeCapabilities() {
    // Internal processors
    this.processorCapabilities.set('gemini-openai', {
      name: 'Gemini + OpenAI',
      type: 'internal',
      supportedFormats: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      specialties: ['invoices', 'receipts', 'portuguese_documents'],
      avgProcessingTime: 5000,
      costPerDocument: 0.02,
      accuracy: 0.92,
      isAvailable: !!(process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY),
      description: 'Internal AI processing with Gemini and OpenAI models'
    });

    this.processorCapabilities.set('vision-parser', {
      name: 'Advanced Vision Parser',
      type: 'internal',
      supportedFormats: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      specialties: ['table_extraction', 'handwriting', 'stamps', 'complex_layouts'],
      avgProcessingTime: 8000,
      costPerDocument: 0.03,
      accuracy: 0.95,
      isAvailable: !!(process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY),
      description: 'Enhanced vision processing with table and element detection'
    });

    // External processors
    const externalProcessorConfigs = [
      {
        key: 'visionparser',
        name: 'VisionParser.com',
        specialties: ['receipts', 'invoices', 'financial_documents'],
        accuracy: 0.96,
        costPerDocument: 0.01,
        avgProcessingTime: 3000,
        description: 'High-accuracy receipt and invoice processing'
      },
      {
        key: 'mindee',
        name: 'Mindee Invoice OCR',
        specialties: ['invoices', 'multi_page', 'structured_data'],
        accuracy: 0.94,
        costPerDocument: 0.08,
        avgProcessingTime: 2000,
        description: 'Specialized invoice processing with 50+ language support'
      },
      {
        key: 'klippa',
        name: 'Klippa OCR',
        specialties: ['financial_documents', 'complex_tables', 'multi_language'],
        accuracy: 0.93,
        costPerDocument: 0.05,
        avgProcessingTime: 4000,
        description: 'Financial document specialist with table recognition'
      },
      {
        key: 'azure',
        name: 'Azure Form Recognizer',
        specialties: ['forms', 'invoices', 'enterprise_scale'],
        accuracy: 0.91,
        costPerDocument: 0.04,
        avgProcessingTime: 6000,
        description: 'Enterprise-grade form and invoice processing'
      },
      {
        key: 'google',
        name: 'Google Document AI',
        specialties: ['various_documents', 'custom_models', 'scalability'],
        accuracy: 0.90,
        costPerDocument: 0.03,
        avgProcessingTime: 5000,
        description: 'Scalable document processing with custom models'
      },
      {
        key: 'veryfi',
        name: 'Veryfi API',
        specialties: ['real_time', 'mobile_receipts', 'compliance'],
        accuracy: 0.92,
        costPerDocument: 0.07,
        avgProcessingTime: 2500,
        description: 'Real-time processing with compliance features'
      }
    ];

    for (const config of externalProcessorConfigs) {
      const envKey = `${config.key.toUpperCase()}_API_KEY`;
      const isAvailable = !!process.env[envKey] || 
                         (config.key === 'azure' && process.env.AZURE_FORM_RECOGNIZER_KEY) ||
                         (config.key === 'google' && process.env.GOOGLE_DOCUMENT_AI_KEY) ||
                         (config.key === 'veryfi' && process.env.VERYFI_CLIENT_ID);

      this.processorCapabilities.set(config.key, {
        name: config.name,
        type: 'external',
        supportedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
        specialties: config.specialties,
        avgProcessingTime: config.avgProcessingTime,
        costPerDocument: config.costPerDocument,
        accuracy: config.accuracy,
        isAvailable,
        description: config.description
      });
    }

    console.log(`🔧 Initialized ${this.processorCapabilities.size} document processors`);
    const available = Array.from(this.processorCapabilities.values()).filter(p => p.isAvailable);
    console.log(`✅ Available processors: ${available.map(p => p.name).join(', ')}`);
  }

  async processDocument(
    tenantId: number,
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    strategy?: Partial<ProcessingStrategy>
  ): Promise<ExtractionResult> {
    const processingStrategy = this.buildProcessingStrategy(mimeType, filename, strategy);
    
    console.log(`📄 Processing ${filename} with strategy:`, {
      primary: processingStrategy.primary,
      fallbacks: processingStrategy.fallbacks,
      features: {
        tables: processingStrategy.enableTableExtraction,
        vision: processingStrategy.enableVisionParsing
      }
    });

    let lastError: Error | null = null;
    const attempts = [processingStrategy.primary, ...processingStrategy.fallbacks];

    // Try each processor in order
    for (const processorName of attempts) {
      if (!this.isProcessorAvailable(processorName)) {
        console.log(`⏭️ Skipping unavailable processor: ${processorName}`);
        continue;
      }

      try {
        const result = await this.processWithProcessor(
          processorName,
          tenantId,
          fileBuffer,
          mimeType,
          filename,
          processingStrategy
        );

        if (this.isValidResult(result, processingStrategy.confidenceThreshold)) {
          // Enhance result with additional features if enabled
          return await this.enhanceResult(result, fileBuffer, mimeType, filename, processingStrategy);
        } else {
          console.log(`⚠️ ${processorName} result below confidence threshold: ${result.confidenceScore}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ Processor ${processorName} failed:`, lastError.message);
      }
    }

    throw lastError || new Error('All processors failed to process the document');
  }

  private async processWithProcessor(
    processorName: string,
    tenantId: number,
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    strategy: ProcessingStrategy
  ): Promise<ExtractionResult> {
    const capability = this.processorCapabilities.get(processorName);
    
    if (capability?.type === 'external') {
      // Use external API processor
      return await this.externalProcessors.processDocument(fileBuffer, mimeType, filename, {
        processor: processorName as any,
        confidence_threshold: strategy.confidenceThreshold
      });
    } else {
      // Use internal processor
      switch (processorName) {
        case 'vision-parser':
          return await this.visionParser.extractFromInvoice(fileBuffer, mimeType, filename);
        case 'gemini-openai':
        default:
          return await this.cloudProcessor.processDocument(tenantId, fileBuffer, mimeType, filename);
      }
    }
  }

  private async enhanceResult(
    result: ExtractionResult,
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    strategy: ProcessingStrategy
  ): Promise<ExtractionResult> {
    let enhancedResult = { ...result };

    // Add table extraction if enabled and not already present
    if (strategy.enableTableExtraction && !result.agentResults?.tableParser) {
      try {
        const tableResult = await this.tableParser.parseTablesFromDocument(
          fileBuffer, mimeType, filename, {
            detectHeaders: true,
            extractNumericData: true,
            handleComplexLayouts: true
          }
        );

        if (tableResult.tables.length > 0) {
          enhancedResult.agentResults = {
            ...enhancedResult.agentResults,
            tableParser: {
              model: 'table-parser',
              method: 'structured-extraction',
              rawResponse: tableResult
            }
          };

          // Extract line items if available
          const lineItems = await this.tableParser.extractInvoiceLineItems(fileBuffer, mimeType, filename);
          if (lineItems.length > 0) {
            enhancedResult.data.lineItems = lineItems;
          }
        }
      } catch (error) {
        console.warn('Table extraction enhancement failed:', error instanceof Error ? error.message : String(error));
      }
    }

    // Add vision parsing if enabled and not already present
    if (strategy.enableVisionParsing && !result.agentResults?.visionParser) {
      try {
        const visionResult = await this.visionParser.parseDocument(
          fileBuffer, mimeType, filename, {
            enhanceOCR: true,
            detectHandwriting: true,
            extractTables: false, // Already handled above
            multiLanguage: true
          }
        );

        enhancedResult.agentResults = {
          ...enhancedResult.agentResults,
          visionParser: {
            model: 'vision-parser',
            method: 'enhanced-vision',
            rawResponse: visionResult
          }
        };

        // Add detected elements to issues if significant
        if (visionResult.detectedElements.handwriting.length > 0) {
          enhancedResult.issues.push(`Detected ${visionResult.detectedElements.handwriting.length} handwritten annotations`);
        }
        if (visionResult.detectedElements.stamps.length > 0) {
          enhancedResult.issues.push(`Detected ${visionResult.detectedElements.stamps.length} stamps or seals`);
        }
      } catch (error) {
        console.warn('Vision parsing enhancement failed:', error instanceof Error ? error.message : String(error));
      }
    }

    return enhancedResult;
  }

  private buildProcessingStrategy(
    mimeType: string,
    filename: string,
    userStrategy?: Partial<ProcessingStrategy>
  ): ProcessingStrategy {
    const defaults: ProcessingStrategy = {
      primary: this.selectBestProcessor(mimeType, filename),
      fallbacks: this.getDefaultFallbacks(mimeType, filename),
      enableTableExtraction: true,
      enableVisionParsing: mimeType.startsWith('image/'),
      confidenceThreshold: 0.75,
      maxRetries: 3
    };

    const strategy = { ...defaults, ...userStrategy };
    
    // Filter fallbacks to only include available processors
    strategy.fallbacks = strategy.fallbacks.filter(processor => this.isProcessorAvailable(processor));
    
    console.log(`📋 Processing strategy for ${filename}: primary=${strategy.primary}, fallbacks=[${strategy.fallbacks.join(', ')}]`);
    
    return strategy;
  }

  private selectBestProcessor(mimeType: string, filename: string): string {
    const available = Array.from(this.processorCapabilities.entries())
      .filter(([_, cap]) => cap.isAvailable && cap.supportedFormats.includes(mimeType))
      .sort((a, b) => b[1].accuracy - a[1].accuracy);

    if (available.length === 0) {
      return 'gemini-openai'; // Fallback
    }

    // Prefer external processors for specific document types
    if (filename.toLowerCase().includes('invoice') || filename.toLowerCase().includes('fatura')) {
      const invoiceSpecialist = available.find(([_, cap]) => 
        cap.specialties.includes('invoices') && cap.type === 'external'
      );
      if (invoiceSpecialist) return invoiceSpecialist[0];
    }

    if (filename.toLowerCase().includes('receipt') || filename.toLowerCase().includes('recibo')) {
      const receiptSpecialist = available.find(([_, cap]) => 
        cap.specialties.includes('receipts') && cap.type === 'external'
      );
      if (receiptSpecialist) return receiptSpecialist[0];
    }

    // Default to highest accuracy
    return available[0][0];
  }

  private getDefaultFallbacks(mimeType: string, filename: string): string[] {
    const available = Array.from(this.processorCapabilities.entries())
      .filter(([_, cap]) => cap.isAvailable && cap.supportedFormats.includes(mimeType))
      .sort((a, b) => b[1].accuracy - a[1].accuracy)
      .map(([name]) => name);

    const primary = this.selectBestProcessor(mimeType, filename);
    return available.filter(name => name !== primary).slice(0, 3); // Top 3 fallbacks
  }

  private isProcessorAvailable(processorName: string): boolean {
    const capability = this.processorCapabilities.get(processorName);
    return capability?.isAvailable || false;
  }

  private isValidResult(result: ExtractionResult, threshold: number): boolean {
    return result.confidenceScore >= threshold && 
           (!!result.data.vendor || !!result.data.total || !!result.data.invoiceNumber);
  }

  // Public API methods
  getAvailableProcessors(): ProcessorCapabilities[] {
    return Array.from(this.processorCapabilities.values()).filter(p => p.isAvailable);
  }

  getProcessorCapabilities(): Map<string, ProcessorCapabilities> {
    return new Map(this.processorCapabilities);
  }

  getRecommendedProcessor(mimeType: string, filename: string): string {
    return this.selectBestProcessor(mimeType, filename);
  }

  getProcessingCost(processorName: string): number {
    return this.processorCapabilities.get(processorName)?.costPerDocument || 0;
  }

  async testProcessor(processorName: string): Promise<boolean> {
    try {
      const capability = this.processorCapabilities.get(processorName);
      if (!capability?.isAvailable) return false;

      // Could add actual health check here
      return true;
    } catch {
      return false;
    }
  }
}