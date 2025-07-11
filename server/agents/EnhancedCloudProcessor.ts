import { ExtractionResult } from '../../shared/types';
import { AgentExtractorOpenAI } from './AgentExtractorOpenAI';
// MultiAgentDocumentProcessor removed during cleanup
import { AgentExtractorGemini } from './AgentExtractorGemini';

interface ProcessingOptions {
  useVision?: boolean;
  useMultiAgent?: boolean;
  useConsensus?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

interface ConsensusResult {
  finalData: any;
  confidenceScore: number;
  consensusMetrics: {
    agreement: number;
    conflicts: string[];
    resolvedFields: string[];
  };
  modelResults: {
    [model: string]: ExtractionResult;
  };
}

export class EnhancedCloudProcessor {
  private openaiExtractor: AgentExtractorOpenAI;
  private geminiExtractor: AgentExtractorGemini;
  // MultiAgentDocumentProcessor removed during cleanup

  constructor(openaiKey: string, geminiKey: string) {
    this.openaiExtractor = new AgentExtractorOpenAI(openaiKey);
    this.geminiExtractor = new AgentExtractorGemini(geminiKey);
    // MultiAgentDocumentProcessor initialization removed
  }

  async processDocument(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    ocrText?: string,
    options: ProcessingOptions = {}
  ): Promise<ExtractionResult> {
    const {
      useVision = true,
      useMultiAgent = false,
      useConsensus = false,
      priority = 'normal'
    } = options;

    try {
      // Primary strategy: Prioritize Gemini for all PDF processing
      if (mimeType === 'application/pdf') {
        try {
          console.log('🔄 Processing PDF with Gemini (priority AI):', filename);
          return await this.geminiExtractor.extractFromPDF(fileBuffer, filename);
        } catch (geminiError) {
          console.log('Gemini PDF processing failed:', geminiError instanceof Error ? geminiError.message : String(geminiError));
          
          // Secondary fallback to OpenAI vision processing for PDFs
          try {
            console.log('Attempting OpenAI vision processing...');
            return await this.openaiExtractor.extractFromImage(fileBuffer, mimeType, filename);
          } catch (openaiError) {
            console.log('OpenAI vision also failed:', openaiError instanceof Error ? openaiError.message : String(openaiError));
            
            // Final fallback with basic data
            return {
              data: {
                vendor: "Processing Failed",
                nif: "",
                nifCountry: "",
                vendorAddress: "",
                vendorPhone: "",
                invoiceNumber: "",
                issueDate: new Date().toISOString().split('T')[0],
                total: 0,
                netAmount: 0,
                vatAmount: 0,
                vatRate: 0.23,
                category: "outras_despesas",
                description: `Failed to process: ${filename}`
              },
              confidenceScore: 0.1,
              issues: ['Both Gemini and OpenAI processing failed'],
              agentResults: {
                extractor: {
                  model: "fallback",
                  method: "error_handling",
                  rawResponse: "Processing failed",
                },
              },
              processedAt: new Date(),
            };
          }
        }
      }

      // For images, prioritize Gemini vision processing
      if (this.isImageFile(mimeType)) {
        try {
          console.log('🔄 Processing image with Gemini (priority AI):', filename);
          return await this.geminiExtractor.extractFromImage(fileBuffer, mimeType, filename);
        } catch (geminiError) {
          console.log('Gemini image processing failed, fallback to OpenAI:', geminiError instanceof Error ? geminiError.message : String(geminiError));
          return await this.openaiExtractor.extractFromImage(
            fileBuffer,
            mimeType,
            filename
          );
        }
      }

      // For text content with OCR data
      if (ocrText) {
        return await this.openaiExtractor.extractFromText(ocrText, filename);
      }

      // For text files, extract text from buffer
      if (mimeType === 'text/plain') {
        const textContent = fileBuffer.toString('utf-8');
        return await this.geminiExtractor.extract(textContent, filename);
      }

      // Final fallback
      return await this.geminiExtractor.extract('Document uploaded for processing', filename);

    } catch (error) {
      console.error('Enhanced processing failed:', error);
      throw new Error(`Enhanced processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async processWithConsensus(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    ocrText?: string,
    useVision: boolean = true
  ): Promise<ExtractionResult> {
    const results: { [model: string]: ExtractionResult } = {};
    const errors: string[] = [];

    // Process with OpenAI (vision or text)
    try {
      if (useVision && this.isImageFile(mimeType)) {
        results.openai_vision = await this.openaiExtractor.extractFromImage(
          fileBuffer,
          mimeType,
          filename
        );
      } else if (ocrText) {
        results.openai_text = await this.openaiExtractor.extractFromText(
          ocrText,
          filename
        );
      }
    } catch (error) {
      errors.push(`OpenAI failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Process with Gemini as backup/consensus
    if (ocrText) {
      try {
        results.gemini = await this.geminiExtractor.extract(ocrText, filename);
      } catch (error) {
        errors.push(`Gemini failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Require at least one successful result
    if (Object.keys(results).length === 0) {
      throw new Error(`All models failed: ${errors.join(', ')}`);
    }

    // Generate consensus
    return this.generateConsensus(results, errors);
  }

  private generateConsensus(
    modelResults: { [model: string]: ExtractionResult },
    errors: string[]
  ): ExtractionResult {
    const models = Object.keys(modelResults);
    const consensusData: any = {};
    const conflicts: string[] = [];
    const resolvedFields: string[] = [];
    let totalConfidence = 0;
    let agreementCount = 0;

    // Get all possible fields from all results
    const allFields = new Set<string>();
    models.forEach(model => {
      Object.keys(modelResults[model].data).forEach(field => allFields.add(field));
    });

    // For each field, determine consensus value
    allFields.forEach(field => {
      const values: any[] = [];
      const confidences: number[] = [];

      models.forEach(model => {
        const result = modelResults[model];
        if (result.data && typeof result.data === 'object' && field in result.data) {
          const fieldValue = (result.data as any)[field];
          if (fieldValue !== undefined && fieldValue !== null) {
            values.push(fieldValue);
            confidences.push(result.confidenceScore);
          }
        }
      });

      if (values.length === 0) {
        return; // Skip empty fields
      }

      if (values.length === 1) {
        // Only one model has this field
        consensusData[field] = values[0];
        resolvedFields.push(field);
      } else {
        // Multiple models have this field - check for agreement
        const uniqueValues = Array.from(new Set(values.map(v => 
          typeof v === 'number' ? Number(v.toFixed(2)) : String(v).trim().toLowerCase()
        )));

        if (uniqueValues.length === 1) {
          // All models agree
          consensusData[field] = values[0];
          agreementCount++;
          resolvedFields.push(field);
        } else {
          // Models disagree - use highest confidence
          const maxConfidenceIndex = confidences.indexOf(Math.max(...confidences));
          consensusData[field] = values[maxConfidenceIndex];
          conflicts.push(`${field}: models disagreed (${uniqueValues.join(' vs ')})`);
          resolvedFields.push(field);
        }
      }
    });

    // Calculate overall confidence
    models.forEach(model => {
      totalConfidence += modelResults[model].confidenceScore;
    });
    const averageConfidence = totalConfidence / models.length;

    // Adjust confidence based on agreement
    const agreementRatio = agreementCount / resolvedFields.length;
    const finalConfidence = averageConfidence * (0.7 + 0.3 * agreementRatio);

    // Combine all issues
    const allIssues: string[] = [...conflicts, ...errors];
    models.forEach(model => {
      allIssues.push(...(modelResults[model].issues || []));
    });

    return {
      data: consensusData,
      confidenceScore: Math.min(finalConfidence, 1.0),
      issues: allIssues,
      agentResults: {
        extractor: {
          model: "multi-model-consensus",
          method: "structured_consensus",
          modelsUsed: models,
          agreementRatio,
          conflictCount: conflicts.length,
          consensusMetrics: {
            agreement: agreementRatio,
            conflicts,
            resolvedFields
          },
          modelResults
        }
      },
      processedAt: new Date()
    };
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/') && 
           ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType);
  }

  // Method to get processing recommendations based on document characteristics
  async getProcessingRecommendation(
    fileSize: number,
    mimeType: string,
    filename: string,
    ocrText?: string
  ): Promise<ProcessingOptions> {
    const isImage = this.isImageFile(mimeType);
    const isPDF = mimeType === 'application/pdf';
    const hasOCR = !!ocrText && ocrText.length > 100;
    const isLargeFile = fileSize > 5 * 1024 * 1024; // 5MB
    const isComplexDocument = ocrText ? ocrText.length > 2000 : false;

    // Complex document with multiple pages or sections
    if (isComplexDocument && hasOCR) {
      return {
        useVision: isImage && !isLargeFile,
        useMultiAgent: false,
        useConsensus: true,
        priority: 'high'
      };
    }

    // High-quality image that would benefit from vision
    if (isImage && !isLargeFile) {
      return {
        useVision: true,
        useMultiAgent: false,
        useConsensus: true,
        priority: 'normal'
      };
    }

    // Standard document processing
    return {
      useVision: false,
      useMultiAgent: false,
      useConsensus: hasOCR,
      priority: 'normal'
    };
  }

  // Method to validate Portuguese business rules
  private validatePortugueseCompliance(data: any): string[] {
    const issues: string[] = [];

    // NIF validation
    if (data.nif && !/^[0-9]{9}$/.test(data.nif)) {
      issues.push('Invalid Portuguese NIF format');
    }

    // VAT rate validation
    if (data.vatRate && ![0.06, 0.13, 0.23].includes(Number(data.vatRate))) {
      issues.push('Invalid Portuguese VAT rate');
    }

    // Amount consistency
    if (data.total && data.netAmount && data.vatAmount) {
      const calculatedTotal = Number(data.netAmount) + Number(data.vatAmount);
      const tolerance = 0.02; // 2 cent tolerance
      if (Math.abs(calculatedTotal - Number(data.total)) > tolerance) {
        issues.push('Amount calculation inconsistency detected');
      }
    }

    // Date format validation
    if (data.issueDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.issueDate)) {
      issues.push('Invalid date format');
    }

    return issues;
  }

  // Method to enhance extraction with business logic
  async enhanceExtraction(result: ExtractionResult): Promise<ExtractionResult> {
    const enhanced = { ...result };
    const data = { ...enhanced.data };

    // Apply Portuguese business rules
    const complianceIssues = this.validatePortugueseCompliance(data);
    enhanced.issues = [...(enhanced.issues || []), ...complianceIssues];

    // Auto-calculate missing values
    if (data.netAmount && data.vatRate && !data.vatAmount) {
      data.vatAmount = Number(data.netAmount) * Number(data.vatRate);
    }

    if (data.netAmount && data.vatAmount && !data.total) {
      data.total = Number(data.netAmount) + Number(data.vatAmount);
    }

    if (data.total && data.vatRate && !data.netAmount) {
      data.netAmount = Number(data.total) / (1 + Number(data.vatRate));
      data.vatAmount = Number(data.total) - data.netAmount;
    }

    // Enhance category detection
    if (!data.category && data.vendor) {
      data.category = this.suggestCategory(data.vendor, data.description || '');
    }

    enhanced.data = data;
    return enhanced;
  }

  private suggestCategory(vendor: string, description: string): string {
    const text = `${vendor} ${description}`.toLowerCase();
    
    if (text.includes('restaurante') || text.includes('café') || text.includes('aliment')) {
      return 'alimentacao';
    }
    if (text.includes('gasolina') || text.includes('combustivel') || text.includes('bp') || text.includes('galp')) {
      return 'combustivel';
    }
    if (text.includes('hotel') || text.includes('alojamento') || text.includes('booking')) {
      return 'alojamento';
    }
    if (text.includes('taxi') || text.includes('uber') || text.includes('transporte')) {
      return 'transporte';
    }
    if (text.includes('papel') || text.includes('caneta') || text.includes('escritorio')) {
      return 'material_escritorio';
    }
    if (text.includes('consultoria') || text.includes('servico') || text.includes('manutencao')) {
      return 'servicos';
    }

    return 'outras_despesas';
  }
}