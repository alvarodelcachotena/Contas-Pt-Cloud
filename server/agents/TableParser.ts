import { GoogleGenAI } from "@google/genai";
import { ExtractionResult, LineItem } from "../../shared/types";

interface TableExtractionResult {
  lineItems: LineItem[];
  tableConfidence: number;
  extractionIssues: string[];
}

export class TableParser {
  private genAI: GoogleGenAI;
  private useLayoutLM: boolean;

  constructor(apiKey: string, useLayoutLM: boolean = true) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.useLayoutLM = useLayoutLM;
  }

  private async extractWithLayoutLM(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<TableExtractionResult> {
    const prompt = `
Analyze this document's tables and extract line items. For each line item, identify:

1. Description of item/service
2. Quantity
3. Unit price
4. Net amount
5. VAT rate
6. VAT amount
7. Total amount

CRITICAL RULES:
- Extract ONLY items clearly visible in tables
- Maintain exact numbers and decimal places
- Preserve item descriptions exactly as written
- Calculate VAT amounts if not explicitly shown
- Skip rows that are not clear or complete
- Do not make assumptions about missing data

Return in this JSON format:
{
  "lineItems": [
    {
      "description": "exact item text",
      "quantity": 0,
      "unitPrice": 0.00,
      "netAmount": 0.00,
      "vatRate": 0.23,
      "vatAmount": 0.00,
      "totalAmount": 0.00
    }
  ],
  "tableConfidence": 0.95,
  "extractionIssues": ["list any problems found"]
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
        throw new Error("No valid JSON found in table extraction response");
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // Validate line items
      result.lineItems = (result.lineItems || []).map((item: any) => ({
        description: item.description || "",
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        netAmount: parseFloat(item.netAmount) || 0,
        vatRate: parseFloat(item.vatRate) || 0,
        vatAmount: parseFloat(item.vatAmount) || 0,
        totalAmount: parseFloat(item.totalAmount) || 0,
      }));

      return {
        lineItems: result.lineItems,
        tableConfidence: result.tableConfidence || 0,
        extractionIssues: result.extractionIssues || [],
      };
    } catch (error: unknown) {
      console.error("LayoutLM table extraction failed:", error);
      return {
        lineItems: [],
        tableConfidence: 0,
        extractionIssues: [`Table extraction failed: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  private async extractWithFallback(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<TableExtractionResult> {
    const prompt = `
Extract line items from this document using text-based analysis. Look for:

1. Item descriptions
2. Quantities and unit prices
3. Net amounts and VAT
4. Totals per line

Focus on finding structured data patterns like:
- Tabular layouts with columns
- Repeated line patterns
- Numerical sequences
- Item/price pairs

Return the same JSON structure as the main extractor.`;

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
    return {
          lineItems: [],
          tableConfidence: 0,
          extractionIssues: ["Fallback extraction failed to produce valid JSON"],
        };
      }

      const result = JSON.parse(jsonMatch[0]);
      return {
        lineItems: result.lineItems || [],
        tableConfidence: (result.tableConfidence || 0) * 0.7, // Reduce confidence for fallback
        extractionIssues: result.extractionIssues || [],
      };
    } catch (error: unknown) {
    return {
        lineItems: [],
        tableConfidence: 0,
        extractionIssues: [`Fallback extraction failed: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  async extractTables(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<TableExtractionResult> {
    // Try LayoutLM first if enabled
    if (this.useLayoutLM) {
      const layoutResult = await this.extractWithLayoutLM(fileBuffer, mimeType);
      
      // If LayoutLM extraction was successful, return results
      if (layoutResult.lineItems.length > 0 && layoutResult.tableConfidence > 0.5) {
        return layoutResult;
      }
    }

    // Fall back to text-based extraction if LayoutLM fails or is disabled
    return this.extractWithFallback(fileBuffer, mimeType);
  }

  validateLineItems(items: LineItem[]): string[] {
    const issues: string[] = [];

    for (const item of items) {
      // Check for missing required fields
      if (!item.description) {
        issues.push("Item missing description");
      }

      // Validate numerical values
      if (item.quantity <= 0) {
        issues.push(`Invalid quantity for item: ${item.description}`);
      }

      if (item.unitPrice < 0 || item.netAmount < 0 || item.vatAmount < 0) {
        issues.push(`Negative amounts found for item: ${item.description}`);
      }

      // Verify calculations
      const calculatedNet = item.quantity * item.unitPrice;
      if (Math.abs(calculatedNet - item.netAmount) > 0.01) {
        issues.push(`Net amount mismatch for item: ${item.description}`);
      }

      const calculatedVat = item.netAmount * item.vatRate;
      if (Math.abs(calculatedVat - item.vatAmount) > 0.01) {
        issues.push(`VAT calculation mismatch for item: ${item.description}`);
      }

      const calculatedTotal = item.netAmount + item.vatAmount;
      if (Math.abs(calculatedTotal - item.totalAmount) > 0.01) {
        issues.push(`Total amount mismatch for item: ${item.description}`);
      }
    }

    return issues;
  }
}