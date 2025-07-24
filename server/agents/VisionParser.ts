import { ExtractionResult } from '../../shared/types';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VisionProcessingOptions {
  enhanceOCR?: boolean;
  extractTables?: boolean;
  detectHandwriting?: boolean;
  multiLanguage?: boolean;
  highResolution?: boolean;
  structuredOutput?: boolean;
}

export interface VisionResult {
  extractedText: string;
  detectedElements: {
    tables: TableElement[];
    handwriting: HandwritingElement[];
    stamps: StampElement[];
    signatures: SignatureElement[];
    logos: LogoElement[];
  };
  layout: DocumentLayout;
  confidence: number;
}

export interface TableElement {
  position: BoundingBox;
  headers: string[];
  rows: string[][];
  confidence: number;
}

export interface HandwritingElement {
  position: BoundingBox;
  text: string;
  confidence: number;
}

export interface StampElement {
  position: BoundingBox;
  text: string;
  type: 'official' | 'approval' | 'date' | 'signature';
}

export interface SignatureElement {
  position: BoundingBox;
  isDigital: boolean;
  confidence: number;
}

export interface LogoElement {
  position: BoundingBox;
  description: string;
  confidence: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentLayout {
  orientation: 'portrait' | 'landscape';
  pageCount: number;
  textRegions: BoundingBox[];
  imageRegions: BoundingBox[];
}

export class VisionParser {
  private openai: OpenAI;
  private genai: GoogleGenerativeAI;

  constructor(openaiKey?: string, geminiKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
    if (geminiKey) {
      this.genai = new GoogleGenerativeAI(geminiKey);
    }
  }

  async parseDocument(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: VisionProcessingOptions = {}
  ): Promise<VisionResult> {
    console.log(`🔍 Vision parsing document: ${filename} with options:`, options);

    try {
      // Use Gemini for advanced vision processing if available
      if (this.genai) {
        return await this.parseWithGeminiVision(buffer, mimeType, filename, options);
      }
      
      // Fallback to OpenAI vision
      if (this.openai) {
        return await this.parseWithOpenAIVision(buffer, mimeType, filename, options);
      }

      throw new Error('No vision processing API available');
    } catch (error) {
      console.error('Vision parsing failed:', error);
      throw error;
    }
  }

  private async parseWithGeminiVision(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: VisionProcessingOptions
  ): Promise<VisionResult> {
    const model = this.genai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = this.buildVisionPrompt(options);

    const parts = [
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeType
        }
      },
      { text: prompt }
    ];

    const result = await model.generateContent(parts);
    const response = await result.response;
    const analysisText = response.text();

    try {
      // Clean up the response text to fix common JSON issues
      let cleanedText = analysisText.trim();
      
      // Remove any potential markdown code blocks
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      }
      
      // Fix common JSON issues
      cleanedText = cleanedText
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to property names
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      
      const analysis = JSON.parse(cleanedText);
      return this.formatVisionResult(analysis, filename);
    } catch (parseError) {
      console.error('Failed to parse Gemini vision response:', parseError);
      console.error('Raw response:', analysisText.substring(0, 500) + '...');
      return this.createFallbackVisionResult(analysisText, filename);
    }
  }

  private async parseWithOpenAIVision(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: VisionProcessingOptions
  ): Promise<VisionResult> {
    const base64Image = buffer.toString('base64');
    const prompt = this.buildVisionPrompt(options);

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: options.highResolution ? "high" : "auto"
              }
            }
          ]
        }
      ],
      response_format: options.structuredOutput ? { type: "json_object" } : undefined,
      max_tokens: 4000
    });

    const analysisText = response.choices[0].message.content || '';

    try {
      if (options.structuredOutput) {
        const analysis = JSON.parse(analysisText);
        return this.formatVisionResult(analysis, filename);
      } else {
        return this.createFallbackVisionResult(analysisText, filename);
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI vision response:', parseError);
      return this.createFallbackVisionResult(analysisText, filename);
    }
  }

  private buildVisionPrompt(options: VisionProcessingOptions): string {
    let prompt = `Analyze this document image and extract information with the following requirements:

REQUIRED OUTPUT FORMAT (JSON):
{
  "extractedText": "full text content",
  "detectedElements": {
    "tables": [{"position": {"x": 0, "y": 0, "width": 100, "height": 50}, "headers": ["col1"], "rows": [["data"]], "confidence": 0.95}],
    "handwriting": [{"position": {"x": 0, "y": 0, "width": 100, "height": 20}, "text": "handwritten text", "confidence": 0.8}],
    "stamps": [{"position": {"x": 0, "y": 0, "width": 50, "height": 50}, "text": "stamp text", "type": "official"}],
    "signatures": [{"position": {"x": 0, "y": 0, "width": 100, "height": 30}, "isDigital": false, "confidence": 0.9}],
    "logos": [{"position": {"x": 0, "y": 0, "width": 80, "height": 80}, "description": "company logo", "confidence": 0.85}]
  },
  "layout": {
    "orientation": "portrait",
    "pageCount": 1,
    "textRegions": [{"x": 0, "y": 0, "width": 500, "height": 700}],
    "imageRegions": [{"x": 0, "y": 0, "width": 100, "height": 100}]
  },
  "confidence": 0.92
}

SPECIFIC REQUIREMENTS:`;

    if (options.enhanceOCR) {
      prompt += '\n- Perform enhanced OCR with error correction for unclear text';
    }
    
    if (options.extractTables) {
      prompt += '\n- Identify and extract all table structures with headers and data';
    }
    
    if (options.detectHandwriting) {
      prompt += '\n- Detect and transcribe any handwritten text or annotations';
    }
    
    if (options.multiLanguage) {
      prompt += '\n- Support multiple languages (Portuguese, English, Spanish, French)';
    }

    prompt += '\n\nFocus on Portuguese business documents (invoices, receipts, contracts).';
    prompt += '\nProvide accurate bounding box coordinates and confidence scores.';
    prompt += '\nReturn only valid JSON without additional text.';

    return prompt;
  }

  private formatVisionResult(analysis: any, filename: string): VisionResult {
    return {
      extractedText: analysis.extractedText || '',
      detectedElements: {
        tables: analysis.detectedElements?.tables || [],
        handwriting: analysis.detectedElements?.handwriting || [],
        stamps: analysis.detectedElements?.stamps || [],
        signatures: analysis.detectedElements?.signatures || [],
        logos: analysis.detectedElements?.logos || []
      },
      layout: analysis.layout || {
        orientation: 'portrait',
        pageCount: 1,
        textRegions: [],
        imageRegions: []
      },
      confidence: analysis.confidence || 0.5
    };
  }

  private createFallbackVisionResult(text: string, filename: string): VisionResult {
    return {
      extractedText: text,
      detectedElements: {
        tables: [],
        handwriting: [],
        stamps: [],
        signatures: [],
        logos: []
      },
      layout: {
        orientation: 'portrait',
        pageCount: 1,
        textRegions: [{ x: 0, y: 0, width: 595, height: 842 }],
        imageRegions: []
      },
      confidence: 0.7
    };
  }

  async extractFromInvoice(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<ExtractionResult> {
    const visionResult = await this.parseDocument(buffer, mimeType, filename, {
      enhanceOCR: true,
      extractTables: true,
      multiLanguage: true,
      structuredOutput: true
    });

    // Convert vision result to extraction result
    const extractedData = this.parseInvoiceFromVision(visionResult);

    return {
      data: extractedData,
      confidenceScore: visionResult.confidence,
      issues: [],
      agentResults: {
        extractor: {
          model: 'vision-parser',
          method: 'enhanced-ocr',
          rawResponse: visionResult.extractedText
        }
      },
      processedAt: new Date()
    };
  }

  private parseInvoiceFromVision(visionResult: VisionResult): any {
    const text = visionResult.extractedText.toLowerCase();
    
    // Enhanced Portuguese invoice field extraction
    const data: any = {};

    // Extract invoice number
    const invoiceMatch = text.match(/(?:fatura|invoice|n[oº°])\s*:?\s*([a-z0-9\/\-]+)/i);
    if (invoiceMatch) data.invoiceNumber = invoiceMatch[1];

    // Extract NIF with Portuguese format
    const nifMatch = text.match(/nif\s*:?\s*([0-9]{9})/i);
    if (nifMatch) data.nif = `PT${nifMatch[1]}`;

    // Extract total amount with Portuguese formatting
    const totalMatch = text.match(/total\s*:?\s*€?\s*([0-9]+[,.]?[0-9]*)/i);
    if (totalMatch) {
      data.total = parseFloat(totalMatch[1].replace(',', '.'));
    }

    // Extract VAT amount
    const vatMatch = text.match(/iva\s*:?\s*€?\s*([0-9]+[,.]?[0-9]*)/i);
    if (vatMatch) {
      data.vatAmount = parseFloat(vatMatch[1].replace(',', '.'));
    }

    // Extract date
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    if (dateMatch) {
      const [day, month, year] = dateMatch[1].split(/[\/\-]/);
      data.issueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Extract vendor from document header
    const lines = visionResult.extractedText.split('\n');
    const vendorLine = lines.find(line => 
      line.length > 10 && 
      !line.match(/fatura|invoice|total|data|nif/i) &&
      line.trim().length > 0
    );
    if (vendorLine) data.vendor = vendorLine.trim();

    return data;
  }
}