import { ExtractionResult } from "../../shared/types";

interface StructuredInvoiceExtraction {
  vendor: string;
  nif: string; // Full NIF with country prefix (PT123456789, IT12345678901)
  nifCountry: string; // Country code (PT, IT, ES, etc.)
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
  paymentType: string; // Siempre "tarjeta"
  confidence: number;
  extractionIssues: string[];
}

export class AgentExtractorOpenAI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private validateField(
    value: string | undefined,
    placeholderPatterns: string[],
  ): string {
    if (!value || value.trim() === "") {
      return "";
    }

    const lowerValue = value.toLowerCase();
    for (const pattern of placeholderPatterns) {
      if (lowerValue.includes(pattern)) {
        console.log(
          `🚫 Rejected placeholder data: "${value}" contains "${pattern}"`,
        );
        return "";
      }
    }

    return value;
  }

  // Method for processing documents with OCR text
  async extract(
    ocrText: string,
    filename: string = "",
  ): Promise<ExtractionResult> {
    return this.extractFromText(ocrText, filename);
  }

  // Enhanced method for processing documents with image support
  async extractFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    filename: string = "",
  ): Promise<ExtractionResult> {
    const base64Image = imageBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    return this.extractWithStructuredOutput(undefined, filename, dataUrl);
  }

  // Method for processing OCR text
  async extractFromText(
    ocrText: string,
    filename: string = "",
  ): Promise<ExtractionResult> {
    return this.extractWithStructuredOutput(ocrText, filename);
  }

  private async extractWithStructuredOutput(
    ocrText?: string,
    filename: string = "",
    imageUrl?: string,
  ): Promise<ExtractionResult> {
    const schema = {
      type: "object",
      properties: {
        vendor: {
          type: "string",
          description: "Company name of the invoice issuer",
        },
        nif: {
          type: "string",
          description:
            "Full tax identification number with country prefix (PT123456789, IT12345678901, ES12345678A, etc.)",
        },
        nifCountry: {
          type: "string",
          description:
            "Country code of the tax ID issuer (PT for Portugal, IT for Italy, ES for Spain, etc.)",
        },
        vendorAddress: {
          type: "string",
          description:
            "Complete address of the invoice issuer including street, city, postal code",
        },
        vendorPhone: {
          type: "string",
          description: "Phone number of the invoice issuer",
        },
        invoiceNumber: {
          type: "string",
          description: "Invoice number or reference",
        },
        issueDate: {
          type: "string",
          format: "date",
          description: "Invoice date in YYYY-MM-DD format",
        },
        total: {
          type: "number",
          minimum: 0,
          description: "Total amount including VAT",
        },
        netAmount: {
          type: "number",
          minimum: 0,
          description: "Net amount before VAT",
        },
        vatAmount: {
          type: "number",
          minimum: 0,
          description: "VAT amount",
        },
        vatRate: {
          type: "number",
          enum: [0.06, 0.13, 0.23],
          description: "Portuguese VAT rate (6%, 13%, or 23%)",
        },
        category: {
          type: "string",
          enum: [
            "alimentacao",
            "transporte",
            "material_escritorio",
            "servicos",
            "combustivel",
            "alojamento",
            "outras_despesas",
          ],
          description: "Expense category",
        },
        description: {
          type: "string",
          description: "Brief description of the invoice",
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence score of the extraction",
        },
        extractionIssues: {
          type: "array",
          items: {
            type: "string",
          },
          description: "List of any issues encountered during extraction",
        },
      },
      required: [
        "vendor",
        "nif",
        "nifCountry",
        "vendorAddress",
        "vendorPhone",
        "invoiceNumber",
        "issueDate",
        "total",
        "netAmount",
        "vatAmount",
        "vatRate",
        "category",
        "description",
        "confidence",
        "extractionIssues",
      ],
      additionalProperties: false,
    };

    const messages = [
      {
        role: "system",
        content: `You are a Portuguese accounting document processor specialized in extracting structured data from invoices, receipts, and financial documents.

ABSOLUTE RULE: NEVER use generic, placeholder, or fallback values. Extract ONLY real data visible in the document or leave fields empty.

EXTRACTION RULES:
1. Portuguese VAT rates are strictly 6%, 13%, or 23% (0.06, 0.13, 0.23)
2. EU VAT/NIF EXTRACTION - CRITICAL RULES FOR ALL EU COUNTRIES:
   - ALWAYS extract full tax ID with country prefix for ALL 27 EU countries
   - Portugal: PT + 9 digits (PT123456789)
   - Italy: IT + 11 digits (IT12345678901) - EXAMPLE: "03424760134" → "IT03424760134"
   - Spain: ES + 8 digits + 1 letter (ES12345678A)
   - France: FR + 11 digits (FR12345678901)
   - Germany: DE + 9 digits (DE123456789)
   - Netherlands: NL + 12 digits (NL123456789B12)
   - Belgium: BE + 10 digits (BE1234567890)
   - Austria: AT + 9 digits (ATU12345678)
   - Poland: PL + 10 digits (PL1234567890)
   - Czech Republic: CZ + 8-10 digits (CZ12345678)
   - Sweden: SE + 12 digits (SE123456789012)
   - Denmark: DK + 8 digits (DK12345678)
   - Finland: FI + 8 digits (FI12345678)
   - Ireland: IE + 8 characters (IE1234567A)
   - Luxembourg: LU + 8 digits (LU12345678)
   - Greece: EL + 9 digits (EL123456789)
   - Hungary: HU + 8 digits (HU12345678)
   - Slovakia: SK + 10 digits (SK1234567890)
   - Slovenia: SI + 8 digits (SI12345678)
   - Bulgaria: BG + 9-10 digits (BG123456789)
   - Romania: RO + 2-10 digits (RO12345678)
   - Croatia: HR + 11 digits (HR12345678901)
   - Cyprus: CY + 9 characters (CY12345678A)
   - Malta: MT + 8 digits (MT12345678)
   - Lithuania: LT + 9-12 digits (LT123456789)
   - Latvia: LV + 11 digits (LV12345678901)
   - Estonia: EE + 9 digits (EE123456789)
   - COUNTRY DETECTION RULES:
     * Company domains: .IT → Italy, .ES → Spain, .DE → Germany, .FR → France, .NL → Netherlands
     * Legal forms: S.R.L./S.P.A. → IT, S.A. → ES, GmbH → DE, SARL → FR, B.V. → NL, AB/AG → SE, ApS/A/S → DK
     * Postal codes and address patterns for all EU countries
     * Document language and business context
   - NEVER extract tax ID without country prefix
   - If unsure of country, analyze company name, address, and legal form carefully

CRITICAL REAL DATA EXTRACTION RULES:
MANDATORY: Extract ONLY authentic data visible in the document. NEVER use placeholders, generic values, or invented information.

1. For vendor name: 
   - Look for actual company names in headers, letterheads, logos, stamps, signatures
   - Search for "De:", "From:", "Emissor:", "Vendor:", company registration text
   - If partially visible, extract exactly what you can read
   - If completely illegible or missing, leave EMPTY and report in extractionIssues

2. For monetary amounts:
   - Find actual numbers with €, $ symbols or near "Total", "Subtotal", "IVA", "VAT", "Líquido"
   - Look in tables, summary lines, payment sections, calculation areas
   - If amounts are unclear or missing, use 0 and report the issue
   - Never invent or calculate missing values

3. For dates:
   - Search for actual dates in DD/MM/YYYY, DD-MM-YYYY formats
   - Look near "Data:", "Date:", "Issued:", "Emitido em:", timestamps, document headers
   - If no date is visible, leave empty and report as extraction issue
   - NEVER use current date or invented dates

4. For NIF/VAT ID:
   - Find actual tax numbers (8-12 digits) near "NIF", "VAT", "Tax ID", "CIF", "NIPT"
   - Check company information blocks, headers, footers, legal text
   - If found without country prefix, detect country from business context
   - If no tax ID visible, leave empty and report the issue

5. For addresses and phone numbers:
   - Extract ONLY what is actually written in the document
   - If partially legible, extract readable portions
   - If illegible or missing, leave empty - do not fabricate

EXTRACTION PRIORITY:
- Carefully examine all document text/image content for real data
- Extract partial information when fully readable portions exist
- Leave fields empty when no relevant information is found
- Document all extraction problems in extractionIssues array
- Base confidence score on actual data extraction success, not assumptions

CONFIDENCE SCORING:
1. High confidence (0.8-1.0):
   - All required fields present and clear
   - Values match expected formats
   - No ambiguous information
2. Medium confidence (0.5-0.79):
   - Most fields present but some unclear
   - Some values need interpretation
   - Minor formatting issues
3. Low confidence (0.1-0.49):
   - Many fields missing or unclear
   - Significant ambiguity
   - Format issues affecting extraction

EXTRACTION ISSUES:
1. Document quality issues:
   - Poor image quality
   - Blurry text
   - Cropped content
2. Format issues:
   - Unusual layout
   - Non-standard formatting
   - Mixed languages
3. Content issues:
   - Missing required fields
   - Ambiguous values
   - Inconsistent data
4. Generic data issues:
   - Fields replaced with generic values
   - Confidence reduced due to missing data
   - Timestamps used as fallbacks

DOCUMENT TYPE HANDLING:
1. Invoices (Faturas):
   - Look for "Fatura" or "Fatura/Recibo" headers
   - Extract invoice number, date, and all amounts
   - Verify NIF numbers for both issuer and recipient
   
2. Receipts (Recibos):
   - Look for "Recibo" or "Recibo Verde" headers
   - Focus on total amount and date
   - May have simplified NIF information
   
3. Credit Notes (Notas de Crédito):
   - Look for "Nota de Crédito" headers
   - Extract reference to original invoice
   - Note that amounts may be negative
   
4. Bank Statements (Extratos Bancários):
   - Extract transaction dates and amounts
   - Look for transaction descriptions
   - Note that amounts may be positive (credits) or negative (debits)

CURRENCY HANDLING RULES:
1. All monetary values must be extracted as numbers (not strings) in Euros
2. Look for amounts with these patterns:
   - "€" symbol (e.g., "€100,00")
   - "EUR" or "euros" text
   - Numbers with comma as decimal separator (e.g., "100,00")
   - Numbers with period as decimal separator (e.g., "100.00")
3. Convert all amounts to numbers:
   - Remove currency symbols (€, EUR)
   - Convert comma decimal separator to period
   - Remove thousand separators
   - Example: "€1.234,56" → 1234.56
4. Common Portuguese amount labels to look for:
   - "Total" or "Total a pagar"
   - "Valor líquido" or "Valor sem IVA"
   - "IVA" or "Valor do IVA"
   - "Subtotal"
   - "Valor" or "Montante"
5. If multiple amounts are found, use context to determine which is which:
   - Total usually includes VAT
   - Net amount is before VAT
   - VAT amount is the difference between total and net

CONFIDENCE SCORING:
1. High confidence (0.8-1.0):
   - All required fields present and clear
   - Values match expected formats
   - No ambiguous information
2. Medium confidence (0.5-0.79):
   - Most fields present but some unclear
   - Some values need interpretation
   - Minor formatting issues
3. Low confidence (0.1-0.49):
   - Many fields missing or unclear
   - Significant ambiguity
   - Format issues affecting extraction

EXTRACTION ISSUES:
1. Document quality issues:
   - Poor image quality
   - Blurry text
   - Cropped content
2. Format issues:
   - Unusual layout
   - Non-standard formatting
   - Mixed languages
3. Content issues:
   - Missing required fields
   - Ambiguous values
   - Inconsistent data`,
      },
    ];

    if (imageUrl) {
      (messages as any).push({
        role: "user",
        content: [
          {
            type: "text",
            text: `CRITICAL: Extract ONLY authentic data visible in this document image. NEVER use placeholders, generic values, or invented information.

Analyze this Portuguese invoice/receipt image carefully and extract ONLY actual information that is clearly visible in the document. If information is missing or illegible, leave fields empty and report extraction issues. Filename: ${filename}`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      });
    } else if (ocrText) {
      messages.push({
        role: "user",
        content: `CRITICAL: Extract ONLY authentic data from this document. NEVER use placeholders, generic values, or invented information.

Analyze this Portuguese invoice/receipt OCR text carefully and extract ONLY actual information that is clearly visible in the text. If information is missing or unclear, leave fields empty and report extraction issues.

Filename: ${filename}

OCR Text:
${ocrText.substring(0, 6000)}`,
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-2024-07-18",
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "invoice_extraction",
            strict: true,
            schema,
          },
        },
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error("Invalid OpenAI response structure");
    }

    const message = result.choices[0].message;

    // Check for refusal
    if (message.refusal) {
      throw new Error(`OpenAI refused to process: ${message.refusal}`);
    }

    try {
      const extracted: StructuredInvoiceExtraction = JSON.parse(
        message.content,
      );

      console.log("🤖 OpenAI Raw Response:", {
        vendor: extracted.vendor,
        nif: extracted.nif,
        nifCountry: extracted.nifCountry,
        vendorAddress: extracted.vendorAddress,
        vendorPhone: extracted.vendorPhone,
      });

      // Post-process NIF to ensure country prefix is present
      let processedNif = extracted.nif || "";
      let processedNifCountry = extracted.nifCountry || "";

      // If NIF doesn't have country prefix, try to detect and add it
      if (processedNif && !processedNif.match(/^[A-Z]{2}/)) {
        const vendor = extracted.vendor || "";
        if (
          vendor.includes("S.R.L.") ||
          vendor.includes("S.P.A.") ||
          vendor.includes(".IT")
        ) {
          processedNif = "IT" + processedNif;
          processedNifCountry = "IT";
        } else if (vendor.includes("S.A.") && !vendor.includes("S.A.R.L.")) {
          processedNif = "ES" + processedNif;
          processedNifCountry = "ES";
        } else if (vendor.includes("GmbH")) {
          processedNif = "DE" + processedNif;
          processedNifCountry = "DE";
        } else if (vendor.includes("SARL") || vendor.includes("S.A.R.L.")) {
          processedNif = "FR" + processedNif;
          processedNifCountry = "FR";
        } else if (vendor.includes("B.V.")) {
          processedNif = "NL" + processedNif;
          processedNifCountry = "NL";
        }
        console.log(
          `🔧 Enhanced NIF from "${extracted.nif}" to "${processedNif}" (Country: ${processedNifCountry})`,
        );
      }

      // Validate that no placeholder data is being returned - be more specific to avoid blocking legitimate names
      const placeholderPatterns = [
        "unknown vendor",
        "not provided",
        "n/a",
        "generic company",
        "placeholder",
        "default company",
        "address not provided",
        "phone not provided",
      ];
      const cleanData = {
        vendor: this.validateField(extracted.vendor, placeholderPatterns),
        nif: processedNif,
        nifCountry: processedNifCountry,
        vendorAddress: this.validateField(
          extracted.vendorAddress,
          placeholderPatterns,
        ),
        vendorPhone: this.validateField(
          extracted.vendorPhone,
          placeholderPatterns,
        ),
        invoiceNumber: this.validateField(
          extracted.invoiceNumber,
          placeholderPatterns,
        ),
        issueDate: extracted.issueDate,
        total: extracted.total,
        netAmount: extracted.netAmount,
        vatAmount: extracted.vatAmount,
        vatRate: extracted.vatRate,
        category: extracted.category,
        description: this.validateField(
          extracted.description,
          placeholderPatterns,
        ),
        paymentType: 'tarjeta', // Siempre tarjeta
      };

      return {
        data: cleanData,
        confidenceScore: extracted.confidence || 0.5,
        issues: extracted.extractionIssues || [],
        agentResults: {
          extractor: {
            model: imageUrl ? "gpt-4-vision-preview" : "gpt-4-turbo-preview",
            method: imageUrl
              ? "openai_vision_structured"
              : "openai_text_structured",
            rawResponse: message.content.substring(0, 200),
          },
        },
        processedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to parse structured OpenAI result: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
