export interface RawDocumentMeta {
  documentId: string;
  filename: string;
  mimeType: string;
  tenantId: number;
  uploadedAt: Date;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

export interface FieldProvenance {
  model: string;
  confidence: number;
  method: string;
  timestamp: Date;
  rawValue?: string;
  processingTime?: number;
  modelVersion?: string;
  extractionContext?: {
    pageNumber?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    ocrConfidence?: number;
  };
}

export interface LineItemProvenance {
  rowIndex: number;
  fieldProvenance: {
    [field: string]: FieldProvenance;
  };
  overallConfidence: number;
  extractionMethod: string;
}

export interface ExtractionResult {
  data: {
    vendor: string;
    nif: string;
    nifCountry: string;
    vendorAddress: string;
    vendorPhone: string;
    invoiceNumber: string;
    issueDate: string;
    total: number;
    netAmount: number;
    vatAmount: number;
    vatRate: number;
    category: string;
    description: string;
    lineItems?: LineItem[]; // Add line items array
  };
  confidenceScore: number;
  issues: string[];
  agentResults: {
    extractor: {
      model: string;
      method: string;
      rawResponse: string;
      provenance?: { // Enhanced field-level provenance tracking
        [field: string]: FieldProvenance;
      };
      lineItemProvenance?: LineItemProvenance[];
      consensusMetadata?: {
        totalModels: number;
        agreementLevel: number;
        conflictResolution: string;
        finalConfidence: number;
      };
    };
  };
  processedAt: Date;
}

export interface SimilarDocument {
  id: string;
  ocrText: string;
  extractedData: any;
  similarity: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  correctedData?: any;
}

export interface ClassificationResult {
  category: string;
  confidence: number;
  subcategory?: string;
}

export interface RecalculationResult {
  isValid: boolean;
  calculatedTotal: number;
  calculatedVat: number;
  discrepancy: number;
  correctedAmounts?: {
    total?: number;
    netAmount?: number;
    vatAmount?: number;
  };
}

export interface AuditResult {
  overallConfidence: number;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
}