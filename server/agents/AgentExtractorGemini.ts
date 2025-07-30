import { GoogleGenAI } from "@google/genai";
import { ExtractionResult } from "../../shared/types";

export class AgentExtractorGemini {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
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
10. Taxa de IVA (6%, 13%, ou 23%)
11. Cliente/Destinatário
12. Número da fatura
13. Categoria (alimentacao|transporte|material_escritorio|servicos|combustivel|alojamento|outras_despesas)

REGRAS CRÍTICAS PARA NIF/VAT EU - OBRIGATÓRIO ADICIONAR PREFIXO DO PAÍS:
- Portugal: PT + 9 dígitos (PT123456789)
- Itália: IT + 11 dígitos (IT12345678901) - EXEMPLO: "03424760134" → "IT03424760134"
- Espanha: ES + 8 dígitos + 1 letra (ES12345678A)
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
- Sufixos de empresa: .IT → Itália, .ES → Espanha, .DE → Alemanha, .FR → França
- Tipos de empresa: S.R.L./S.P.A. → IT, S.A. → ES, GmbH → DE, SARL → FR, B.V. → NL
- Códigos postais: 00000-99999 → IT, 28000-48999 → ES, 10000-99999 → DE
- Idiomas: alemão → DE, francês → FR, italiano → IT, holandês → NL
- NUNCA extrair NIF/VAT sem prefixo do país

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
  "vatRate": taxa_iva_decimal,
  "category": "categoria",
  "description": "descrição breve",
  "confidence": valor_confianca,
  "extractionIssues": ["lista de problemas encontrados"]
}
`;

    try {
      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: prompt }],
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
      
      // If NIF doesn't have country prefix, try to detect and add it
      if (processedNif && !processedNif.match(/^[A-Z]{2}/)) {
        const vendor = extracted.vendor || '';
        if (vendor.includes('S.R.L.') || vendor.includes('S.P.A.') || vendor.includes('.IT')) {
          processedNif = 'IT' + processedNif;
          processedNifCountry = 'IT';
        } else if (vendor.includes('S.A.') && !vendor.includes('S.A.R.L.')) {
          processedNif = 'ES' + processedNif;
          processedNifCountry = 'ES';
        } else if (vendor.includes('GmbH')) {
          processedNif = 'DE' + processedNif;
          processedNifCountry = 'DE';
        } else if (vendor.includes('SARL') || vendor.includes('S.A.R.L.')) {
          processedNif = 'FR' + processedNif;
          processedNifCountry = 'FR';
        } else if (vendor.includes('B.V.')) {
          processedNif = 'NL' + processedNif;
          processedNifCountry = 'NL';
        }
        console.log(`🔧 Enhanced NIF from "${extracted.nif}" to "${processedNif}" (Country: ${processedNifCountry})`);
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
        vatRate: parseFloat(extracted.vatRate) || 0,
        category: extracted.category,
        description: this.validateField(extracted.description, placeholderPatterns),
      };

      return {
        data: cleanData,
        confidenceScore: extracted.confidence || 0.5,
        issues: extracted.extractionIssues || [],
        agentResults: {
          extractor: {
            model: "gemini-2.5-flash",
            method: "genai_api",
            rawResponse: textResponse.substring(0, 200),
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
    const prompt = `
Analisa este documento financeiro (fatura/recibo) em PDF e extrai os seguintes campos:

REGRAS DE EXTRAÇÃO DE NIF/VAT ID EUROPEU - TODOS OS PAÍSES:
- Portugal: PT + 9 dígitos (PT123456789)
- Itália: IT + 11 dígitos (IT12345678901) - EXEMPLO: "03424760134" → "IT03424760134"
- Espanha: ES + 8 dígitos + 1 letra (ES12345678A)
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
- Hungria: HU + 8 dígitos (HU12345678)
- Eslováquia: SK + 10 dígitos (SK1234567890)
- Eslovénia: SI + 8 dígitos (SI12345678)
- Bulgária: BG + 9-10 dígitos (BG123456789)
- Roménia: RO + 2-10 dígitos (RO12345678)
- Croácia: HR + 11 dígitos (HR12345678901)
- Chipre: CY + 9 caracteres (CY12345678A)
- Malta: MT + 8 dígitos (MT12345678)
- Lituânia: LT + 9-12 dígitos (LT123456789)
- Letónia: LV + 11 dígitos (LV12345678901)
- Estónia: EE + 9 dígitos (EE123456789)
DETECÇÃO AUTOMÁTICA DE PAÍS:
- Formas jurídicas: S.R.L./S.P.A. → IT, S.A. → ES, GmbH → DE, SARL → FR, B.V. → NL, AB/AG → SE, ApS/A/S → DK
- Domínios: .IT → Itália, .ES → Espanha, .DE → Alemanha, .FR → França, .NL → Holanda
- Códigos postais e contexto do endereço
- SEMPRE extrair com prefixo do país correto

CAMPOS OBRIGATÓRIOS:
1. Nome da empresa emissora
2. NIF/VAT ID com prefixo do país
3. Data da fatura (formato YYYY-MM-DD)
4. Valor sem IVA/VAT
5. Valor do IVA/VAT
6. Valor total com IVA/VAT
7. Taxa de IVA/VAT (como decimal: 0.23 para 23%)
8. Número da fatura
9. Categoria de despesa
10. Descrição dos produtos/serviços

Responde APENAS em formato JSON válido SEM markdown ou código:
{
  "vendor": "nome da empresa",
  "nif": "NIF com prefixo do país (ex: IT03424760134)", 
  "invoiceNumber": "número da fatura",
  "issueDate": "YYYY-MM-DD",
  "total": 0.00,
  "netAmount": 0.00,
  "vatAmount": 0.00,
  "vatRate": 0.23,
  "category": "outras_despesas",
  "description": "descrição breve"
}
`;

    try {
      const base64Data = fileBuffer.toString("base64");

      const contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },
      ];

      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents
      });

      const textResponse = response.text || "";

      // Enhanced JSON extraction to handle various response formats
      let jsonText = textResponse.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');
      jsonText = jsonText.replace(/^```\s*/gi, '').replace(/```\s*$/gi, '');
      
      // Find JSON object boundaries
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        // Check if Gemini doesn't support PDF processing
        if (textResponse.includes('lack the capability') || textResponse.includes('cannot process') || textResponse.includes('unable to process')) {
          throw new Error('Gemini does not support PDF processing');
        }
        
        throw new Error("No JSON found in response");
      }

      const jsonStr = jsonText.substring(firstBrace, lastBrace + 1);
      
      let extracted;
      try {
        extracted = JSON.parse(jsonStr);
      } catch (parseError) {
        // Try to fix common JSON issues
        let fixedJson = jsonStr
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Add quotes to unquoted keys
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
        
        try {
          extracted = JSON.parse(fixedJson);
        } catch (secondError) {
          console.log('JSON parse error:', parseError);
          console.log('Attempted to parse:', jsonStr.substring(0, 200));
          throw new Error("Invalid JSON in response");
        }
      }

      // Enhanced NIF processing for all EU countries
      let processedNif = extracted.nif || '';
      let nifCountry = '';
      
      // Post-process NIF to ensure country prefix is present
      if (processedNif && !processedNif.match(/^[A-Z]{2}/)) {
        const vendor = extracted.vendor || '';
        
        // Auto-detect country based on business patterns
        if (vendor.includes('S.R.L.') || vendor.includes('S.P.A.') || vendor.includes('.IT')) {
          processedNif = 'IT' + processedNif;
          nifCountry = 'IT';
        } else if (vendor.includes('S.A.') && !vendor.includes('S.A.R.L.')) {
          processedNif = 'ES' + processedNif;
          nifCountry = 'ES';
        } else if (vendor.includes('GmbH') || vendor.includes('.DE')) {
          processedNif = 'DE' + processedNif;
          nifCountry = 'DE';
        } else if (vendor.includes('SARL') || vendor.includes('S.A.R.L.') || vendor.includes('.FR')) {
          processedNif = 'FR' + processedNif;
          nifCountry = 'FR';
        } else if (vendor.includes('B.V.') || vendor.includes('.NL')) {
          processedNif = 'NL' + processedNif;
          nifCountry = 'NL';
        } else if (vendor.includes('AB') || vendor.includes('AG') || vendor.includes('.SE')) {
          processedNif = 'SE' + processedNif;
          nifCountry = 'SE';
        } else if (vendor.includes('ApS') || vendor.includes('A/S') || vendor.includes('.DK')) {
          processedNif = 'DK' + processedNif;
          nifCountry = 'DK';
        } else if (vendor.includes('Oy') || vendor.includes('.FI')) {
          processedNif = 'FI' + processedNif;
          nifCountry = 'FI';
        } else if (vendor.includes('Sp.') || vendor.includes('.PL')) {
          processedNif = 'PL' + processedNif;
          nifCountry = 'PL';
        } else if (vendor.includes('s.r.o.') || vendor.includes('.CZ')) {
          processedNif = 'CZ' + processedNif;
          nifCountry = 'CZ';
        } else if (vendor.includes('.AT')) {
          processedNif = 'AT' + processedNif;
          nifCountry = 'AT';
        } else if (vendor.includes('.BE')) {
          processedNif = 'BE' + processedNif;
          nifCountry = 'BE';
        }
        
        console.log(`🔧 Enhanced NIF processing: "${extracted.nif}" → "${processedNif}" (${nifCountry})`);
      } else if (processedNif.match(/^[A-Z]{2}/)) {
        nifCountry = processedNif.substring(0, 2);
      }

      // Validate that no placeholder data is being returned - be more specific to avoid blocking legitimate names
      const placeholderPatterns = ['unknown vendor', 'not provided', 'n/a', 'generic company', 'placeholder', 'default company', 'desconhecido', 'não fornecido', 'address not provided', 'phone not provided'];
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
        vatRate: parseFloat(extracted.vatRate) || 0,
        category: extracted.category || "outras_despesas",
        description: this.validateField(extracted.description, placeholderPatterns),
      };

      return {
        data: cleanData,
        confidenceScore: extracted.confidence || 0.1,
        issues: extracted.extractionIssues || [],
        agentResults: {
          extractor: {
            model: "gemini-2.5-flash",
            method: "genai_pdf_vision",
            rawResponse: textResponse.substring(0, 200),
          },
        },
        processedAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to process PDF with Gemini: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async extractFromImage(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<ExtractionResult> {
    const prompt = `
Analisa esta imagem de documento financeiro (fatura/recibo) e extrai os seguintes campos:

REGRAS DE EXTRAÇÃO DE NIF/VAT ID EUROPEU:
- Portugal: PT + 9 dígitos (PT123456789)
- Itália: IT + 11 dígitos (IT12345678901) 
- Espanha: ES + 8 dígitos + 1 letra (ES12345678A)
- França: FR + 11 dígitos (FR12345678901)
- Alemanha: DE + 9 dígitos (DE123456789)
- Outros países europeus: código país + número VAT

CAMPOS OBRIGATÓRIOS:
1. Nome da empresa emissora
2. NIF/VAT ID com prefixo do país
3. Data da fatura (formato YYYY-MM-DD)
4. Valor sem IVA/VAT
5. Valor do IVA/VAT
6. Valor total com IVA/VAT
7. Taxa de IVA/VAT (como decimal: 0.23 para 23%)
8. Número da fatura
9. Categoria de despesa
10. Descrição dos produtos/serviços

Responde APENAS em formato JSON válido SEM markdown ou código:
{
  "vendor": "nome da empresa",
  "nif": "NIF com prefixo do país (ex: IT03424760134)", 
  "invoiceNumber": "número da fatura",
  "issueDate": "YYYY-MM-DD",
  "total": 0.00,
  "netAmount": 0.00,
  "vatAmount": 0.00,
  "vatRate": 0.23,
  "category": "outras_despesas",
  "description": "descrição breve"
}
`;

    try {
      const base64Data = fileBuffer.toString("base64");

      const contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
      ];

      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents
      });

      const textResponse = response.text || "";

      // Enhanced JSON extraction to handle various response formats
      let jsonText = textResponse.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');
      jsonText = jsonText.replace(/^```\s*/gi, '').replace(/```\s*$/gi, '');
      
      // Find JSON object boundaries
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        throw new Error("No JSON found in response");
      }

      const jsonStr = jsonText.substring(firstBrace, lastBrace + 1);
      
      let extracted;
      try {
        extracted = JSON.parse(jsonStr);
      } catch (parseError) {
        // Try to fix common JSON issues
        let fixedJson = jsonStr
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Add quotes to unquoted keys
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
        
        try {
          extracted = JSON.parse(fixedJson);
        } catch (secondError) {
          console.log('JSON parse error:', parseError);
          console.log('Attempted to parse:', jsonStr.substring(0, 200));
          throw new Error("Invalid JSON in response");
        }
      }

      // Validate that no placeholder data is being returned
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
        vatRate: parseFloat(extracted.vatRate) || 0,
        category: extracted.category || "outras_despesas",
        description: this.validateField(extracted.description, placeholderPatterns),
      };

      return {
        data: cleanData,
        confidenceScore: extracted.confidence || 0.7,
        issues: extracted.extractionIssues || [],
        agentResults: {
          extractor: {
            model: "gemini-2.5-flash",
            method: "genai_image_vision",
            rawResponse: textResponse.substring(0, 200),
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
}
