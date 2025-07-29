import { ExtractionResult } from '../../shared/types';
import axios from 'axios';

export interface ExternalProcessorConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
}

export interface ProcessingOptions {
  processor?: 'visionparser' | 'mindee' | 'klippa' | 'azure' | 'google' | 'textract' | 'veryfi';
  fallbackProcessors?: string[];
  extractFields?: string[];
  language?: string;
  confidence_threshold?: number;
}

export class ExternalDocumentProcessors {
  private configs: Map<string, ExternalProcessorConfig> = new Map();
  
  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // VisionParser configuration
    if (process.env.VISIONPARSER_API_KEY) {
      this.configs.set('visionparser', {
        apiKey: process.env.VISIONPARSER_API_KEY,
        baseUrl: 'https://api.visionparser.com',
        timeout: 30000,
        maxRetries: 3
      });
    }

    // Mindee configuration
    if (process.env.MINDEE_API_KEY) {
      this.configs.set('mindee', {
        apiKey: process.env.MINDEE_API_KEY,
        baseUrl: 'https://api.mindee.net',
        timeout: 30000,
        maxRetries: 3
      });
    }

    // Klippa configuration
    if (process.env.KLIPPA_API_KEY) {
      this.configs.set('klippa', {
        apiKey: process.env.KLIPPA_API_KEY,
        baseUrl: 'https://custom-ocr.klippa.com',
        timeout: 30000,
        maxRetries: 3
      });
    }

    // Azure Form Recognizer configuration
    if (process.env.AZURE_FORM_RECOGNIZER_KEY && process.env.AZURE_FORM_RECOGNIZER_ENDPOINT) {
      this.configs.set('azure', {
        apiKey: process.env.AZURE_FORM_RECOGNIZER_KEY,
        baseUrl: process.env.AZURE_FORM_RECOGNIZER_ENDPOINT,
        timeout: 60000,
        maxRetries: 3
      });
    }

    // Google Document AI configuration
    if (process.env.GOOGLE_DOCUMENT_AI_KEY && process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID) {
      this.configs.set('google', {
        apiKey: process.env.GOOGLE_DOCUMENT_AI_KEY,
        baseUrl: `https://documentai.googleapis.com/v1/projects/${process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID}`,
        timeout: 60000,
        maxRetries: 3
      });
    }

    // Veryfi configuration
    if (process.env.VERYFI_CLIENT_ID && process.env.VERYFI_CLIENT_SECRET) {
      this.configs.set('veryfi', {
        apiKey: process.env.VERYFI_CLIENT_SECRET,
        baseUrl: 'https://api.veryfi.com',
        timeout: 30000,
        maxRetries: 3
      });
    }

    console.log(`🔧 Initialized ${this.configs.size} external document processors`);
  }

  async processDocument(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: ProcessingOptions = {}
  ): Promise<ExtractionResult> {
    const processor = options.processor || this.selectBestProcessor(mimeType, filename);
    const fallbacks = options.fallbackProcessors || this.getDefaultFallbacks(processor);

    console.log(`📄 Processing ${filename} with ${processor}, fallbacks: ${fallbacks.join(', ')}`);

    // Try primary processor
    try {
      const result = await this.processWithService(processor, buffer, mimeType, filename, options);
      if (this.isValidResult(result, options.confidence_threshold)) {
        return result;
      }
    } catch (error) {
      console.warn(`Primary processor ${processor} failed:`, error instanceof Error ? error.message : String(error));
    }

    // Try fallback processors
    for (const fallbackProcessor of fallbacks) {
      if (!this.configs.has(fallbackProcessor)) continue;
      
      try {
        console.log(`🔄 Trying fallback processor: ${fallbackProcessor}`);
        const result = await this.processWithService(fallbackProcessor, buffer, mimeType, filename, options);
        if (this.isValidResult(result, options.confidence_threshold)) {
          return result;
        }
      } catch (error) {
        console.warn(`Fallback processor ${fallbackProcessor} failed:`, error instanceof Error ? error.message : String(error));
      }
    }

    throw new Error('All external processors failed to process the document');
  }

  private async processWithService(
    processor: string,
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: ProcessingOptions
  ): Promise<ExtractionResult> {
    switch (processor) {
      case 'visionparser':
        return await this.processWithVisionParser(buffer, mimeType, filename, options);
      case 'mindee':
        return await this.processWithMindee(buffer, mimeType, filename, options);
      case 'klippa':
        return await this.processWithKlippa(buffer, mimeType, filename, options);
      case 'azure':
        return await this.processWithAzure(buffer, mimeType, filename, options);
      case 'google':
        return await this.processWithGoogleDocumentAI(buffer, mimeType, filename, options);
      case 'veryfi':
        return await this.processWithVeryfi(buffer, mimeType, filename, options);
      default:
        throw new Error(`Unsupported processor: ${processor}`);
    }
  }

  private async processWithVisionParser(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: ProcessingOptions
  ): Promise<ExtractionResult> {
    const config = this.configs.get('visionparser')!;
    
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);

    const response = await axios.post(`${config.baseUrl}/parse/image/file`, formData, {
      headers: {
        'api_key': config.apiKey,
        'Content-Type': 'multipart/form-data'
      },
      timeout: config.timeout
    });

    const data = response.data;
    
    return {
      data: {
        vendor: data.merchant_name || data.vendor || '',
        total: this.parseAmount(data.total || data.amount),
        netAmount: this.parseAmount(data.subtotal),
        vatAmount: this.parseAmount(data.tax_amount),
        vatRate: this.parseVatRate(data.tax_rate),
        invoiceNumber: data.invoice_number || data.receipt_number || '',
        issueDate: this.parseDate(data.date),
        description: data.description || '',
        category: this.categorizeExpense(data.category || data.merchant_name)
      },
      confidenceScore: data.confidence || 0.85,
      issues: data.warnings || [],
      agentResults: {
        extractor: {
          model: 'visionparser-api',
          method: 'external-api',
          rawResponse: data
        }
      },
      processedAt: new Date()
    };
  }

  private async processWithMindee(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: ProcessingOptions
  ): Promise<ExtractionResult> {
    const config = this.configs.get('mindee')!;
    
    const formData = new FormData();
    formData.append('document', new Blob([buffer], { type: mimeType }), filename);

    const response = await axios.post(`${config.baseUrl}/v1/products/mindee/invoices/v4/predict`, formData, {
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: config.timeout
    });

    const prediction = response.data.document.inference.prediction;
    
    return {
      data: {
        vendor: prediction.supplier_name?.value || '',
        nif: prediction.supplier_company_registrations?.[0]?.value || '',
        total: prediction.total_amount?.value || 0,
        netAmount: prediction.total_net?.value || 0,
        vatAmount: prediction.total_tax?.value || 0,
        vatRate: this.parseVatRate(prediction.taxes?.[0]?.rate),
        invoiceNumber: prediction.invoice_number?.value || '',
        issueDate: this.parseDate(prediction.date?.value),
        dueDate: this.parseDate(prediction.due_date?.value),
        description: prediction.line_items?.map((item: any) => item.description).join(', ') || ''
      },
      confidenceScore: prediction.supplier_name?.confidence || 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'mindee-invoice-v4',
          method: 'external-api',
          rawResponse: prediction
        }
      },
      processedAt: new Date()
    };
  }

  private async processWithKlippa(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: ProcessingOptions
  ): Promise<ExtractionResult> {
    const config = this.configs.get('klippa')!;
    
    const formData = new FormData();
    formData.append('document', new Blob([buffer], { type: mimeType }), filename);

    const response = await axios.post(`${config.baseUrl}/api/v2/parseDocument`, formData, {
      headers: {
        'X-Auth-Key': config.apiKey,
        'Content-Type': 'multipart/form-data'
      },
      timeout: config.timeout
    });

    const data = response.data.data;
    
    return {
      data: {
        vendor: data.supplier_name || '',
        nif: data.supplier_vat_number || '',
        total: this.parseAmount(data.amount),
        netAmount: this.parseAmount(data.amount_ex_vat),
        vatAmount: this.parseAmount(data.vat_amount),
        vatRate: this.parseVatRate(data.vat_percentage),
        invoiceNumber: data.invoice_number || '',
        issueDate: this.parseDate(data.date),
        dueDate: this.parseDate(data.due_date),
        description: data.description || ''
      },
      confidenceScore: data.confidence || 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'klippa-ocr',
          method: 'external-api',
          rawResponse: data
        }
      },
      processedAt: new Date()
    };
  }

  private async processWithAzure(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: ProcessingOptions
  ): Promise<ExtractionResult> {
    const config = this.configs.get('azure')!;
    
    // Azure Form Recognizer prebuilt invoice model
    const response = await axios.post(
      `${config.baseUrl}/formrecognizer/documentModels/prebuilt-invoice:analyze?api-version=2023-07-31`,
      buffer,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': config.apiKey,
          'Content-Type': mimeType
        },
        timeout: config.timeout
      }
    );

    // Azure returns a 202 with operation location for async processing
    const operationLocation = response.headers['operation-location'];
    
    // Poll for results
    let result;
    for (let i = 0; i < 30; i++) { // Max 30 seconds polling
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const resultResponse = await axios.get(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': config.apiKey
        }
      });

      if (resultResponse.data.status === 'succeeded') {
        result = resultResponse.data.analyzeResult;
        break;
      } else if (resultResponse.data.status === 'failed') {
        throw new Error('Azure processing failed');
      }
    }

    if (!result) {
      throw new Error('Azure processing timeout');
    }

    const doc = result.documents[0];
    const fields = doc.fields;
    
    return {
      data: {
        vendor: fields.VendorName?.valueString || '',
        nif: fields.VendorTaxId?.valueString || '',
        total: fields.InvoiceTotal?.valueNumber || 0,
        netAmount: fields.SubTotal?.valueNumber || 0,
        vatAmount: fields.TotalTax?.valueNumber || 0,
        invoiceNumber: fields.InvoiceId?.valueString || '',
        issueDate: this.parseDate(fields.InvoiceDate?.valueDate),
        dueDate: this.parseDate(fields.DueDate?.valueDate),
        description: fields.Items?.valueArray?.map((item: any) => 
          item.valueObject.Description?.valueString
        ).join(', ') || ''
      },
      confidenceScore: doc.confidence || 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'azure-form-recognizer',
          method: 'external-api',
          rawResponse: result
        }
      },
      processedAt: new Date()
    };
  }

  private async processWithGoogleDocumentAI(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: ProcessingOptions
  ): Promise<ExtractionResult> {
    const config = this.configs.get('google');
    if (!config) {
      console.log('Google Document AI configuration not found - missing API keys');
      throw new Error('Google Document AI configuration not found - missing API keys');
    }
    
    const response = await axios.post(
      `${config.baseUrl}/locations/us/processors/PROCESSOR_ID:process`,
      {
        rawDocument: {
          content: buffer.toString('base64'),
          mimeType: mimeType
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.timeout
      }
    );

    const document = response.data.document;
    const entities = document.entities || [];
    
    // Extract fields from entities
    const extractedData: any = {};
    for (const entity of entities) {
      switch (entity.type) {
        case 'supplier_name':
          extractedData.vendor = entity.mentionText;
          break;
        case 'total_amount':
          extractedData.total = this.parseAmount(entity.mentionText);
          break;
        case 'invoice_id':
          extractedData.invoiceNumber = entity.mentionText;
          break;
        case 'invoice_date':
          extractedData.issueDate = this.parseDate(entity.mentionText);
          break;
      }
    }
    
    return {
      data: extractedData,
      confidenceScore: 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'google-document-ai',
          method: 'external-api',
          rawResponse: document
        }
      },
      processedAt: new Date()
    };
  }

  private async processWithVeryfi(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: ProcessingOptions
  ): Promise<ExtractionResult> {
    const config = this.configs.get('veryfi')!;
    
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);

    const response = await axios.post(`${config.baseUrl}/api/v8/partner/documents`, formData, {
      headers: {
        'CLIENT-ID': process.env.VERYFI_CLIENT_ID,
        'AUTHORIZATION': `apikey ${process.env.VERYFI_USERNAME}:${config.apiKey}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: config.timeout
    });

    const data = response.data;
    
    return {
      data: {
        vendor: data.vendor?.name || '',
        total: data.total || 0,
        netAmount: data.subtotal || 0,
        vatAmount: data.tax || 0,
        invoiceNumber: data.invoice_number || '',
        issueDate: this.parseDate(data.date),
        description: data.line_items?.map((item: any) => item.description).join(', ') || ''
      },
      confidenceScore: 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'veryfi-api',
          method: 'external-api',
          rawResponse: data
        }
      },
      processedAt: new Date()
    };
  }

  private selectBestProcessor(mimeType: string, filename: string): string {
    // Select best processor based on file type and available services
    if (mimeType === 'application/pdf') {
      if (this.configs.has('mindee')) return 'mindee'; // Best for invoices
      if (this.configs.has('azure')) return 'azure';
      if (this.configs.has('klippa')) return 'klippa';
    }
    
    if (mimeType.startsWith('image/')) {
      if (this.configs.has('visionparser')) return 'visionparser'; // Best for receipts
      if (this.configs.has('mindee')) return 'mindee';
      if (this.configs.has('veryfi')) return 'veryfi';
    }

    // Default fallback
    return Array.from(this.configs.keys())[0] || 'visionparser';
  }

  private getDefaultFallbacks(primary: string): string[] {
    const all = Array.from(this.configs.keys());
    return all.filter(p => p !== primary);
  }

  private isValidResult(result: ExtractionResult, threshold?: number): boolean {
    const minThreshold = threshold || 0.7;
    return result.confidenceScore >= minThreshold && 
           (result.data.vendor || result.data.total || result.data.invoiceNumber);
  }

  private parseAmount(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleanValue = value.replace(/[€$£¥,\s]/g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    }
    return 0;
  }

  private parseVatRate(value: any): number {
    if (typeof value === 'number') return value > 1 ? value / 100 : value;
    if (typeof value === 'string') {
      const rate = parseFloat(value.replace('%', ''));
      return rate > 1 ? rate / 100 : rate;
    }
    return 0.23; // Default Portuguese VAT
  }

  private parseDate(value: any): string {
    if (!value) return '';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  private categorizeExpense(category?: string): string {
    if (!category) return 'outras_despesas';
    
    const cat = category.toLowerCase();
    if (cat.includes('fuel') || cat.includes('combustível')) return 'combustiveis_lubrificantes';
    if (cat.includes('food') || cat.includes('restaurant') || cat.includes('refeições')) return 'refeicoes';
    if (cat.includes('travel') || cat.includes('hotel') || cat.includes('deslocações')) return 'deslocacoes_estadas';
    if (cat.includes('material') || cat.includes('office') || cat.includes('escritório')) return 'material_escritorio';
    
    return 'outras_despesas';
  }

  getAvailableProcessors(): string[] {
    return Array.from(this.configs.keys());
  }

  getProcessorStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name] of this.configs) {
      status[name] = true; // Could add health checks here
    }
    return status;
  }
}