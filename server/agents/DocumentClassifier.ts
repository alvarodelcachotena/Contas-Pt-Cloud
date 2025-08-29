import { GoogleGenAI } from "@google/genai";

interface DocumentFeatures {
  documentLength: number;
  ocrQuality: number;
  fileType: string;
  keywords: string[];
  hasStructuredTables: boolean;
  imageQuality?: number;
  languageConfidence?: number;
  documentComplexity: number;
  layoutStructure: string;
  financialDataDensity: number;
}

interface ClassificationResult {
  useVision: boolean;
  useConsensus: boolean;
  priorityLevel: 'high' | 'medium' | 'low';
  confidence: number;
  features: DocumentFeatures;
  reasoning: string[];
}

export class DocumentClassifier {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  private async extractDocumentFeatures(
    fileBuffer: Buffer,
    mimeType: string,
    ocrText: string
  ): Promise<DocumentFeatures> {
    const prompt = `
Analyze this document and extract key features for classification.

DOCUMENT TYPES TO CONSIDER:
1. Invoices & Receipts
2. Bank Statements
3. Utility Bills
4. Tax Forms
5. Contracts
6. Purchase Orders
7. Delivery Notes
8. Credit Notes
9. Payslips
10. Expense Reports
11. Financial Statements
12. Insurance Documents
13. Medical Bills
14. Travel Documents
15. Legal Notices

REQUIRED FEATURES:
1. Document length (character count)
2. OCR quality assessment (0-1)
3. File type analysis
4. Key business terms present
5. Table structure detection
6. Image quality if applicable
7. Language confidence
8. Document complexity metrics
9. Layout structure analysis
10. Financial data presence

Focus on:
- Text clarity and readability
- Layout structure
- Image/scan quality
- Language patterns
- Table detection
- Business context
- Document structure complexity
- Financial data patterns
- Key identifier presence
- Temporal information

Return ONLY valid JSON:
{
  "documentLength": 0,
  "ocrQuality": 0.95,
  "fileType": "invoice/receipt/statement",
  "keywords": ["list", "of", "key", "terms"],
  "hasStructuredTables": true,
  "imageQuality": 0.9,
  "languageConfidence": 0.95,
  "documentComplexity": 0.8,
  "layoutStructure": "structured/semi-structured/unstructured",
  "financialDataDensity": 0.7,
  "analysisNotes": ["list", "of", "observations"]
}`;

    try {
      const base64Data = fileBuffer.toString("base64");
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
        ],
      });

      const textResponse = response.text || "";
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("No valid JSON found in feature extraction response");
      }

      const metrics = JSON.parse(jsonMatch[0]);

      return {
        documentLength: metrics.documentLength || ocrText.length,
        ocrQuality: metrics.ocrQuality || 0.5,
        fileType: metrics.fileType || "unknown",
        keywords: metrics.keywords || [],
        hasStructuredTables: metrics.hasStructuredTables || false,
        imageQuality: metrics.imageQuality,
        languageConfidence: metrics.languageConfidence,
        documentComplexity: metrics.documentComplexity || 0.5,
        layoutStructure: metrics.layoutStructure || "unstructured",
        financialDataDensity: metrics.financialDataDensity || 0,
      };
    } catch (error) {
      console.error("Feature extraction failed:", error);
      return {
        documentLength: ocrText.length,
        ocrQuality: 0.5,
        fileType: "unknown",
        keywords: [],
        hasStructuredTables: false,
        documentComplexity: 0.5,
        layoutStructure: "unstructured",
        financialDataDensity: 0,
      };
    }
  }

  async classifyDocument(
    fileBuffer: Buffer,
    mimeType: string,
    ocrText: string
  ): Promise<ClassificationResult> {
    // First extract document features
    const features = await this.extractDocumentFeatures(fileBuffer, mimeType, ocrText);

    // Build classification prompt with extracted features
    const classificationPrompt = `
Analyze these document features and determine optimal processing strategy:

DOCUMENT FEATURES:
- Length: ${features.documentLength} characters
- OCR Quality: ${features.ocrQuality}
- File Type: ${features.fileType}
- Keywords: ${features.keywords.join(", ")}
- Has Tables: ${features.hasStructuredTables}
- Image Quality: ${features.imageQuality || "N/A"}
- Language Confidence: ${features.languageConfidence || "N/A"}
- Document Complexity: ${features.documentComplexity}
- Layout Structure: ${features.layoutStructure}
- Financial Data Density: ${features.financialDataDensity}

DETERMINE:
1. Whether to use vision-based processing
2. Whether to use multi-model consensus
3. Processing priority level
4. Confidence in classification
5. Detailed reasoning for decisions

Consider:
- High OCR quality (>0.8) might not need vision
- Complex documents benefit from consensus
- Financial documents usually need high priority
- Poor quality documents need vision + consensus
- Document length affects processing priority

Return ONLY valid JSON:
{
  "useVision": true/false,
  "useConsensus": true/false,
  "priorityLevel": "high/medium/low",
  "confidence": 0.95,
  "reasoning": ["list", "of", "detailed", "reasons"]
}`;

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ text: classificationPrompt }],
      });

      const textResponse = response.text || "";
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("No valid JSON found in classification response");
      }

      const classification = JSON.parse(jsonMatch[0]);

      // Apply classification rules
      const result: ClassificationResult = {
        useVision: this.shouldUseVision(features, classification),
        useConsensus: this.shouldUseConsensus(features, classification),
        priorityLevel: this.determinePriority(features, classification),
        confidence: classification.confidence || 0.5,
        features: features,
        reasoning: classification.reasoning || [],
      };

      console.log("📋 Document Classification:", {
        features: features,
        decisions: {
          useVision: result.useVision,
          useConsensus: result.useConsensus,
          priorityLevel: result.priorityLevel,
        },
        confidence: result.confidence,
        reasoning: result.reasoning,
      });

      return result;
    } catch (error) {
      console.error("Classification failed:", error);
      
      // Fallback to conservative defaults
      return {
        useVision: true, // Default to vision for safety
        useConsensus: true, // Default to consensus for safety
        priorityLevel: 'medium',
        confidence: 0.5,
        features: features,
        reasoning: ["Fallback classification due to error"],
      };
    }
  }

  private shouldUseVision(
    features: DocumentFeatures,
    classification: any
  ): boolean {
    // Enhanced decision logic for vision processing
    const requiresVision = [
      features.hasStructuredTables,
      (features.imageQuality || 0) > 0.7,
      features.ocrQuality < 0.8,
      features.layoutStructure === "structured",
      features.documentComplexity > 0.7,
      features.financialDataDensity > 0.6,
      features.keywords.some(k => k.includes("table") || k.includes("image") || k.includes("logo")),
    ].filter(Boolean).length >= 3;

    return classification.useVision ?? requiresVision;
  }

  private shouldUseConsensus(
    features: DocumentFeatures,
    classification: any
  ): boolean {
    // Enhanced decision logic for consensus processing
    const requiresConsensus = [
      features.documentLength > 1000,
      features.ocrQuality < 0.9,
      features.hasStructuredTables,
      features.documentComplexity > 0.8,
      features.financialDataDensity > 0.7,
      (features.languageConfidence || 1) < 0.9,
      features.keywords.length > 5,
    ].filter(Boolean).length >= 4;

    return classification.useConsensus ?? requiresConsensus;
  }

  private determinePriority(
    features: DocumentFeatures,
    classification: any
  ): 'high' | 'medium' | 'low' {
    if (classification.priorityLevel) {
      return classification.priorityLevel as 'high' | 'medium' | 'low';
    }

    // Enhanced priority determination logic
    const priorityFactors = {
      high: [
        features.ocrQuality < 0.7,
        features.documentLength > 5000,
        features.hasStructuredTables,
        features.documentComplexity > 0.8,
        features.financialDataDensity > 0.8,
        features.keywords.includes('urgent'),
        features.keywords.includes('priority'),
        features.keywords.some(k => k.includes('tax') || k.includes('legal') || k.includes('deadline')),
      ],
      medium: [
        features.ocrQuality >= 0.7 && features.ocrQuality < 0.9,
        features.documentLength > 1000 && features.documentLength <= 5000,
        features.documentComplexity >= 0.5 && features.documentComplexity <= 0.8,
        features.financialDataDensity >= 0.4 && features.financialDataDensity <= 0.8,
        features.layoutStructure === "semi-structured",
      ],
      low: [
        features.ocrQuality >= 0.9,
        features.documentLength <= 1000,
        features.documentComplexity < 0.5,
        features.financialDataDensity < 0.4,
        !features.hasStructuredTables,
        features.layoutStructure === "unstructured",
      ],
    };

    const scores = {
      high: priorityFactors.high.filter(Boolean).length,
      medium: priorityFactors.medium.filter(Boolean).length,
      low: priorityFactors.low.filter(Boolean).length,
    };

    if (scores.high > scores.medium && scores.high > scores.low) {
      return 'high';
    } else if (scores.medium > scores.low) {
      return 'medium';
    } else {
      return 'low';
    }
  }
} 