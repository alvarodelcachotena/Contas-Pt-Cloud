import { GoogleGenAI } from "@google/genai";
import { ExtractionResult, LineItem } from "../../shared/types";
import { TableParser } from "./TableParser";
import { ConsensusEngine } from "./ConsensusEngine";

export class AgentExtractorGemini {
  private genAI: GoogleGenAI;
  private tableParser: TableParser;
  private consensusEngine: ConsensusEngine;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.tableParser = new TableParser(apiKey);
    this.consensusEngine = new ConsensusEngine();
  }

  private validateField(value: string | undefined, placeholderPatterns: string[]): string {
    if (!value || value.trim() === '') {
      return '';
    }

    const lowerValue = value.toLowerCase();
    for (const pattern of placeholderPatterns) {
      if (lowerValue.includes(pattern)) {
        console.log(`🚫 Rejected placeholder data: "${value}" contains "${pattern}"`);
        return '';
      }
    }

    return value;
  }

  async extract(
    ocrText: string,
    filename: string = "",
  ): Promise<ExtractionResult> {
    const prompt = `
REGRA ABSOLUTA: NUNCA use valores genéricos, placeholders, ou dados inventados. Extraia APENAS dados reais visíveis no documento ou deixe campos vazios.

Extrai os seguintes campos de uma fatura/documento fiscal:

1. Nome da empresa emissora (ISSUER)
2. NIF/VAT completo com prefixo do país (PT123456789, IT12345678901, ES12345678A)
3. País do emissor (PT, IT, ES, DE, FR, etc.)
4. Endereço completo do emissor (rua, cidade, código postal, país)
5. Telefone do emissor (com código do país se disponível)
6. Data da fatura (formato YYYY-MM-DD)
7. Valor sem IVA
8. Valor do IVA
9. Valor total com IVA
10. Taxa de IVA (6, 13, ou 23 como porcentaje) - IMPORTANTE: 10% = 10, 23% = 23
11. Cliente/Destinatário
12. Número da fatura
13. Categoria (alimentacao|transporte|material_escritorio|servicos|combustivel|alojamento|outras_despesas)
14. Tipo de pago: SIEMPRE "tarjeta" (no importa qué método aparezca en el documento)

REGRAS CRÍTICAS PARA NIF/VAT EU - OBRIGATÓRIO ADICIONAR PREFIXO DO PAÍS:
- Portugal: PT + 9 dígitos (PT123456789)
- Itália: IT + 11 dígitos (IT12345678901) - EXEMPLO: "03424760134" → "IT03424760134"
- Espanha: NÃO adicionar prefixo ES automaticamente, manter formato original
- França: FR + 11 dígitos (FR12345678901)
- Alemanha: DE + 9 dígitos (DE123456789)
- Holanda: NL + 12 dígitos (NL123456789B12)
- Bélgica: BE + 10 dígitos (BE1234567890)
- Áustria: AT + 9 dígitos (ATU12345678)
- Polónia: PL + 10 dígitos (PL1234567890)
- República Checa: CZ + 8-10 dígitos (CZ12345678)
- Suécia: SE + 12 dígitos (SE123456789012)
- Dinamarca: DK + 8 dígitos (DK12345678)
- Finlândia: FI + 8 dígitos (FI12345678)
- Irlanda: IE + 8 caracteres (IE1234567A)
- Luxemburgo: LU + 8 dígitos (LU12345678)
- Grécia: EL + 9 dígitos (EL123456789)

DETECÇÃO AUTOMÁTICA DE PAÍS (OBRIGATÓRIO):
- Sufixos de empresa: .IT → Itália, .DE → Alemanha, .FR → França
- Tipos de empresa: S.R.L./S.P.A. → IT, GmbH → DE, SARL → FR, B.V. → NL
- Códigos postais: 00000-99999 → IT, 10000-99999 → DE
- Idiomas: alemão → DE, francês → FR, italiano → IT, holandês → NL
- Para empresas espanholas: NÃO adicionar prefixo ES automaticamente, manter formato original

INSTRUÇÕES CRÍTICAS PARA EXTRAÇÃO DE DADOS REAIS:
OBRIGATÓRIO: Extraia APENAS dados reais visíveis no documento. NUNCA use placeholders, dados genéricos, ou valores inventados.

1. Para nome do vendedor:
   - Procure no cabeçalho, logo, carimbos, ou assinatura do documento
   - Examine qualquer texto que indique "De:", "Emissor:", "Vendedor:", nome da empresa
   - Se estiver parcialmente visível, extraia exatamente o que conseguir ler
   - Se absolutamente impossível de determinar, deixe VAZIO e marque como problema de extração

2. Para valores monetários:
   - Procure números com símbolos €, $ ou palavras "Total", "Subtotal", "IVA", "VAT", "Líquido"
   - Examine tabelas de valores, linhas de resumo, totais finais
   - Verifique cálculos (ex: Líquido + IVA = Total)
   - Se valores não estão claramente visíveis, deixe como 0 e reporte o problema

3. Para datas:
   - Procure formatos DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
   - Examine cabeçalhos, rodapés, campos de data específicos
   - Procure por "Data:", "Date:", "Emitido em:", "Fatura de:", timestamps
   - NUNCA invente datas - se não encontrar, deixe vazio e reporte o problema

4. Para NIF/VAT ID:
   - Procure números longos (8-12 dígitos) próximos a "NIF", "VAT", "Tax ID", "CIF", "NIPT"
   - Examine blocos de informações da empresa, cabeçalhos, rodapés
   - Se encontrar número sem prefixo do país, detecte o país pelo contexto da empresa
   - NUNCA invente NIFs - se não encontrar, deixe vazio e reporte como problema

5. Para endereços e telefones:
   - Extraia APENAS informações claramente visíveis no documento
   - Se parcialmente legível, extraia o que conseguir ler
   - Se não conseguir ler, deixe vazio - NÃO invente informações

REGRAS DE CONFIANÇA BASEADAS EM DADOS REAIS:
- Alta confiança (0.8-1.0): Todos os dados principais claramente extraídos do documento
- Média confiança (0.5-0.79): Maioria dos dados extraídos, alguns campos em branco por não serem legíveis
- Baixa confiança (0.1-0.49): Poucos dados extraídos, documento de má qualidade ou ilegível

Texto OCR:
${ocrText.substring(0, 4000)}

Nome do ficheiro: ${filename}

Responde APENAS em formato JSON válido:
{
  "vendor": "nome da empresa",
  "nif": "NIF/VAT completo com prefixo do país",
  "nifCountry": "código do país (PT, IT, ES, etc.)",
  "vendorAddress": "endereço completo do emissor",
  "vendorPhone": "telefone do emissor",
  "invoiceNumber": "número da fatura",
  "issueDate": "YYYY-MM-DD",
  "total": valor_total_numerico,
  "netAmount": valor_sem_iva_numerico,
  "vatAmount": valor_iva_numerico,
  "vatRate": taxa_iva_como_porcentaje (ejemplo: 10% = 10, 23% = 23),
  "category": "categoria",
  "description": "descrição breve",
  "paymentType": "tarjeta",
  "confidence": valor_confianca,
  "extractionIssues": ["lista de problemas encontrados"]
}
`;

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ text: prompt }]
      });
      const textResponse = response.text || "";

      // Clean the response to extract JSON
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const extracted = JSON.parse(jsonMatch[0]);

      console.log('🤖 Gemini Raw Response:', {
        vendor: extracted.vendor,
        nif: extracted.nif,
        nifCountry: extracted.nifCountry,
        vendorAddress: extracted.vendorAddress,
        vendorPhone: extracted.vendorPhone,
        total: extracted.total,
        netAmount: extracted.netAmount,
        vatAmount: extracted.vatAmount,
        vatRate: extracted.vatRate,
        issueDate: extracted.issueDate,
        invoiceNumber: extracted.invoiceNumber
      });

      // Post-process NIF to ensure country prefix is present
      let processedNif = extracted.nif || '';
      let processedNifCountry = extracted.nifCountry || '';

      // Keep NIF exactly as extracted by AI without any automatic prefix addition
      // This prevents unwanted prefixes like "ES" being added to Spanish NIFs
      console.log(`🔧 NIF kept as extracted: "${extracted.nif}" → "${processedNif}"`);

      // Only set country if NIF already has a prefix
      if (processedNif.match(/^[A-Z]{2}/)) {
        processedNifCountry = processedNif.substring(0, 2);
      }

      // Validate that no placeholder data is being returned - be more specific to avoid blocking legitimate names
      const placeholderPatterns = ['unknown vendor', 'not provided', 'n/a', 'generic company', 'placeholder', 'default company', 'desconhecido', 'não fornecido', 'address not provided', 'phone not provided'];
      const cleanData = {
        vendor: this.validateField(extracted.vendor, placeholderPatterns),
        nif: processedNif,
        nifCountry: processedNifCountry,
        vendorAddress: this.validateField(extracted.vendorAddress, placeholderPatterns),
        vendorPhone: this.validateField(extracted.vendorPhone, placeholderPatterns),
        invoiceNumber: this.validateField(extracted.invoiceNumber, placeholderPatterns),
        issueDate: extracted.issueDate,
        total: parseFloat(extracted.total) || 0,
        netAmount: parseFloat(extracted.netAmount) || 0,
        vatAmount: parseFloat(extracted.vatAmount) || 0,
        vatRate: (parseFloat(extracted.vatRate) || 0) / 100, // Convertir porcentaje a decimal
        category: extracted.category,
        description: this.validateField(extracted.description, placeholderPatterns),
        paymentType: 'tarjeta', // Siempre tarjeta
      };

      // Track field-level provenance with detailed metadata
      const provenance: { [field: string]: any } = {};
      const timestamp = new Date();

      for (const [field, value] of Object.entries(cleanData)) {
        provenance[field] = {
          model: "gemini-1.5-pro",
          confidence: value ? 0.85 : 0.3,
          method: "genai_api",
          timestamp: timestamp,
          rawValue: String(value || ''),
          processingTime: 0, // Will be calculated by the calling function
          modelVersion: "2.5-flash",
          extractionContext: {
            pageNumber: 1,
            ocrConfidence: 0.9,
            boundingBox: null // Not available for text extraction
          }
        };
      }

      return {
        data: {
          ...cleanData,
          lineItems: [], // Will be populated by table parser
        },
        confidenceScore: extracted.confidence || 0.5,
        issues: extracted.extractionIssues || [],
        agentResults: {
          extractor: {
            model: "gemini-2.5-flash",
            method: "genai_api",
            rawResponse: textResponse.substring(0, 200),
            provenance: provenance,
          },
        },
        processedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to process with Gemini: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async extractFromPDF(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<ExtractionResult> {
    try {
      // First extract tables and line items
      const tableResult = await this.tableParser.extractTables(fileBuffer, "application/pdf", filename);

      // Then extract header/metadata information
      const baseResult = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: fileBuffer.toString("base64"),
            },
          },
          { text: this.buildPDFExtractionPrompt() }
        ],
      });

      const textResponse = baseResult.text || "";
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const extracted = JSON.parse(jsonMatch[0]);

      // Process NIF and clean data as before
      let processedNif = extracted.nif || '';
      let nifCountry = '';

      if (processedNif && !processedNif.match(/^[A-Z]{2}/)) {
        const vendor = extracted.vendor || '';

        // Auto-detect country based on business patterns
        if (vendor.includes('S.R.L.') || vendor.includes('S.P.A.') || vendor.includes('.IT')) {
          processedNif = 'IT' + processedNif;
          nifCountry = 'IT';
          // For Spanish companies, don't automatically add ES prefix
          // Let the AI extract the correct format
        }
        // Keep NIF exactly as extracted by AI without any automatic prefix addition
        // This prevents unwanted prefixes like "ES" being added to Spanish NIFs
        console.log(`🔧 NIF kept as extracted: "${extracted.nif}" → "${processedNif}"`);
      } else if (processedNif.match(/^[A-Z]{2}/)) {
        nifCountry = processedNif.substring(0, 2);
      }

      // Validate and clean the data
      const placeholderPatterns = ['unknown vendor', 'not provided', 'n/a', 'generic company', 'placeholder', 'default company', 'desconhecido', 'não fornecido'];
      const cleanData = {
        vendor: this.validateField(extracted.vendor, placeholderPatterns),
        nif: processedNif,
        nifCountry: nifCountry,
        vendorAddress: '',
        vendorPhone: '',
        invoiceNumber: this.validateField(extracted.invoiceNumber, placeholderPatterns),
        issueDate: extracted.issueDate || '',
        total: parseFloat(extracted.total) || 0,
        netAmount: parseFloat(extracted.netAmount) || 0,
        vatAmount: parseFloat(extracted.vatAmount) || 0,
        vatRate: (parseFloat(extracted.vatRate) || 0) / 100, // Convertir porcentaje a decimal
        category: extracted.category || "outras_despesas",
        description: this.validateField(extracted.description, placeholderPatterns),
        paymentType: 'tarjeta', // Siempre tarjeta
        lineItems: tableResult.lineItems || [],
      };

      // Create separate extractions for consensus processing
      const baseExtraction: ExtractionResult = {
        data: { ...cleanData, lineItems: [] },
        confidenceScore: extracted.confidence || 0.5,
        issues: extracted.extractionIssues || [],
        agentResults: {
          extractor: {
            model: "gemini-2.5-flash",
            method: "genai_pdf_vision",
            rawResponse: textResponse.substring(0, 200),
            provenance: this.buildProvenance(cleanData, "genai_pdf_vision", 0.85),
          },
        },
        processedAt: new Date(),
      };

      const tableExtraction: ExtractionResult = {
        data: { ...cleanData, lineItems: tableResult.lineItems },
        confidenceScore: tableResult.tableConfidence,
        issues: tableResult.extractionIssues,
        agentResults: {
          extractor: {
            model: "gemini-2.5-flash",
            method: "genai_table_vision",
            rawResponse: "Table extraction result",
            provenance: this.buildProvenance(cleanData, "genai_table_vision", tableResult.tableConfidence),
          },
        },
        processedAt: new Date(),
      };

      // Use consensus engine to merge results
      return this.consensusEngine.processResults([baseExtraction, tableExtraction]);

    } catch (error: unknown) {
      throw new Error(
        `Failed to process PDF with Gemini: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private buildPDFExtractionPrompt(): string {
    return `
Analyze this document and extract key invoice information.

CRITICAL RULES:
1. Extract ONLY data clearly visible in the document
2. Never use placeholder or generic data
3. Leave fields empty if not found
4. Be precise with numbers and amounts

REQUIRED FIELDS:
1. Vendor name
2. Tax ID/NIF (with country prefix)
3. Invoice date (YYYY-MM-DD)
4. Net amount (without VAT)
5. VAT amount
6. Total amount (with VAT)
7. VAT rate (as decimal)
8. Invoice number
9. Category
10. Description

Return ONLY valid JSON:
{
  "vendor": "company name",
  "nif": "tax ID with country prefix",
  "invoiceNumber": "number if visible",
  "issueDate": "YYYY-MM-DD",
  "total": 0.00,
  "netAmount": 0.00,
  "vatAmount": 0.00,
  "vatRate": 0.23,
  "category": "category",
  "description": "brief description",
  "confidence": 0.9,
  "extractionIssues": []
}`;
  }

  async extractFromImage(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<ExtractionResult> {
    try {
      // First extract tables and line items
      const tableResult = await this.tableParser.extractTables(fileBuffer, mimeType, filename);

      // Then extract header/metadata information using existing image prompt
      const baseResult = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { text: this.buildImageExtractionPrompt() },
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBuffer.toString("base64"),
            },
          },
        ],
      });

      const textResponse = baseResult.text || "";
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const extracted = JSON.parse(jsonMatch[0]);

      // Validate and clean the data
      const placeholderPatterns = ['unknown vendor', 'not provided', 'n/a', 'generic company', 'placeholder', 'default company', 'desconhecido', 'não fornecido'];
      const cleanData = {
        vendor: this.validateField(extracted.vendor, placeholderPatterns),
        nif: extracted.nif || '',
        nifCountry: extracted.nif ? extracted.nif.substring(0, 2) : '',
        vendorAddress: '',
        vendorPhone: '',
        invoiceNumber: this.validateField(extracted.invoiceNumber, placeholderPatterns),
        issueDate: extracted.issueDate || '',
        total: parseFloat(extracted.total) || 0,
        netAmount: parseFloat(extracted.netAmount) || 0,
        vatAmount: parseFloat(extracted.vatAmount) || 0,
        vatRate: (parseFloat(extracted.vatRate) || 0) / 100, // Convertir porcentaje a decimal
        category: extracted.category || "outras_despesas",
        description: this.validateField(extracted.description, placeholderPatterns),
        paymentType: 'tarjeta', // Siempre tarjeta
        lineItems: tableResult.lineItems || [],
      };

      // Track field-level provenance
      const provenance: { [field: string]: any } = {};
      for (const [field, value] of Object.entries(cleanData)) {
        if (field === 'lineItems') {
          provenance[field] = {
            model: "gemini-2.5-flash",
            confidence: tableResult.tableConfidence,
            method: "genai_table_vision"
          };
        } else {
          provenance[field] = {
            model: "gemini-2.5-flash",
            confidence: value ? 0.8 : 0.3,
            method: "genai_image_vision"
          };
        }
      }

      return {
        data: cleanData,
        confidenceScore: Math.min(extracted.confidence || 0.7, tableResult.tableConfidence),
        issues: [...(extracted.extractionIssues || []), ...tableResult.extractionIssues],
        agentResults: {
          extractor: {
            model: "gemini-2.5-flash",
            method: "genai_image_vision",
            rawResponse: textResponse.substring(0, 200),
            provenance: provenance,
          },
        },
        processedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to process image with Gemini: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private buildImageExtractionPrompt(): string {
    return `
Look at this invoice/receipt image carefully and extract the visible information.

STRICT RULES:
- Extract ONLY data clearly visible in the image
- If you cannot read a field clearly, leave it empty ("")
- Never use placeholder or generic data
- Be precise with numbers and amounts

EUROPEAN VAT/NIF FORMAT:
- Portugal: PT123456789 (PT + 9 digits)
- Spain: ES12345678A (ES + 8 digits + letter)
- Italy: IT12345678901 (IT + 11 digits)
- France: FR12345678901 (FR + 11 digits)
- Germany: DE123456789 (DE + 9 digits)

EXPENSE CATEGORIES:
- combustivel: Fuel, gas stations
- refeicoes: Restaurants, food
- deslocacoes: Transport, travel
- material: Office supplies
- servicos: Professional services
- outras_despesas: Other expenses

Look for these fields:
1. Company name (usually at top)
2. Tax ID/NIF/VAT number
3. Invoice date 
4. Net amount (without VAT)
5. VAT amount
6. Total amount (with VAT)
7. VAT rate (as decimal: 0.23 = 23%)
8. Invoice number
9. Category based on business type
10. Brief description of items/services

Return ONLY valid JSON without markdown:
{
  "vendor": "exact company name from image",
  "nif": "tax ID with country prefix if visible",
  "invoiceNumber": "invoice number if visible",
  "issueDate": "YYYY-MM-DD if visible",
  "total": 0.00,
  "netAmount": 0.00,
  "vatAmount": 0.00,
  "vatRate": 0.23,
  "category": "appropriate category",
  "description": "brief description",
  "confidence": 0.8,
  "extractionIssues": []
}`;
  }

  private buildProvenance(
    data: any,
    method: string,
    baseConfidence: number
  ): { [field: string]: any } {
    const provenance: { [field: string]: any } = {};
    const timestamp = new Date();

    for (const [field, value] of Object.entries(data)) {
      provenance[field] = {
        model: "gemini-1.5-pro",
        confidence: value ? baseConfidence : 0.3,
        method: method,
        timestamp: timestamp,
        rawValue: String(value || ''),
        processingTime: 0, // Will be calculated by the calling function
        modelVersion: "2.5-flash",
        extractionContext: {
          pageNumber: 1,
          ocrConfidence: method.includes('vision') ? 0.85 : 0.9,
          boundingBox: method.includes('vision') ? {
            x: 0,
            y: 0,
            width: 100,
            height: 100
          } : null
        }
      };
    }

    return provenance;
  }
}
