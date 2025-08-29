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
        nif: '',
        nifCountry: '',
        vendorAddress: '',
        vendorPhone: '',
        total: this.parseAmount(data.total || data.amount),
        netAmount: this.parseAmount(data.subtotal),
        vatAmount: this.parseAmount(data.tax || data.vat),
        vatRate: this.parseVatRate(data.tax_rate || data.vat_rate),
        invoiceNumber: data.invoice_number || data.receipt_number || '',
        issueDate: data.date || new Date().toISOString().split('T')[0],
        description: data.description || data.notes || '',
        category: this.categorizeExpense(data),
        lineItems: [],
      },
      confidenceScore: 0.7,
      issues: [],
      agentResults: {
        extractor: {
          model: "external_processor",
          method: "api_integration",
          rawResponse: JSON.stringify(data).substring(0, 200),
        },
      },
      processedAt: new Date(),
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
        nifCountry: '',
        vendorAddress: prediction.supplier_address?.value || '',
        vendorPhone: prediction.supplier_phone?.value || '',
        total: prediction.total_amount?.value || 0,
        netAmount: prediction.total_net?.value || 0,
        vatAmount: prediction.total_tax?.value || 0,
        vatRate: this.parseVatRate(prediction.taxes?.[0]?.rate),
        invoiceNumber: prediction.invoice_number?.value || '',
        issueDate: this.parseDate(prediction.date?.value),
        description: prediction.line_items?.map((item: any) => item.description).join(', ') || '',
        category: this.categorizeExpense(prediction),
        lineItems: [],
      },
      confidenceScore: prediction.supplier_name?.confidence || 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'mindee-invoice-v4',
          method: 'external-api',
          rawResponse: JSON.stringify(prediction).substring(0, 200),
        },
      },
      processedAt: new Date(),
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
        nifCountry: '',
        vendorAddress: data.supplier_address || '',
        vendorPhone: data.supplier_phone || '',
        total: this.parseAmount(data.amount),
        netAmount: this.parseAmount(data.amount_ex_vat),
        vatAmount: this.parseAmount(data.vat_amount),
        vatRate: this.parseVatRate(data.vat_percentage),
        invoiceNumber: data.invoice_number || '',
        issueDate: this.parseDate(data.date),
        description: data.description || '',
        category: this.categorizeExpense(data),
        lineItems: [],
      },
      confidenceScore: data.confidence || 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'klippa-ocr',
          method: 'external-api',
          rawResponse: JSON.stringify(data).substring(0, 200),
        },
      },
      processedAt: new Date(),
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
        nifCountry: '',
        vendorAddress: fields.VendorAddress?.valueString || '',
        vendorPhone: fields.VendorPhone?.valueString || '',
        total: fields.InvoiceTotal?.valueNumber || 0,
        netAmount: fields.SubTotal?.valueNumber || 0,
        vatAmount: fields.TotalTax?.valueNumber || 0,
        vatRate: this.parseVatRate(fields.TaxRate?.valueNumber),
        invoiceNumber: fields.InvoiceId?.valueString || '',
        issueDate: this.parseDate(fields.InvoiceDate?.valueDate),
        description: fields.Items?.valueArray?.map((item: any) => 
          item.valueObject.Description?.valueString
        ).join(', ') || '',
        category: this.categorizeExpense(fields),
        lineItems: [],
      },
      confidenceScore: doc.confidence || 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'azure-form-recognizer',
          method: 'external-api',
          rawResponse: JSON.stringify(result).substring(0, 200),
        },
      },
      processedAt: new Date(),
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
        nif: data.vendor?.tax_id || '',
        nifCountry: '',
        vendorAddress: data.vendor?.address || '',
        vendorPhone: data.vendor?.phone || '',
        total: data.total || 0,
        netAmount: data.subtotal || 0,
        vatAmount: data.tax || 0,
        vatRate: this.parseVatRate(data.tax_rate),
        invoiceNumber: data.invoice_number || '',
        issueDate: this.parseDate(data.date),
        description: data.line_items?.map((item: any) => item.description).join(', ') || '',
        category: this.categorizeExpense(data),
        lineItems: [],
      },
      confidenceScore: 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: 'veryfi-api',
          method: 'external-api',
          rawResponse: JSON.stringify(data).substring(0, 200),
        },
      },
      processedAt: new Date(),
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
           !!(result.data.vendor || result.data.total || result.data.invoiceNumber);
  }

  private parseAmount(value: any): number {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  private parseVatRate(value: any): number {
    if (!value) return 0.23; // Default Portuguese VAT rate
    if (typeof value === 'number') {
      return value > 1 ? value / 100 : value;
    }
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
      const rate = parseFloat(cleaned) || 23;
      return rate > 1 ? rate / 100 : rate;
    }
    return 0.23;
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

  private categorizeExpense(data: any): string {
    const text = `${data.merchant_name || ''} ${data.vendor || ''} ${data.description || ''} ${data.category || ''}`.toLowerCase();
    
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

  getAvailableProcessors(): string[] {
    return Array.from(this.configs.keys());
  }

  getProcessorStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    Array.from(this.configs.entries()).forEach(([name]) => {
      status[name] = true; // Could add health checks here
    });
    return status;
  }

  private async processVeryfiPrediction(prediction: any): Promise<ExtractionResult> {
    return {
      data: {
        vendor: prediction.supplier_name?.value || '',
        nif: prediction.supplier_company_registrations?.[0]?.value || '',
        nifCountry: '',
        vendorAddress: prediction.supplier_address?.value || '',
        vendorPhone: prediction.supplier_phone?.value || '',
        total: prediction.total_amount?.value || 0,
        netAmount: prediction.subtotal_amount?.value || 0,
        vatAmount: prediction.tax_amount?.value || 0,
        vatRate: this.parseVatRate(prediction.tax_rate?.value),
        invoiceNumber: prediction.invoice_number?.value || '',
        issueDate: this.parseDate(prediction.date?.value),
        description: prediction.line_items?.map((item: any) => item.description).join(', ') || '',
        category: this.categorizeExpense(prediction),
        lineItems: [],
      },
      confidenceScore: prediction.supplier_name?.confidence || 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: "veryfi",
          method: "api_integration",
          rawResponse: JSON.stringify(prediction).substring(0, 200),
        },
      },
      processedAt: new Date(),
    };
  }

  private async processTabscannerPrediction(data: any): Promise<ExtractionResult> {
    return {
      data: {
        vendor: data.merchant_name || '',
        nif: data.tax_id || '',
        nifCountry: '',
        vendorAddress: data.merchant_address || '',
        vendorPhone: data.merchant_phone || '',
        invoiceNumber: data.invoice_number || '',
        issueDate: this.parseDate(data.date),
        total: this.parseAmount(data.total),
        netAmount: this.parseAmount(data.subtotal),
        vatAmount: this.parseAmount(data.tax),
        vatRate: this.parseVatRate(data.tax_rate),
        category: this.categorizeExpense(data),
        description: data.description || '',
        lineItems: [],
      },
      confidenceScore: 0.8,
      issues: [],
      agentResults: {
        extractor: {
          model: "tabscanner",
          method: "api_integration",
          rawResponse: JSON.stringify(data).substring(0, 200),
        },
      },
      processedAt: new Date(),
    };
  }

  private async processFormRecognizerPrediction(fields: any): Promise<ExtractionResult> {
    return {
      data: {
        vendor: fields.VendorName?.valueString || '',
        nif: fields.VendorTaxId?.valueString || '',
        nifCountry: '',
        vendorAddress: fields.VendorAddress?.valueString || '',
        vendorPhone: fields.VendorPhone?.valueString || '',
        invoiceNumber: fields.InvoiceId?.valueString || '',
        issueDate: this.parseDate(fields.InvoiceDate?.valueDate),
        total: this.parseAmount(fields.TotalAmount?.valueNumber),
        netAmount: this.parseAmount(fields.SubTotal?.valueNumber),
        vatAmount: this.parseAmount(fields.TaxAmount?.valueNumber),
        vatRate: this.parseVatRate(fields.TaxRate?.valueNumber),
        category: this.categorizeExpense(fields),
        description: fields.Items?.valueArray?.map((item: any) => 
          item.valueObject.Description?.valueString
        ).join(', ') || '',
        lineItems: [],
      },
      confidenceScore: 0.85,
      issues: [],
      agentResults: {
        extractor: {
          model: "form_recognizer",
          method: "api_integration",
          rawResponse: JSON.stringify(fields).substring(0, 200),
        },
      },
      processedAt: new Date(),
    };
  }
}