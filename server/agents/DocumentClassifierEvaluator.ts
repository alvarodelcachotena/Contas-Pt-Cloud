import { DocumentClassifier } from './DocumentClassifier';
import { readFileSync } from 'fs';
import { join } from 'path';

interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: Map<string, Map<string, number>>;
  documentTypeStats: Map<string, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

interface TestDocument {
  id: string;
  type: string;
  path: string;
  expectedFeatures: {
    useVision: boolean;
    useConsensus: boolean;
    priorityLevel: 'high' | 'medium' | 'low';
  };
}

export class DocumentClassifierEvaluator {
  private classifier: DocumentClassifier;
  private testDataPath: string;
  private testDocuments: TestDocument[];

  constructor(classifier: DocumentClassifier, testDataPath: string) {
    this.classifier = classifier;
    this.testDataPath = testDataPath;
    this.testDocuments = this.loadTestDocuments();
  }

  private loadTestDocuments(): TestDocument[] {
    try {
      const testConfig = JSON.parse(
        readFileSync(join(this.testDataPath, 'test_config.json'), 'utf8')
      );
      return testConfig.documents;
    } catch (error) {
      console.error('Failed to load test documents:', error);
      return [];
    }
  }

  async evaluateClassifier(): Promise<EvaluationMetrics> {
    const results = new Map<string, Map<string, number>>();
    const typeStats = new Map<string, { total: number; correct: number }>();
    let totalTests = 0;
    let totalCorrect = 0;

    console.log(`🔍 Starting evaluation with ${this.testDocuments.length} documents...`);

    for (const doc of this.testDocuments) {
      try {
        console.log(`📄 Processing document ${doc.id} (${doc.type})...`);

        const fileBuffer = readFileSync(join(this.testDataPath, doc.path));
        const mimeType = this.getMimeType(doc.path);
        const ocrText = await this.getOCRText(fileBuffer, mimeType);

        const classification = await this.classifier.classifyDocument(
          fileBuffer,
          mimeType,
          ocrText
        );

        // Update type statistics
        if (!typeStats.has(doc.type)) {
          typeStats.set(doc.type, { total: 0, correct: 0 });
        }
        const stats = typeStats.get(doc.type)!;
        stats.total++;

        // Check classification accuracy
        const isCorrect = 
          classification.useVision === doc.expectedFeatures.useVision &&
          classification.useConsensus === doc.expectedFeatures.useConsensus &&
          classification.priorityLevel === doc.expectedFeatures.priorityLevel;

        if (isCorrect) {
          stats.correct++;
          totalCorrect++;
        }

        // Update confusion matrix
        if (!results.has(doc.type)) {
          results.set(doc.type, new Map());
        }
        const typeResults = results.get(doc.type)!;
        const resultKey = this.getResultKey(classification);
        typeResults.set(resultKey, (typeResults.get(resultKey) || 0) + 1);

        totalTests++;

      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error);
      }
    }

    // Calculate metrics
    const accuracy = totalCorrect / totalTests;
    const { precision, recall } = this.calculatePrecisionRecall(results);
    const f1Score = 2 * (precision * recall) / (precision + recall);

    // Calculate per-type accuracy
    const documentTypeStats = new Map<string, {
      total: number;
      correct: number;
      accuracy: number;
    }>();

    Array.from(typeStats.entries()).forEach(([type, stats]) => {
      documentTypeStats.set(type, {
        ...stats,
        accuracy: stats.correct / stats.total
      });
    });

    console.log('\n📊 Evaluation Results:');
    console.log(`Total Documents: ${totalTests}`);
    console.log(`Overall Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log(`Precision: ${(precision * 100).toFixed(2)}%`);
    console.log(`Recall: ${(recall * 100).toFixed(2)}%`);
    console.log(`F1 Score: ${(f1Score * 100).toFixed(2)}%`);

    console.log('\n📈 Per-Type Performance:');
    documentTypeStats.forEach((stats, type) => {
      console.log(`${type}:`);
      console.log(`  Total: ${stats.total}`);
      console.log(`  Correct: ${stats.correct}`);
      console.log(`  Accuracy: ${(stats.accuracy * 100).toFixed(2)}%`);
    });

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix: results,
      documentTypeStats
    };
  }

  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      default: return 'application/octet-stream';
    }
  }

  private async getOCRText(buffer: Buffer, mimeType: string): Promise<string> {
    // Implement OCR text extraction here if needed
    return '';
  }

  private getResultKey(classification: any): string {
    return `${classification.useVision}-${classification.useConsensus}-${classification.priorityLevel}`;
  }

  private calculatePrecisionRecall(
    results: Map<string, Map<string, number>>
  ): { precision: number; recall: number } {
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    results.forEach((predictions, actualType) => {
      predictions.forEach((count, predictedType) => {
        if (predictedType === actualType) {
          truePositives += count;
        } else {
          falsePositives += count;
          falseNegatives += count;
        }
      });
    });

    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / (truePositives + falseNegatives);

    return { precision, recall };
  }
} 