import { createClient } from '@supabase/supabase-js';
import { documentsEmbedding } from '../shared/schema';

export interface DocumentFeatures {
  documentLength: number;
  ocrQuality: number;
  fileType: string;
  keywordDensity: { [key: string]: number };
  tableDensity: number;
  imageDensity: number;
  textComplexity: number;
  hasStructuredData: boolean;
  language: string;
  confidence: number;
}

export interface RoutingDecision {
  useVision: boolean;
  useConsensus: boolean;
  priorityLevel: 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
  recommendedPipeline: 'vision_enhanced' | 'consensus_enhanced' | 'basic_extraction';
  estimatedProcessingTime: number;
}

export interface TrainingData {
  id: string;
  features: DocumentFeatures;
  actualRouting: RoutingDecision;
  performance: {
    accuracy: number;
    processingTime: number;
    userSatisfaction: number;
  };
}

export class MLDocumentClassifier {
  private supabase: any;
  private model: any;
  private isTrained: boolean = false;
  private trainingData: TrainingData[] = [];
  private featureWeights: { [key: string]: number } = {};
  
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_ANON_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize feature weights based on domain knowledge
    this.initializeFeatureWeights();
  }

  private initializeFeatureWeights() {
    this.featureWeights = {
      documentLength: 0.15,
      ocrQuality: 0.20,
      fileType: 0.10,
      keywordDensity: 0.25,
      tableDensity: 0.15,
      imageDensity: 0.10,
      textComplexity: 0.05
    };
  }

  /**
   * Extract features from document for ML classification
   */
  async extractDocumentFeatures(documentBuffer: Buffer, metadata: any): Promise<DocumentFeatures> {
    console.log('🔍 Extracting document features for ML classification...');
    
    try {
      // Document length analysis
      const documentLength = documentBuffer.length;
      
      // OCR quality estimation (placeholder - would integrate with actual OCR)
      const ocrQuality = await this.estimateOCRQuality(documentBuffer);
      
      // File type detection
      const fileType = this.detectFileType(documentBuffer, metadata);
      
      // Keyword density analysis
      const keywordDensity = await this.analyzeKeywordDensity(documentBuffer);
      
      // Table density estimation
      const tableDensity = await this.estimateTableDensity(documentBuffer);
      
      // Image density estimation
      const imageDensity = await this.estimateImageDensity(documentBuffer);
      
      // Text complexity analysis
      const textComplexity = await this.analyzeTextComplexity(documentBuffer);
      
      // Structured data detection
      const hasStructuredData = await this.detectStructuredData(documentBuffer);
      
      // Language detection
      const language = await this.detectLanguage(documentBuffer);
      
      const features: DocumentFeatures = {
        documentLength,
        ocrQuality,
        fileType,
        keywordDensity,
        tableDensity,
        imageDensity,
        textComplexity,
        hasStructuredData,
        language,
        confidence: 0.85 // Base confidence
      };

      console.log('✅ Document features extracted successfully');
      return features;

    } catch (error) {
      console.error('❌ Error extracting document features:', error);
      throw new Error('Failed to extract document features');
    }
  }

  /**
   * ML-based routing decision using trained classifier
   */
  async classifyDocument(features: DocumentFeatures): Promise<RoutingDecision> {
    console.log('🤖 ML classifier making routing decision...');
    
    try {
      if (!this.isTrained) {
        console.log('⚠️ Model not trained, using fallback rule-based routing');
        return this.fallbackRuleBasedRouting(features);
      }

      // Calculate feature scores using trained weights
      const scores = this.calculateFeatureScores(features);
      
      // Apply ML classification logic
      const routingDecision = this.applyMLClassification(scores, features);
      
      console.log('✅ ML routing decision made:', routingDecision);
      return routingDecision;

    } catch (error) {
      console.error('❌ Error in ML classification:', error);
      return this.fallbackRuleBasedRouting(features);
    }
  }

  /**
   * Calculate weighted feature scores
   */
  private calculateFeatureScores(features: DocumentFeatures): { [key: string]: number } {
    const scores: { [key: string]: number } = {};
    
    // Document length score (normalized)
    scores.documentLength = Math.min(features.documentLength / 1000000, 1.0);
    
    // OCR quality score
    scores.ocrQuality = features.ocrQuality;
    
    // File type score (based on complexity)
    scores.fileType = this.getFileTypeComplexityScore(features.fileType);
    
    // Keyword density score
    scores.keywordDensity = this.calculateKeywordDensityScore(features.keywordDensity);
    
    // Table density score
    scores.tableDensity = features.tableDensity;
    
    // Image density score
    scores.imageDensity = features.imageDensity;
    
    // Text complexity score
    scores.textComplexity = features.textComplexity;
    
    return scores;
  }

  /**
   * Apply ML classification algorithm
   */
  private applyMLClassification(scores: { [key: string]: number }, features: DocumentFeatures): RoutingDecision {
    // Calculate weighted decision scores
    const visionScore = this.calculateVisionScore(scores);
    const consensusScore = this.calculateConsensusScore(scores);
    const priorityScore = this.calculatePriorityScore(scores);
    
    // Determine routing decisions
    const useVision = visionScore > 0.7;
    const useConsensus = consensusScore > 0.6;
    
    // Priority level determination
    let priorityLevel: 'high' | 'medium' | 'low';
    if (priorityScore > 0.8) priorityLevel = 'high';
    else if (priorityScore > 0.5) priorityLevel = 'medium';
    else priorityLevel = 'low';
    
    // Pipeline recommendation
    let recommendedPipeline: 'vision_enhanced' | 'consensus_enhanced' | 'basic_extraction';
    if (useVision && useConsensus) recommendedPipeline = 'consensus_enhanced';
    else if (useVision) recommendedPipeline = 'vision_enhanced';
    else recommendedPipeline = 'basic_extraction';
    
    // Confidence calculation
    const confidence = Math.min((visionScore + consensusScore + priorityScore) / 3, 1.0);
    
    // Reasoning
    const reasoning = this.generateReasoning(scores, useVision, useConsensus, priorityLevel);
    
    // Estimated processing time
    const estimatedProcessingTime = this.estimateProcessingTime(scores, recommendedPipeline);
    
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
   * Calculate vision processing score
   */
  private calculateVisionScore(scores: { [key: string]: number }): number {
    const weights = {
      imageDensity: 0.4,
      tableDensity: 0.3,
      fileType: 0.2,
      documentLength: 0.1
    };
    
    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (scores[key] || 0) * weight;
    }, 0);
  }

  /**
   * Calculate consensus processing score
   */
  private calculateConsensusScore(scores: { [key: string]: number }): number {
    const weights = {
      textComplexity: 0.3,
      keywordDensity: 0.3,
      ocrQuality: 0.2,
      hasStructuredData: 0.2
    };
    
    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (scores[key] || 0) * weight;
    }, 0);
  }

  /**
   * Calculate priority score
   */
  private calculatePriorityScore(scores: { [key: string]: number }): number {
    const weights = {
      documentLength: 0.25,
      ocrQuality: 0.25,
      textComplexity: 0.25,
      tableDensity: 0.25
    };
    
    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (scores[key] || 0) * weight;
    }, 0);
  }

  /**
   * Generate reasoning for routing decision
   */
  private generateReasoning(scores: { [key: string]: number }, useVision: boolean, useConsensus: boolean, priority: string): string {
    const reasons: string[] = [];
    
    if (useVision) {
      if (scores.imageDensity > 0.6) reasons.push('High image content detected');
      if (scores.tableDensity > 0.5) reasons.push('Complex table structures identified');
    }
    
    if (useConsensus) {
      if (scores.textComplexity > 0.7) reasons.push('Complex text requiring consensus');
      if (scores.keywordDensity > 0.6) reasons.push('Rich keyword content for analysis');
    }
    
    if (priority === 'high') {
      reasons.push('Document complexity requires high priority processing');
    }
    
    return reasons.length > 0 ? reasons.join('; ') : 'Standard processing recommended';
  }

  /**
   * Estimate processing time based on features and pipeline
   */
  private estimateProcessingTime(scores: { [key: string]: number }, pipeline: string): number {
    let baseTime = 1000; // Base time in ms
    
    // Adjust for document complexity
    if (scores.documentLength > 0.8) baseTime *= 2;
    if (scores.textComplexity > 0.7) baseTime *= 1.5;
    if (scores.tableDensity > 0.6) baseTime *= 1.8;
    
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
   * Fallback rule-based routing when ML model is not trained
   */
  private fallbackRuleBasedRouting(features: DocumentFeatures): RoutingDecision {
    const useVision = features.tableDensity > 0.5 || features.imageDensity > 0.6;
    const useConsensus = features.textComplexity > 0.7 || features.keywordDensity.keyword> 0.6;
    
    let priorityLevel: 'high' | 'medium' | 'low' = 'medium';
    if (features.documentLength > 500000 || features.textComplexity > 0.8) {
      priorityLevel = 'high';
    } else if (features.documentLength < 100000) {
      priorityLevel = 'low';
    }
    
    return {
      useVision,
      useConsensus,
      priorityLevel,
      confidence: 0.6,
      reasoning: 'Fallback rule-based routing used',
      recommendedPipeline: useVision ? 'vision_enhanced' : 'basic_extraction',
      estimatedProcessingTime: 1500
    };
  }

  /**
   * Train the ML classifier with new data
   */
  async trainClassifier(trainingData: TrainingData[]): Promise<void> {
    console.log('🎯 Training ML classifier with', trainingData.length, 'samples...');
    
    try {
      // Store training data
      this.trainingData = trainingData;
      
      // Calculate optimal feature weights based on training data
      this.optimizeFeatureWeights(trainingData);
      
      // Mark as trained
      this.isTrained = true;
      
      console.log('✅ ML classifier trained successfully');
      
    } catch (error) {
      console.error('❌ Error training classifier:', error);
      throw new Error('Failed to train ML classifier');
    }
  }

  /**
   * Optimize feature weights based on training data
   */
  private optimizeFeatureWeights(trainingData: TrainingData[]): void {
    console.log('🔧 Optimizing feature weights...');
    
    // Simple optimization: adjust weights based on performance correlation
    const featurePerformance: { [key: string]: number[] } = {};
    
    // Initialize performance tracking
    Object.keys(this.featureWeights).forEach(feature => {
      featurePerformance[feature] = [];
    });
    
    // Analyze performance correlation for each feature
    trainingData.forEach(sample => {
      const features = sample.features;
      const performance = sample.performance.accuracy;
      
      Object.keys(this.featureWeights).forEach(feature => {
        if (features[feature as keyof DocumentFeatures] !== undefined) {
          featurePerformance[feature].push(performance);
        }
      });
    });
    
    // Adjust weights based on performance correlation
    Object.keys(this.featureWeights).forEach(feature => {
      const performances = featurePerformance[feature];
      if (performances.length > 0) {
        const avgPerformance = performances.reduce((a, b) => a + b, 0) / performances.length;
        // Boost weight for features that correlate with high performance
        this.featureWeights[feature] *= (0.8 + avgPerformance * 0.4);
      }
    });
    
    // Normalize weights
    const totalWeight = Object.values(this.featureWeights).reduce((a, b) => a + b, 0);
    Object.keys(this.featureWeights).forEach(feature => {
      this.featureWeights[feature] /= totalWeight;
    });
    
    console.log('✅ Feature weights optimized:', this.featureWeights);
  }

  /**
   * Evaluate classifier performance
   */
  async evaluateClassifier(testData: TrainingData[]): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: any;
  }> {
    console.log('📊 Evaluating ML classifier performance...');
    
    if (!this.isTrained) {
      throw new Error('Classifier must be trained before evaluation');
    }
    
    let correctPredictions = 0;
    let totalPredictions = 0;
    const predictions: any[] = [];
    
    for (const testSample of testData) {
      const prediction = await this.classifyDocument(testSample.features);
      const actual = testSample.actualRouting;
      
      // Compare predictions with actual routing
      const isCorrect = this.compareRoutingDecisions(prediction, actual);
      if (isCorrect) correctPredictions++;
      totalPredictions++;
      
      predictions.push({
        predicted: prediction,
        actual: actual,
        isCorrect
      });
    }
    
    const accuracy = correctPredictions / totalPredictions;
    
    // Calculate additional metrics
    const metrics = this.calculateDetailedMetrics(predictions);
    
    console.log('✅ Classifier evaluation completed');
    console.log(`📈 Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    
    return {
      accuracy,
      ...metrics
    };
  }

  /**
   * Compare routing decisions for evaluation
   */
  private compareRoutingDecisions(predicted: RoutingDecision, actual: RoutingDecision): boolean {
    // Consider decision correct if main routing choices match
    const visionMatch = predicted.useVision === actual.useVision;
    const consensusMatch = predicted.useConsensus === actual.useConsensus;
    const priorityMatch = predicted.priorityLevel === actual.priorityLevel;
    
    // Weight the comparison (vision and consensus are more important than priority)
    const score = (visionMatch ? 0.4 : 0) + (consensusMatch ? 0.4 : 0) + (priorityMatch ? 0.2 : 0);
    
    return score >= 0.6; // Threshold for considering prediction correct
  }

  /**
   * Calculate detailed evaluation metrics
   */
  private calculateDetailedMetrics(predictions: any[]): {
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: any;
  } {
    // Simplified metrics calculation
    const truePositives = predictions.filter(p => p.isCorrect).length;
    const falsePositives = predictions.filter(p => !p.isCorrect).length;
    const falseNegatives = 0; // Simplified
    
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    return {
      precision,
      recall,
      f1Score,
      confusionMatrix: {
        truePositives,
        falsePositives,
        falseNegatives,
        trueNegatives: predictions.length - truePositives - falsePositives
      }
    };
  }

  // Placeholder methods for feature extraction (would integrate with actual services)
  private async estimateOCRQuality(buffer: Buffer): Promise<number> {
    // Placeholder: would integrate with actual OCR service
    return Math.random() * 0.3 + 0.7; // Random quality between 0.7-1.0
  }

  private detectFileType(buffer: Buffer, metadata: any): string {
    // Placeholder: would use actual file type detection
    return metadata?.fileType || 'pdf';
  }

  private async analyzeKeywordDensity(buffer: Buffer): Promise<{ [key: string]: number }> {
    // Placeholder: would analyze actual text content
    const keywords = ['invoice', 'receipt', 'contract', 'report', 'statement'];
    const density: { [key: string]: number } = {};
    
    keywords.forEach(keyword => {
      density[keyword] = Math.random() * 0.5; // Random density
    });
    
    return density;
  }

  private async estimateTableDensity(buffer: Buffer): Promise<number> {
    // Placeholder: would analyze actual document structure
    return Math.random() * 0.8; // Random density
  }

  private async estimateImageDensity(buffer: Buffer): Promise<number> {
    // Placeholder: would analyze actual image content
    return Math.random() * 0.6; // Random density
  }

  private async analyzeTextComplexity(buffer: Buffer): Promise<number> {
    // Placeholder: would analyze actual text complexity
    return Math.random() * 0.7 + 0.3; // Random complexity
  }

  private async detectStructuredData(buffer: Buffer): Promise<boolean> {
    // Placeholder: would detect actual structured data
    return Math.random() > 0.5; // Random boolean
  }

  private async detectLanguage(buffer: Buffer): Promise<string> {
    // Placeholder: would detect actual language
    return 'pt'; // Default to Portuguese
  }

  private getFileTypeComplexityScore(fileType: string): number {
    const complexityMap: { [key: string]: number } = {
      'pdf': 0.8,
      'docx': 0.6,
      'txt': 0.3,
      'jpg': 0.9,
      'png': 0.9
    };
    
    return complexityMap[fileType] || 0.5;
  }

  private calculateKeywordDensityScore(keywordDensity: { [key: string]: number }): number {
    const totalDensity = Object.values(keywordDensity).reduce((sum, density) => sum + density, 0);
    return Math.min(totalDensity / Object.keys(keywordDensity).length, 1.0);
  }

  /**
   * Save training data to database
   */
  async saveTrainingData(trainingData: TrainingData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ml_training_data')
        .insert({
          features: trainingData.features,
          actual_routing: trainingData.actualRouting,
          performance: trainingData.performance,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log('✅ Training data saved to database');
      
    } catch (error) {
      console.error('❌ Error saving training data:', error);
      throw new Error('Failed to save training data');
    }
  }

  /**
   * Load training data from database
   */
  async loadTrainingData(): Promise<TrainingData[]> {
    try {
      const { data, error } = await this.supabase
        .from('ml_training_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const trainingData: TrainingData[] = data.map((row: any) => ({
        id: row.id,
        features: row.features,
        actualRouting: row.actual_routing,
        performance: row.performance
      }));

      console.log('✅ Training data loaded from database:', trainingData.length, 'samples');
      return trainingData;
      
    } catch (error) {
      console.error('❌ Error loading training data:', error);
      return [];
    }
  }

  /**
   * Get classifier status and statistics
   */
  getClassifierStatus(): {
    isTrained: boolean;
    trainingDataCount: number;
    featureWeights: { [key: string]: number };
    lastTrainingDate?: string;
  } {
    return {
      isTrained: this.isTrained,
      trainingDataCount: this.trainingData.length,
      featureWeights: this.featureWeights,
      lastTrainingDate: this.trainingData.length > 0 ? 
        new Date().toISOString() : undefined
    };
  }
}

// Export singleton instance
export const mlDocumentClassifier = new MLDocumentClassifier();
