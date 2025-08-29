import { ExtractionResult, LineItem } from "../../shared/types";
import { GoogleGenAI } from "@google/genai";
import { ManualCorrectionCollector } from "./ManualCorrectionCollector";

interface CalibrationFeatures {
  modelConfidence: number;
  consensusAgreement: number;
  extractionQuality: {
    completeness: number;
    consistency: number;
    plausibility: number;
  };
  documentQuality: {
    ocrQuality: number;
    imageQuality?: number;
    structureQuality: number;
  };
  correctionHistory?: {
    fieldAccuracy: { [field: string]: number };
    averageTimeToCorrect: number;
    commonErrorRate: number;
  };
}

interface MLModelInput {
  features: number[];
  label: number;
}

interface MLModel {
  weights: number[];
  bias: number;
  learningRate: number;
  version: string;
  trainingSamples: number;
  lastTrained: Date;
  performance: {
    mse: number;
    accuracy: number;
  };
}

interface ConsensusResult {
  documentId: string;
  tenantId: number;
  modelResults: { [model: string]: ExtractionResult };
  finalResult: ExtractionResult;
  agreementScores: { [field: string]: number };
  overallAgreement: number;
  processingTime: number;
  timestamp: Date;
}

interface ManualCorrectionResult {
  documentId: string;
  tenantId: number;
  originalResult: ExtractionResult;
  correctedResult: ExtractionResult;
  correctionTime: number;
  correctedFields: string[];
  confidenceBefore: number;
  confidenceAfter: number;
  timestamp: Date;
}

interface ExtendedExtractionResult extends ExtractionResult {
  documentQuality?: {
    imageQuality?: number;
  };
  rawText?: string;
}

export class ConfidenceCalibrator {
  private modelVersion = "3.0.0";
  private correctionCollector: ManualCorrectionCollector | null;
  private useMLCalibration: boolean;
  private mlModel: MLModel;
  private genAI: GoogleGenAI;
  
  // Data collection for training
  private consensusData: ConsensusResult[] = [];
  private manualCorrections: ManualCorrectionResult[] = [];
  private trainingData: MLModelInput[] = [];
  
  // Feature toggle configuration
  private featureFlags = {
    enableLearnedScoring: true,
    enableConsensusDataCollection: true,
    enableManualCorrectionCollection: true,
    enableAutomaticRetraining: true,
    retrainingThreshold: 100 // Retrain after 100 new samples
  };

  constructor(
    apiKey: string,
    useMLCalibration?: boolean,
    correctionCollector?: ManualCorrectionCollector
  ) {
    this.useMLCalibration = useMLCalibration ?? true;
    this.correctionCollector = correctionCollector || null;
    this.genAI = new GoogleGenAI({ apiKey });
    this.mlModel = this.initializeModel();
  }

  private initializeModel(): MLModel {
    return {
      weights: [0.3, 0.2, 0.15, 0.1, 0.1, 0.05, 0.05, 0.05],
      bias: 0.5,
      learningRate: 0.01,
      version: this.modelVersion,
      trainingSamples: 0,
      lastTrained: new Date(),
      performance: {
        mse: 0,
        accuracy: 0
      }
    };
  }

  /**
   * Collect consensus data for training
   */
  async collectConsensusData(
    documentId: string,
    tenantId: number,
    modelResults: { [model: string]: ExtractionResult },
    finalResult: ExtractionResult
  ): Promise<void> {
    if (!this.featureFlags.enableConsensusDataCollection) return;

    try {
      const agreementScores = this.calculateFieldAgreementScores(modelResults);
      const overallAgreement = Object.values(agreementScores).reduce((a, b) => a + b, 0) / Object.keys(agreementScores).length;

      const consensusResult: ConsensusResult = {
        documentId,
        tenantId,
        modelResults,
        finalResult,
        agreementScores,
        overallAgreement,
        processingTime: Date.now(),
        timestamp: new Date()
      };

      this.consensusData.push(consensusResult);
      console.log(`📊 Collected consensus data for document ${documentId}, agreement: ${overallAgreement.toFixed(3)}`);

      // Check if we should retrain
      if (this.featureFlags.enableAutomaticRetraining && 
          this.consensusData.length >= this.featureFlags.retrainingThreshold) {
        await this.retrainModel();
      }

    } catch (error) {
      console.error('❌ Error collecting consensus data:', error);
    }
  }

  /**
   * Collect manual correction data for training
   */
  async collectManualCorrection(
    documentId: string,
    tenantId: number,
    originalResult: ExtractionResult,
    correctedResult: ExtractionResult,
    correctionTime: number
  ): Promise<void> {
    if (!this.featureFlags.enableManualCorrectionCollection) return;

    try {
      const correctedFields = this.identifyCorrectedFields(originalResult, correctedResult);
      const confidenceBefore = originalResult.confidenceScore;
      const confidenceAfter = correctedResult.confidenceScore;

      const correctionResult: ManualCorrectionResult = {
        documentId,
        tenantId,
        originalResult,
        correctedResult,
        correctionTime,
        correctedFields,
        confidenceBefore,
        confidenceAfter,
        timestamp: new Date()
      };

      this.manualCorrections.push(correctionResult);
      console.log(`✏️ Collected manual correction for document ${documentId}, fields: ${correctedFields.join(', ')}`);

      // Add to training data
      await this.addToTrainingData(originalResult, confidenceAfter);

    } catch (error) {
      console.error('❌ Error collecting manual correction:', error);
    }
  }

  /**
   * Calculate field-level agreement scores across models
   */
  private calculateFieldAgreementScores(modelResults: { [model: string]: ExtractionResult }): { [field: string]: number } {
    const models = Object.keys(modelResults);
    if (models.length < 2) return {};

    const fieldScores: { [field: string]: number } = {};
    const allFields = new Set<string>();

    // Collect all fields from all models
    models.forEach(model => {
      const data = modelResults[model].data;
      Object.keys(data).forEach(field => allFields.add(field));
    });

    // Calculate agreement for each field
    allFields.forEach(field => {
      const values = models.map(model => (modelResults[model].data as any)[field]).filter(v => v !== undefined);
      if (values.length < 2) {
        fieldScores[field] = 1.0; // Single value = perfect agreement
        return;
      }

      // Calculate agreement based on value similarity
      let agreements = 0;
      let comparisons = 0;

      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          comparisons++;
          if (this.valuesAgree(values[i], values[j])) {
            agreements++;
          }
        }
      }

      fieldScores[field] = comparisons > 0 ? agreements / comparisons : 1.0;
    });

    return fieldScores;
  }

  /**
   * Check if two values agree (with tolerance for numeric values)
   */
  private valuesAgree(value1: any, value2: any): boolean {
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return Math.abs(value1 - value2) < 0.01;
    }
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.toLowerCase().trim() === value2.toLowerCase().trim();
    }
    return value1 === value2;
  }

  /**
   * Identify which fields were corrected
   */
  private identifyCorrectedFields(original: ExtractionResult, corrected: ExtractionResult): string[] {
    const correctedFields: string[] = [];
    const originalData = original.data;
    const correctedData = corrected.data;

    Object.keys(correctedData).forEach(field => {
      if ((originalData as any)[field] !== (correctedData as any)[field]) {
        correctedFields.push(field);
      }
    });

    return correctedFields;
  }

  /**
   * Add sample to training data
   */
  private async addToTrainingData(result: ExtractionResult, trueConfidence: number): Promise<void> {
    try {
      const features = await this.extractCalibrationFeatures(result);
      const featureArray = this.featuresToArray(features);

      const trainingSample: MLModelInput = {
        features: featureArray,
        label: trueConfidence
      };

      this.trainingData.push(trainingSample);
      console.log(`📚 Added training sample, true confidence: ${trueConfidence.toFixed(3)}`);

    } catch (error) {
      console.error('❌ Error adding training sample:', error);
    }
  }

  /**
   * Convert features to array format for ML model
   */
  private featuresToArray(features: CalibrationFeatures): number[] {
    return [
      features.modelConfidence,
      features.consensusAgreement,
      features.extractionQuality.completeness,
      features.extractionQuality.consistency,
      features.extractionQuality.plausibility,
      features.documentQuality.ocrQuality,
      features.documentQuality.imageQuality || 0.5,
      features.documentQuality.structureQuality
    ];
  }

  async calibrateConfidence(result: ExtendedExtractionResult): Promise<number> {
    const features = await this.extractCalibrationFeatures(result);
    
    if (this.useMLCalibration && this.featureFlags.enableLearnedScoring) {
      return this.mlCalibration(features);
    } else {
      return this.traditionalCalibration(result);
    }
  }

  private async extractCalibrationFeatures(result: ExtendedExtractionResult): Promise<CalibrationFeatures> {
    const modelConfidence = result.confidenceScore || 0;
    const consensusAgreement = this.calculateConsensusAgreement(result);
    
    // Extract quality metrics
    const extractionQuality = await this.assessExtractionQuality(result);
    const documentQuality = await this.assessDocumentQuality(result);
    
    // Get correction history if available
    const stats = this.correctionCollector?.getStatistics();
    
    // Convert FieldStats to number (using accuracy ratio)
    const correctionHistory = stats ? {
      fieldAccuracy: Object.fromEntries(
        Object.entries(stats.accuracyByField).map(([field, stats]) => [
          field,
          stats.correct / (stats.total || 1)
        ])
      ),
      averageTimeToCorrect: stats.averageTimeToCorrect,
      commonErrorRate: Object.keys(stats.commonErrors).length / stats.totalCorrections
    } : undefined;
    
    return {
      modelConfidence,
      consensusAgreement,
      extractionQuality,
      documentQuality,
      correctionHistory
    };
  }

  private calculateConsensusAgreement(result: ExtendedExtractionResult): number {
    if (!result.agentResults?.extractor?.provenance) return 0;
    
    const provenance = result.agentResults.extractor.provenance;
    const fieldScores = Object.values(provenance).map(p => p.confidence || 0);
    
    if (fieldScores.length === 0) return 0;
    return fieldScores.reduce((a, b) => a + b, 0) / fieldScores.length;
  }

  private async assessExtractionQuality(result: ExtendedExtractionResult): Promise<{
    completeness: number;
    consistency: number;
    plausibility: number;
  }> {
    // Assess completeness
    const requiredFields = ['vendor', 'issueDate', 'total', 'nif'] as const;
    const completeness = requiredFields.filter(f => (result.data as any)[f]).length / requiredFields.length;

    // Assess consistency
    const consistency = await this.checkDataConsistency(result);

    // Assess plausibility
    const plausibility = await this.checkDataPlausibility(result);

    return {
      completeness,
      consistency,
      plausibility
    };
  }

  private async checkDataConsistency(result: ExtendedExtractionResult): Promise<number> {
    let score = 1;
    const data = result.data;

    // Check numeric consistency
    if ((data as any).total && (data as any).netAmount && (data as any).vatAmount) {
      const total = (data as any).total;
      const net = (data as any).netAmount;
      const vat = (data as any).vatAmount;
      
      if (Math.abs(total - (net + vat)) > 0.01) {
        score *= 0.8;
      }
    }

    // Check date consistency
    if (data.issueDate) {
      const date = new Date(data.issueDate);
      const now = new Date();
      if (date > now) {
        score *= 0.7;
      }
    }

    return score;
  }

  private async checkDataPlausibility(result: ExtendedExtractionResult): Promise<number> {
    let score = 1;
    const data = result.data;

    // Check amount plausibility
    if ((data as any).total) {
      const total = (data as any).total;
      if (total < 0 || total > 1000000) {
        score *= 0.6;
      }
    }

    // Check VAT rate plausibility
    if ((data as any).vatRate) {
      const vatRate = (data as any).vatRate;
      const validRates = [0, 0.06, 0.13, 0.23];
      if (!validRates.includes(vatRate)) {
        score *= 0.7;
      }
    }

    return score;
  }

  private async assessDocumentQuality(result: ExtendedExtractionResult): Promise<{
    ocrQuality: number;
    imageQuality?: number;
    structureQuality: number;
  }> {
    // Assess OCR quality
    const ocrQuality = await this.assessOCRQuality(result);

    // Assess image quality if available
    const imageQuality = result.documentQuality?.imageQuality;

    // Assess document structure
    const structureQuality = await this.assessStructureQuality(result);

    return {
      ocrQuality,
      imageQuality,
      structureQuality
    };
  }

  private async assessOCRQuality(result: ExtendedExtractionResult): Promise<number> {
    if (!result.rawText) return 0.5;

    // Check for common OCR issues
    const issues = [
      /[A-Za-z0-9][Il1][A-Za-z0-9]/g, // Potential I/l/1 confusion
      /[0OQ][0OQ]/g, // Potential 0/O/Q confusion
      /[A-Za-z]{15,}/g, // Unusually long words
      /\s{2,}/g, // Multiple spaces
    ];

    let quality = 1;
    for (const issue of issues) {
      const matches = result.rawText.match(issue) || [];
      quality -= matches.length * 0.05;
    }

    return Math.max(0.1, Math.min(1, quality));
  }

  private assessTableQuality(result: ExtendedExtractionResult): number {
    const lineItems = result.data.lineItems;
    if (!Array.isArray(lineItems) || lineItems.length === 0) return 0;

    let quality = 1;

    // Check column consistency
    const requiredColumns = ['description', 'quantity', 'unitPrice', 'totalAmount'] as const;
    for (const item of lineItems) {
      const missingColumns = requiredColumns.filter(col => !item[col]);
      quality *= (1 - missingColumns.length * 0.1);
    }

    // Check row consistency
    const rowLengths = new Set(lineItems.map(item => Object.keys(item).length));
    if (rowLengths.size > 1) {
      quality *= 0.8;
    }

    return Math.max(0.1, quality);
  }

  private async assessStructureQuality(result: ExtendedExtractionResult): Promise<number> {
    let quality = 1;

    // Check for expected document sections
    const expectedSections = ['header', 'items', 'totals', 'footer'];
    const foundSections = expectedSections.filter(section => 
      result.rawText?.toLowerCase().includes(section)
    );
    
    quality *= foundSections.length / expectedSections.length;

    // Check for table structure if present
    const lineItems = result.data.lineItems;
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      const tableQuality = this.assessTableQuality(result);
      quality *= tableQuality;
    }

    return quality;
  }

  private mlCalibration(features: CalibrationFeatures): number {
    // Convert features to array format
    const featureArray = [
      features.modelConfidence,
      features.consensusAgreement,
      features.extractionQuality.completeness,
      features.extractionQuality.consistency,
      features.extractionQuality.plausibility,
      features.documentQuality.ocrQuality,
      features.documentQuality.imageQuality || 0.5,
      features.documentQuality.structureQuality
    ];

    // Apply ML model
    let prediction = this.mlModel.bias;
    for (let i = 0; i < this.mlModel.weights.length; i++) {
      prediction += featureArray[i] * this.mlModel.weights[i];
    }

    // Apply sigmoid activation
    prediction = 1 / (1 + Math.exp(-prediction));

    // Apply correction history adjustment if available
    if (features.correctionHistory) {
      const historicalAccuracy = Object.values(features.correctionHistory.fieldAccuracy)
        .reduce((a, b) => a + b, 0) / Object.values(features.correctionHistory.fieldAccuracy).length;
      
      prediction = prediction * (0.8 + 0.2 * historicalAccuracy);
    }

    return Math.min(Math.max(prediction, 0), 1);
  }

  private traditionalCalibration(result: ExtendedExtractionResult): number {
    const baseConfidence = result.confidenceScore || 0.5;
    const agreement = this.calculateConsensusAgreement(result);
    return baseConfidence * (0.7 + 0.3 * agreement);
  }

  /**
   * Retrain the ML model with collected data
   */
  async retrainModel(): Promise<void> {
    if (this.trainingData.length < 10) {
      console.log('📚 Insufficient training data for retraining (need at least 10 samples)');
      return;
    }

    try {
      console.log(`🎯 Retraining ML model with ${this.trainingData.length} samples...`);
      const startTime = Date.now();

      // Split data into training and validation sets
      const shuffledData = [...this.trainingData].sort(() => Math.random() - 0.5);
      const splitIndex = Math.floor(shuffledData.length * 0.8);
      const trainingSet = shuffledData.slice(0, splitIndex);
      const validationSet = shuffledData.slice(splitIndex);

      // Train the model
      await this.updateModel(trainingSet);

      // Evaluate performance
      const performance = this.evaluateModel(validationSet);
      
      // Update model metadata
      this.mlModel.trainingSamples = this.trainingData.length;
      this.mlModel.lastTrained = new Date();
      this.mlModel.performance = performance;
      this.mlModel.version = `${this.modelVersion}.${Date.now()}`;

      const trainingTime = Date.now() - startTime;
      console.log(`✅ Model retraining completed in ${trainingTime}ms`);
      console.log(`📊 Performance - MSE: ${performance.mse.toFixed(4)}, Accuracy: ${performance.accuracy.toFixed(3)}`);

      // Clear old training data to prevent memory bloat
      if (this.trainingData.length > 1000) {
        this.trainingData = this.trainingData.slice(-500);
        console.log('🧹 Cleared old training data to prevent memory bloat');
      }

    } catch (error) {
      console.error('❌ Error retraining model:', error);
    }
  }

  /**
   * Evaluate model performance on validation set
   */
  private evaluateModel(validationSet: MLModelInput[]): { mse: number; accuracy: number } {
    let totalMSE = 0;
    let correctPredictions = 0;

    for (const sample of validationSet) {
      const prediction = this.predict(sample.features);
      const error = sample.label - prediction;
      totalMSE += error * error;

      // Consider prediction correct if within 0.1 of true value
      if (Math.abs(prediction - sample.label) < 0.1) {
        correctPredictions++;
      }
    }

    const mse = totalMSE / validationSet.length;
    const accuracy = correctPredictions / validationSet.length;

    return { mse, accuracy };
  }

  async updateModel(trainingData: MLModelInput[]): Promise<void> {
    // Simple gradient descent update
    for (const sample of trainingData) {
      const prediction = this.predict(sample.features);
      const error = sample.label - prediction;

      // Update weights
      for (let i = 0; i < this.mlModel.weights.length; i++) {
        this.mlModel.weights[i] += this.mlModel.learningRate * error * sample.features[i];
      }

      // Update bias
      this.mlModel.bias += this.mlModel.learningRate * error;
    }
  }

  private predict(features: number[]): number {
    let prediction = this.mlModel.bias;
    for (let i = 0; i < this.mlModel.weights.length; i++) {
      prediction += features[i] * this.mlModel.weights[i];
    }
    return 1 / (1 + Math.exp(-prediction));
  }

  /**
   * Get current model status and performance
   */
  getModelStatus(): {
    version: string;
    trainingSamples: number;
    lastTrained: Date;
    performance: { mse: number; accuracy: number };
    featureFlags: {
      enableLearnedScoring: boolean;
      enableConsensusDataCollection: boolean;
      enableManualCorrectionCollection: boolean;
      enableAutomaticRetraining: boolean;
      retrainingThreshold: number;
    };
  } {
    return {
      version: this.mlModel.version,
      trainingSamples: this.mlModel.trainingSamples,
      lastTrained: this.mlModel.lastTrained,
      performance: this.mlModel.performance,
      featureFlags: { ...this.featureFlags }
    };
  }

  /**
   * Update feature flags
   */
  updateFeatureFlags(updates: Partial<typeof this.featureFlags>): void {
    Object.assign(this.featureFlags, updates);
    console.log('🔧 Feature flags updated:', updates);
  }

  /**
   * Get collected data statistics
   */
  getDataStatistics(): {
    consensusDataCount: number;
    manualCorrectionsCount: number;
    trainingDataCount: number;
  } {
    return {
      consensusDataCount: this.consensusData.length,
      manualCorrectionsCount: this.manualCorrections.length,
      trainingDataCount: this.trainingData.length
    };
  }

  /**
   * Export model for persistence
   */
  exportModel(): MLModel {
    return { ...this.mlModel };
  }

  /**
   * Import model from persistence
   */
  importModel(model: MLModel): void {
    this.mlModel = { ...model };
    console.log(`📥 Model imported: ${model.version}`);
  }

  /**
   * Clear all collected data (for testing/reset purposes)
   */
  clearData(): void {
    this.consensusData = [];
    this.manualCorrections = [];
    this.trainingData = [];
    console.log('🗑️ All collected data cleared');
  }
} 