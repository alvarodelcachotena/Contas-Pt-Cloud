import { ExtractionResult } from '../../shared/types';
import { AgentExtractorOpenAI } from './AgentExtractorOpenAI';
import { AgentExtractorGemini } from './AgentExtractorGemini';
import { ExternalDocumentProcessors } from './ExternalDocumentProcessors';
import { TableParser } from './TableParser';
import { DocumentClassifier } from './DocumentClassifier';
import { ConfidenceCalibrator } from './ConfidenceCalibrator';
import { ManualCorrectionCollector } from './ManualCorrectionCollector';

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
  private openaiExtractor: AgentExtractorOpenAI;
  private geminiExtractor: AgentExtractorGemini;
  private externalProcessors: ExternalDocumentProcessors;
  private tableParser: TableParser;
  private documentClassifier: DocumentClassifier;
  private confidenceCalibrator: ConfidenceCalibrator;
  private correctionCollector: ManualCorrectionCollector;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is required');
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_AI_API_KEY;

    this.openaiExtractor = new AgentExtractorOpenAI(openaiKey);
    this.geminiExtractor = new AgentExtractorGemini(googleKey);
    this.externalProcessors = new ExternalDocumentProcessors();
    this.tableParser = new TableParser(openaiKey);
    this.documentClassifier = new DocumentClassifier(googleKey);
    this.correctionCollector = new ManualCorrectionCollector();
    this.confidenceCalibrator = new ConfidenceCalibrator(googleKey, true, this.correctionCollector);
  }

  async processDocument(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    ocrText?: string,
  ): Promise<ExtractionResult> {
    try {
      // Get document classification
      const classification = await this.documentClassifier.classifyDocument(
        fileBuffer,
        mimeType,
        ocrText || ''
      );
      console.log('📋 Document Classification:', classification);

      // Process with appropriate model based on classification
      let result: ExtractionResult;
      if (classification.useVision) {
        if (mimeType === 'application/pdf') {
          result = await this.geminiExtractor.extractFromPDF(fileBuffer, filename);
        } else {
          result = await this.geminiExtractor.extractFromImage(fileBuffer, mimeType, filename);
        }
      } else if (ocrText) {
        result = await this.geminiExtractor.extract(ocrText, filename);
      } else {
        result = await this.openaiExtractor.extractFromText(fileBuffer.toString(), filename);
      }

      // Calibrate confidence score
      const calibratedConfidence = await this.confidenceCalibrator.calibrateConfidence(result);
      result.confidenceScore = calibratedConfidence;

      return result;
    } catch (error) {
      console.error('❌ Error in ProcessorManager:', error);
      throw error;
    }
  }
}