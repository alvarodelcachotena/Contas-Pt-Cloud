import { ExtractionResult } from "../../shared/types";

interface FieldStats {
  correct: number;
  total: number;
}

interface CorrectionStats {
  totalDocuments: number;
  totalCorrections: number;
  accuracyByField: { [field: string]: FieldStats };
  commonErrors: { [error: string]: number };
  averageTimeToCorrect: number;
}

interface ManualCorrection {
  documentId: string;
  originalExtraction: ExtractionResult;
  manualCorrections: { [field: string]: any };
  correctionMetadata: {
    correctedAt: Date;
    correctedBy: string;
    timeToCorrect: number;
    confidenceAssessment: number;
  };
}

export class ManualCorrectionCollector {
  private corrections: ManualCorrection[] = [];
  private correctionStats: CorrectionStats = {
    totalDocuments: 0,
    totalCorrections: 0,
    accuracyByField: {},
    commonErrors: {},
    averageTimeToCorrect: 0,
  };

  async recordCorrection(
    documentId: string,
    originalExtraction: ExtractionResult,
    corrections: { [field: string]: any },
    metadata: {
      correctedBy: string;
      timeToCorrect: number;
      confidenceAssessment: number;
    }
  ): Promise<void> {
    const manualCorrections: { [field: string]: any } = {};

    // Process each corrected field
    for (const [field, correctedValue] of Object.entries(corrections)) {
      const originalValue = this.getFieldValue(originalExtraction.data, field);
      manualCorrections[field] = {
        originalValue,
        correctedValue,
        wasCorrect: this.valuesMatch(originalValue, correctedValue),
      };
    }

    // Record the correction
    const correction: ManualCorrection = {
      documentId,
      originalExtraction,
      manualCorrections,
      correctionMetadata: {
        correctedAt: new Date(),
        correctedBy: metadata.correctedBy,
        timeToCorrect: metadata.timeToCorrect,
        confidenceAssessment: metadata.confidenceAssessment,
      },
    };

    this.corrections.push(correction);
    await this.updateStatistics(correction);
  }

  private getFieldValue(data: any, field: string): any {
    if (!data || typeof data !== 'object') return undefined;
    return data[field];
  }

  private valuesMatch(value1: any, value2: any): boolean {
    if (value1 === value2) return true;
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return Math.abs(value1 - value2) < 0.01;
    }
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.toLowerCase().trim() === value2.toLowerCase().trim();
    }
    return false;
  }

  private async updateStatistics(correction: ManualCorrection): Promise<void> {
    // Update total counts
    this.correctionStats.totalDocuments++;
    this.correctionStats.totalCorrections += Object.keys(correction.manualCorrections).length;

    // Update time to correct
    const totalTime = this.correctionStats.averageTimeToCorrect * (this.correctionStats.totalDocuments - 1);
    this.correctionStats.averageTimeToCorrect = (totalTime + correction.correctionMetadata.timeToCorrect) / this.correctionStats.totalDocuments;

    // Process each field correction
    for (const [field, details] of Object.entries(correction.manualCorrections)) {
      // Update field accuracy
      const fieldStats = this.correctionStats.accuracyByField[field] || { correct: 0, total: 0 };
      fieldStats.total++;
      if (details.wasCorrect) {
        fieldStats.correct++;
      }
      this.correctionStats.accuracyByField[field] = fieldStats;

      // Update common errors
      if (!details.wasCorrect) {
        const errorKey = `${field}:${details.originalValue}->${details.correctedValue}`;
        this.correctionStats.commonErrors[errorKey] = (this.correctionStats.commonErrors[errorKey] || 0) + 1;
      }
    }
  }

  getStatistics(): CorrectionStats {
    return { ...this.correctionStats };
  }

  getTrainingData(): { features: any[]; targets: number[] } {
    const features: any[] = [];
    const targets: number[] = [];

    this.corrections.forEach(correction => {
      const extractionFeatures = {
        confidenceScore: correction.originalExtraction.confidenceScore,
        fieldsPresent: Object.keys(correction.originalExtraction.data).length,
        hasIssues: correction.originalExtraction.issues.length > 0,
        modelUsed: correction.originalExtraction.agentResults.extractor.model,
        userConfidence: correction.correctionMetadata.confidenceAssessment,
      };

      features.push(extractionFeatures);
      targets.push(this.calculateAccuracy(correction));
    });

    return { features, targets };
  }

  private calculateAccuracy(correction: ManualCorrection): number {
    const totalFields = Object.keys(correction.manualCorrections).length;
    if (totalFields === 0) return 1;

    const correctFields = Object.values(correction.manualCorrections)
      .filter(details => details.wasCorrect)
      .length;

    return correctFields / totalFields;
  }
} 