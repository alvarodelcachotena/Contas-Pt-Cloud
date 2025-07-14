import { ExtractionResult } from '../../shared/types';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TableParsingOptions {
  detectHeaders?: boolean;
  mergeSpannedCells?: boolean;
  preserveFormatting?: boolean;
  extractNumericData?: boolean;
  handleComplexLayouts?: boolean;
  outputFormat?: 'json' | 'csv' | 'structured';
}

export interface TableStructure {
  id: string;
  position: BoundingBox;
  headers: TableHeader[];
  rows: TableRow[];
  metadata: TableMetadata;
  confidence: number;
}

export interface TableHeader {
  text: string;
  columnIndex: number;
  dataType: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  confidence: number;
}

export interface TableRow {
  cells: TableCell[];
  rowIndex: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
}

export interface TableCell {
  text: string;
  value: any;
  dataType: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  columnSpan: number;
  rowSpan: number;
  formatting?: CellFormatting;
  confidence: number;
}

export interface CellFormatting {
  bold?: boolean;
  italic?: boolean;
  alignment?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  textColor?: string;
}

export interface TableMetadata {
  tableType: 'invoice_items' | 'expense_summary' | 'vat_breakdown' | 'payment_schedule' | 'general';
  currency?: string;
  totalRows: number;
  totalColumns: number;
  hasCalculations?: boolean;
  language: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TableParsingResult {
  tables: TableStructure[];
  extractedText: string;
  processingMetrics: {
    totalTables: number;
    successfulExtractions: number;
    averageConfidence: number;
    processingTime: number;
  };
  issues: string[];
}

export class TableParser {
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

  async parseTablesFromDocument(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: TableParsingOptions = {}
  ): Promise<TableParsingResult> {
    const startTime = Date.now();
    console.log(`📊 Table parsing document: ${filename} with options:`, options);

    try {
      let result: TableParsingResult;

      // Use Gemini for table extraction if available
      if (this.genai) {
        result = await this.parseTablesWithGemini(buffer, mimeType, filename, options);
      } else if (this.openai) {
        result = await this.parseTablesWithOpenAI(buffer, mimeType, filename, options);
      } else {
        throw new Error('No AI service available for table parsing');
      }

      // Calculate processing metrics
      result.processingMetrics.processingTime = Date.now() - startTime;
      result.processingMetrics.averageConfidence = 
        result.tables.reduce((sum, table) => sum + table.confidence, 0) / 
        (result.tables.length || 1);

      return result;
    } catch (error) {
      console.error('Table parsing failed:', error);
      throw error;
    }
  }

  private async parseTablesWithGemini(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: TableParsingOptions
  ): Promise<TableParsingResult> {
    const model = this.genai.getGenerativeModel({ 
      model: "gemini-2.5-flash-preview",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = this.buildTableExtractionPrompt(options);

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
      const analysis = JSON.parse(analysisText);
      return this.formatTableResult(analysis, filename);
    } catch (parseError) {
      console.error('Failed to parse Gemini table response:', parseError);
      return this.createFallbackTableResult(analysisText, filename);
    }
  }

  private async parseTablesWithOpenAI(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    options: TableParsingOptions
  ): Promise<TableParsingResult> {
    const base64Image = buffer.toString('base64');
    const prompt = this.buildTableExtractionPrompt(options);

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
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    const analysisText = response.choices[0].message.content || '';

    try {
      const analysis = JSON.parse(analysisText);
      return this.formatTableResult(analysis, filename);
    } catch (parseError) {
      console.error('Failed to parse OpenAI table response:', parseError);
      return this.createFallbackTableResult(analysisText, filename);
    }
  }

  private buildTableExtractionPrompt(options: TableParsingOptions): string {
    const prompt = `Extract all table structures from this document with detailed analysis.

REQUIRED JSON OUTPUT FORMAT:
{
  "tables": [
    {
      "id": "table_1",
      "position": {"x": 0, "y": 0, "width": 500, "height": 200},
      "headers": [
        {
          "text": "Description",
          "columnIndex": 0,
          "dataType": "text",
          "confidence": 0.95
        }
      ],
      "rows": [
        {
          "cells": [
            {
              "text": "Product A",
              "value": "Product A",
              "dataType": "text",
              "columnSpan": 1,
              "rowSpan": 1,
              "confidence": 0.9
            }
          ],
          "rowIndex": 0,
          "isSubtotal": false,
          "isTotal": false
        }
      ],
      "metadata": {
        "tableType": "invoice_items",
        "currency": "EUR",
        "totalRows": 5,
        "totalColumns": 4,
        "hasCalculations": true,
        "language": "pt"
      },
      "confidence": 0.92
    }
  ],
  "extractedText": "full document text",
  "processingMetrics": {
    "totalTables": 1,
    "successfulExtractions": 1,
    "averageConfidence": 0.92,
    "processingTime": 0
  },
  "issues": []
}

EXTRACTION REQUIREMENTS:
- Identify ALL table structures in the document
- Extract headers with correct data types (text, number, date, currency, percentage)
- Parse all table cells with proper data type detection
- Detect merged/spanned cells and indicate columnSpan/rowSpan
- Identify subtotal and total rows
- Determine table type (invoice_items, expense_summary, vat_breakdown, etc.)
- Handle Portuguese formatting (€ currency, comma decimal separator)
- Provide accurate confidence scores for each element
- Include bounding box coordinates for table positioning

PORTUGUESE BUSINESS CONTEXT:
- Currency amounts use "€" symbol and comma for decimals (123,45 €)
- VAT rates: 6%, 13%, 23%
- Common table types: invoice items, expense summaries, VAT breakdowns
- Date format: DD/MM/YYYY or DD-MM-YYYY
- Language detection: Portuguese (pt), English (en), Spanish (es)

SPECIAL HANDLING:`;

    if (options.detectHeaders) {
      prompt += '\n- Automatically detect table headers even without clear formatting';
    }
    
    if (options.mergeSpannedCells) {
      prompt += '\n- Handle merged cells and complex table layouts';
    }
    
    if (options.preserveFormatting) {
      prompt += '\n- Preserve cell formatting (bold, italic, alignment, colors)';
    }
    
    if (options.extractNumericData) {
      prompt += '\n- Extract and parse all numeric data with proper data types';
    }
    
    if (options.handleComplexLayouts) {
      prompt += '\n- Handle complex layouts with nested tables and irregular structures';
    }

    prompt += '\n\nReturn only valid JSON without additional text or explanations.';

    return prompt;
  }

  private formatTableResult(analysis: any, filename: string): TableParsingResult {
    return {
      tables: analysis.tables || [],
      extractedText: analysis.extractedText || '',
      processingMetrics: analysis.processingMetrics || {
        totalTables: 0,
        successfulExtractions: 0,
        averageConfidence: 0,
        processingTime: 0
      },
      issues: analysis.issues || []
    };
  }

  private createFallbackTableResult(text: string, filename: string): TableParsingResult {
    return {
      tables: [],
      extractedText: text,
      processingMetrics: {
        totalTables: 0,
        successfulExtractions: 0,
        averageConfidence: 0,
        processingTime: 0
      },
      issues: ['Failed to parse structured table data, extracted as plain text']
    };
  }

  async extractInvoiceLineItems(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<InvoiceLineItem[]> {
    const tableResult = await this.parseTablesFromDocument(buffer, mimeType, filename, {
      detectHeaders: true,
      extractNumericData: true,
      handleComplexLayouts: true,
      outputFormat: 'structured'
    });

    const invoiceTables = tableResult.tables.filter(table => 
      table.metadata.tableType === 'invoice_items' || 
      this.isInvoiceItemsTable(table)
    );

    const lineItems: InvoiceLineItem[] = [];

    for (const table of invoiceTables) {
      const items = this.parseInvoiceItemsFromTable(table);
      lineItems.push(...items);
    }

    return lineItems;
  }

  private isInvoiceItemsTable(table: TableStructure): boolean {
    const headers = table.headers.map(h => h.text.toLowerCase());
    
    // Check for common invoice headers
    const invoiceKeywords = [
      'description', 'descrição', 'qty', 'quantidade', 'price', 'preço', 
      'amount', 'valor', 'total', 'unit', 'unidade', 'item'
    ];

    const matches = headers.filter(header => 
      invoiceKeywords.some(keyword => header.includes(keyword))
    );

    return matches.length >= 2; // At least 2 matching headers
  }

  private parseInvoiceItemsFromTable(table: TableStructure): InvoiceLineItem[] {
    const items: InvoiceLineItem[] = [];
    
    // Find column indices for common fields
    const descIndex = this.findColumnIndex(table.headers, ['description', 'descrição', 'item']);
    const qtyIndex = this.findColumnIndex(table.headers, ['qty', 'quantidade', 'qtd']);
    const priceIndex = this.findColumnIndex(table.headers, ['price', 'preço', 'unit']);
    const totalIndex = this.findColumnIndex(table.headers, ['total', 'amount', 'valor']);

    for (const row of table.rows) {
      if (row.isTotal || row.isSubtotal) continue;

      const item: InvoiceLineItem = {
        description: descIndex >= 0 ? row.cells[descIndex]?.text || '' : '',
        quantity: qtyIndex >= 0 ? this.parseNumber(row.cells[qtyIndex]?.text) : 1,
        unitPrice: priceIndex >= 0 ? this.parseNumber(row.cells[priceIndex]?.text) : 0,
        totalPrice: totalIndex >= 0 ? this.parseNumber(row.cells[totalIndex]?.text) : 0,
        vatRate: this.extractVatRate(row.cells),
        confidence: Math.min(...row.cells.map(cell => cell.confidence))
      };

      if (item.description && item.totalPrice > 0) {
        items.push(item);
      }
    }

    return items;
  }

  private findColumnIndex(headers: TableHeader[], keywords: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const headerText = headers[i].text.toLowerCase();
      if (keywords.some(keyword => headerText.includes(keyword))) {
        return i;
      }
    }
    return -1;
  }

  private parseNumber(text?: string): number {
    if (!text) return 0;
    
    // Handle Portuguese number format (comma as decimal separator)
    const cleanText = text.replace(/[€\s]/g, '').replace(',', '.');
    const number = parseFloat(cleanText);
    return isNaN(number) ? 0 : number;
  }

  private extractVatRate(cells: TableCell[]): number {
    // Look for VAT rate in any cell (common Portuguese rates: 6%, 13%, 23%)
    for (const cell of cells) {
      const text = cell.text.toLowerCase();
      if (text.includes('23%') || text.includes('0,23')) return 0.23;
      if (text.includes('13%') || text.includes('0,13')) return 0.13;
      if (text.includes('6%') || text.includes('0,06')) return 0.06;
    }
    return 0.23; // Default Portuguese VAT rate
  }
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  confidence: number;
}