export interface RawDocumentMeta {
  documentId: string;
  filename: string;
  mimeType: string;
  tenantId: number;
  uploadedAt: Date;
}

export interface ExtractionResult {
  data: {
    invoiceNumber?: string;
    vendor?: string;
    nif?: string; // Full NIF with country prefix (PT123456789, IT12345678901)
    nifCountry?: string; // Country code (PT, IT, ES, etc.)
    vendorAddress?: string; // Complete address of issuer
    vendorPhone?: string; // Phone number of issuer
    total?: number;
    netAmount?: number;
    vatAmount?: number;
    vatRate?: number;
    issueDate?: string;
    dueDate?: string;
    category?: string;
    description?: string;
  };
  confidenceScore: number;
  issues: string[];
  agentResults?: {
    extractor?: any;
    validator?: any;
    classifier?: any;
    recalculator?: any;
    auditor?: any;
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