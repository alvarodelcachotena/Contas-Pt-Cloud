import { GoogleGenerativeAI } from '@google/generative-ai'
import { MAIN_COMPANY_CONFIG, isMainCompany } from './main-company-config'

export interface InvoiceData {
    vendor_name: string
    vendor_nif: string
    vendor_address?: string
    invoice_number: string
    invoice_date: string
    due_date?: string
    subtotal: number
    vat_rate: number
    vat_amount: number
    total_amount: number
    category: string
    description: string
    line_items?: Array<{
        description: string
        quantity: number
        unit_price: number
        total: number
    }>
    payment_method?: string
    payment_type?: string
    receipt_number?: string
    number?: string
    client_name?: string
}

export interface ExpenseData {
    vendor: string
    vendor_nif?: string
    amount: number
    vat_amount: number
    vat_rate: number
    category: string
    description: string
    expense_date: string
    receipt_number?: string
    is_deductible: boolean
}

export interface DocumentAnalysisResult {
    document_type: 'invoice' | 'expense' | 'receipt' | 'other'
    confidence: number
    extracted_data: InvoiceData | ExpenseData | any
    raw_text?: string
    processing_notes: string[]
}

export class DocumentAIService {
    private genAI: GoogleGenerativeAI

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY
        console.log('🔧 Inicializando DocumentAIService con Gemini AI')
        console.log(`   API key configurada: ${apiKey ? '✅ Sí' : '❌ No'}`)
        if (apiKey) {
            console.log(`   Longitud: ${apiKey.length} caracteres`)
            console.log(`   Empieza con: ${apiKey.substring(0, 10)}...`)
            console.log(`   Termina con: ...${apiKey.substring(apiKey.length - 10)}`)
        }
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY no está configurada')
        }

        this.genAI = new GoogleGenerativeAI(apiKey)
    }

    async analyzeDocument(fileBuffer: Buffer, filename: string, mimeType?: string): Promise<DocumentAnalysisResult> {
        try {
            console.log(`🔍 Analizando documento con Gemini AI: ${filename}`)
            console.log(`📊 Tamaño del buffer: ${fileBuffer.length} bytes`)

            // Convertir buffer a base64
            const base64Data = fileBuffer.toString('base64')

            // Determinar el tipo MIME - usar el proporcionado o detectar por extensión
            const detectedMimeType = mimeType || this.getMimeType(filename)
            console.log(`📄 Tipo MIME detectado: ${detectedMimeType}`)
            console.log(`📄 MIME type proporcionado: ${mimeType || 'No proporcionado'}`)
            console.log(`📄 MIME type por extensión: ${this.getMimeType(filename)}`)

            // Crear el modelo Gemini
            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    temperature: 0.1,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 4096,
                }
            })

            // Preparar el prompt
            const prompt = this.getPrompt()

            // Crear la parte de la imagen/archivo
            const fileData = {
                inlineData: {
                    data: base64Data,
                    mimeType: detectedMimeType
                }
            }

            console.log(`🤖 Enviando documento a Gemini AI...`)

            // Generar contenido
            const result = await model.generateContent([prompt, fileData])
            const response = await result.response
            const text = response.text()

            console.log('✅ Respuesta de Gemini AI recibida')
            console.log(`📝 Longitud de respuesta: ${text.length} caracteres`)

            return this.processResponse(text)

        } catch (error) {
            console.error('❌ Error en análisis con Gemini AI:', error)
            if (error instanceof Error) {
                console.error('Mensaje:', error.message)
                console.error('Stack:', error.stack)
            }
            throw error
        }
    }

    private processResponse(text: string): DocumentAnalysisResult {
        try {
            console.log('🔄 Procesando respuesta de Gemini AI')

            // Intentar extraer JSON de la respuesta
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No se pudo extraer JSON de la respuesta de Gemini')
            }

            // Parsear el JSON
            const analysisResult: DocumentAnalysisResult = JSON.parse(jsonMatch[0])

            // Validar el resultado
            if (!analysisResult.document_type || !analysisResult.confidence) {
                throw new Error('Respuesta incompleta de Gemini AI')
            }

            // Validar y limpiar datos
            this.validateAndCleanData(analysisResult)

            console.log('✅ Respuesta procesada exitosamente:', {
                type: analysisResult.document_type,
                confidence: analysisResult.confidence
            })

            return analysisResult

        } catch (error) {
            console.error('❌ Error procesando respuesta:', error)
            throw new Error(`Error procesando respuesta de Gemini AI: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        }
    }

    private getPrompt(): string {
        return `
Analiza detalladamente este documento comercial (factura, recibo o gasto) y extrae TODOS los datos que encuentres.

INFORMACIÓN IMPORTANTE SOBRE LA EMPRESA PRINCIPAL:
- La empresa principal es: DIAMOND NXT TRADING LDA
- NIF de la empresa principal: 517124548
- Cuando encuentres DOS nombres/NIFs en el documento, SIEMPRE extrae los datos del OTRO (no de DIAMOND NXT TRADING LDA)

INSTRUCCIONES ESPECÍFICAS:
1. Busca y extrae TODOS los números que parezcan importes
2. Identifica específicamente el NIF/CIF/VAT number (suele empezar con letras como PT)
3. Busca la fecha (puede estar en varios formatos)
4. Encuentra el nombre del establecimiento/empresa (SIEMPRE el que NO sea DIAMOND NXT TRADING LDA)
5. Identifica si hay número de factura o recibo
6. Busca el desglose del IVA (normalmente 23%, 13% o 6% en Portugal)
7. Determina si es una factura formal ("Fatura") o un recibo simple ("Recibo")
8. TIPO DE PAGO (SIEMPRE TARJETA):
   - SIEMPRE usar payment_type: "card" (tarjeta) para todos los documentos
   - No importa qué método de pago aparezca en el documento
   
   IMPORTANTE: Analiza TODO el documento para encontrar indicaciones de pago. Busca en:
   - Texto que mencione métodos de pago
   - Logos de bancos o tarjetas
   - Referencias a transferencias o pagos con tarjeta
   - Cualquier indicación de cómo se realizó el pago

IMPORTANTE:
- NO INVENTES DATOS. Si no encuentras algo, déjalo vacío o null
- Busca el NIF en TODA la imagen (suele estar arriba o abajo)
- Los importes deben ser números (convierte strings a números)
- Si ves "Total", "Subtotal", "IVA" - EXTRÁELOS
- Extrae CUALQUIER texto que parezca relevante
- SIEMPRE extrae los datos del proveedor/cliente, NO de DIAMOND NXT TRADING LDA

Responde ÚNICAMENTE en este formato JSON exacto:
{
  "document_type": "invoice|expense|receipt|other",
  "confidence": 0.95,
  "extracted_data": {
    "vendor_name": "Nombre exacto del establecimiento (NO DIAMOND NXT TRADING LDA)",
    "vendor_nif": "Número fiscal encontrado (NO 517124548)",
    "invoice_number": "Número de factura si existe",
    "number": "Mismo número de factura",
    "invoice_date": "YYYY-MM-DD",
    "subtotal": 0.00,
    "vat_rate": 23,
    "vat_amount": 0.00,
    "total_amount": 0.00,
    "description": "Descripción de los productos/servicios",
    "category": "restaurante|transporte|oficina|otros",
    "payment_type": "card"
  },
  "processing_notes": ["Notas sobre lo encontrado o no encontrado"]
}

RECUERDA: Extrae TODOS los números y texto que veas en el documento. NO OMITAS INFORMACIÓN. SIEMPRE extrae los datos del OTRO proveedor/cliente, no de DIAMOND NXT TRADING LDA.`
    }

    private getMimeType(filename: string): string {
        const ext = filename.toLowerCase().split('.').pop()
        const mimeTypes: { [key: string]: string } = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff'
        }
        return mimeTypes[ext || ''] || 'application/pdf'
    }

    private validateAndCleanData(result: DocumentAnalysisResult) {
        // Validar tipo de documento
        if (!['invoice', 'expense', 'receipt', 'other'].includes(result.document_type)) {
            result.document_type = 'other'
        }

        // Validar confianza
        if (result.confidence < 0 || result.confidence > 1) {
            result.confidence = 0.5
        }

        // Validar que no se extraigan datos de la empresa principal
        this.validateNotMainCompany(result)

        // Limpiar datos según el tipo
        if (result.document_type === 'invoice') {
            const invoiceData = result.extracted_data as InvoiceData

            // Siempre establecer payment_type como card (tarjeta)
            console.log(`🔍 Estableciendo payment_type como card (tarjeta)`)
            invoiceData.payment_type = 'card'
            console.log(`✅ Payment type establecido como: ${invoiceData.payment_type}`)

            // Asegurar que los campos obligatorios existan
            if (!invoiceData.invoice_number) {
                const timestamp = new Date().getTime()
                invoiceData.invoice_number = `AUTO-${timestamp}`
                result.processing_notes.push('Se generó un número de factura automático')
            }

            if (!invoiceData.vendor_name) {
                invoiceData.vendor_name = 'Proveedor Desconocido'
                result.processing_notes.push('Nombre del proveedor no detectado')
            }

            // Limpiar NIF (solo números)
            if (invoiceData.vendor_nif && typeof invoiceData.vendor_nif === 'string') {
                invoiceData.vendor_nif = invoiceData.vendor_nif.replace(/\D/g, '')
            } else {
                invoiceData.vendor_nif = '000000000'
                result.processing_notes.push('NIF no detectado, se usó valor por defecto')
            }

            // Asegurar que los montos sean números válidos
            if (typeof invoiceData.subtotal === 'string') {
                const subtotalStr = invoiceData.subtotal as string
                invoiceData.subtotal = parseFloat(subtotalStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
            } else if (typeof invoiceData.subtotal !== 'number') {
                invoiceData.subtotal = 0
                result.processing_notes.push('Subtotal no detectado, se estableció en 0')
            }

            if (typeof invoiceData.vat_amount === 'string') {
                const vatAmountStr = invoiceData.vat_amount as string
                invoiceData.vat_amount = parseFloat(vatAmountStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
            } else if (typeof invoiceData.vat_amount !== 'number') {
                invoiceData.vat_amount = 0
                result.processing_notes.push('IVA no detectado, se estableció en 0')
            }

            if (typeof invoiceData.total_amount === 'string') {
                const totalAmountStr = invoiceData.total_amount as string
                invoiceData.total_amount = parseFloat(totalAmountStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
            } else if (typeof invoiceData.total_amount !== 'number') {
                invoiceData.total_amount = (invoiceData.subtotal || 0) + (invoiceData.vat_amount || 0)
                result.processing_notes.push('Total calculado automáticamente')
            }

            // Validar y asignar fechas
            if (!invoiceData.invoice_date || !this.isValidDate(invoiceData.invoice_date)) {
                invoiceData.invoice_date = new Date().toISOString().split('T')[0]
                result.processing_notes.push('Fecha de factura no detectada, se usó la fecha actual')
            }

            // Asegurar que existe una descripción
            if (!invoiceData.description) {
                invoiceData.description = 'Factura procesada automáticamente'
                result.processing_notes.push('Descripción no detectada')
            }

            // Asegurar que existe una categoría
            if (!invoiceData.category) {
                invoiceData.category = 'otros'
                result.processing_notes.push('Categoría no detectada')
            }
        }

        if (result.document_type === 'expense') {
            const expenseData = result.extracted_data as ExpenseData

            // Asegurar que existe un proveedor
            if (!expenseData.vendor) {
                expenseData.vendor = 'Proveedor Desconocido'
                result.processing_notes.push('Proveedor no detectado')
            }

            // Limpiar NIF
            if (expenseData.vendor_nif && typeof expenseData.vendor_nif === 'string') {
                expenseData.vendor_nif = expenseData.vendor_nif.replace(/\D/g, '')
            }

            // Asegurar que los montos sean números válidos
            if (typeof expenseData.amount === 'string') {
                const amountStr = expenseData.amount as string
                expenseData.amount = parseFloat(amountStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
            } else if (typeof expenseData.amount !== 'number') {
                expenseData.amount = 0
                result.processing_notes.push('Monto no detectado, se estableció en 0')
            }

            if (typeof expenseData.vat_amount === 'string') {
                const vatAmountStr = expenseData.vat_amount as string
                expenseData.vat_amount = parseFloat(vatAmountStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
            } else if (typeof expenseData.vat_amount !== 'number') {
                expenseData.vat_amount = 0
                result.processing_notes.push('IVA no detectado, se estableció en 0')
            }

            // Validar y asignar fecha
            if (!expenseData.expense_date || !this.isValidDate(expenseData.expense_date)) {
                expenseData.expense_date = new Date().toISOString().split('T')[0]
                result.processing_notes.push('Fecha no detectada, se usó la fecha actual')
            }

            // Asegurar que existe una descripción
            if (!expenseData.description) {
                expenseData.description = 'Gasto procesado automáticamente'
                result.processing_notes.push('Descripción no detectada')
            }

            // Asegurar que existe una categoría
            if (!expenseData.category) {
                expenseData.category = 'otros'
                result.processing_notes.push('Categoría no detectada')
            }

            // Establecer is_deductible por defecto
            if (typeof expenseData.is_deductible !== 'boolean') {
                expenseData.is_deductible = true
                result.processing_notes.push('Deducibilidad no especificada, se asumió deducible')
            }
        }

        // Log final del resultado validado
        console.log(`🔍 Resultado final después de validación:`, {
            document_type: result.document_type,
            payment_type: result.document_type === 'invoice' ? (result.extracted_data as InvoiceData).payment_type : 'N/A',
            extracted_data_keys: Object.keys(result.extracted_data)
        })
    }

    private isValidDate(dateString: string): boolean {
        const date = new Date(dateString)
        return date instanceof Date && !isNaN(date.getTime())
    }

    private validateNotMainCompany(result: DocumentAnalysisResult) {
        console.log('🔍 Validando que no se extraigan datos de la empresa principal...')

        // Verificar si se extrajeron datos de la empresa principal
        if (result.document_type === 'invoice') {
            const invoiceData = result.extracted_data as InvoiceData

            // Verificar si es la empresa principal
            if (isMainCompany(invoiceData.vendor_name, invoiceData.vendor_nif)) {
                console.log('⚠️ Detectados datos de empresa principal, corrigiendo...')
                console.log(`   Nombre detectado: ${invoiceData.vendor_name}`)
                console.log(`   NIF detectado: ${invoiceData.vendor_nif}`)

                invoiceData.vendor_name = 'Proveedor Desconocido'
                invoiceData.vendor_nif = '000000000'
                result.processing_notes.push('Datos de empresa principal detectados y corregidos')
            }
        }

        if (result.document_type === 'expense') {
            const expenseData = result.extracted_data as ExpenseData

            // Verificar si es la empresa principal
            if (isMainCompany(expenseData.vendor, expenseData.vendor_nif)) {
                console.log('⚠️ Detectados datos de empresa principal, corrigiendo...')
                console.log(`   Nombre detectado: ${expenseData.vendor}`)
                console.log(`   NIF detectado: ${expenseData.vendor_nif}`)

                expenseData.vendor = 'Proveedor Desconocido'
                expenseData.vendor_nif = '000000000'
                result.processing_notes.push('Datos de empresa principal detectados y corregidos')
            }
        }

        console.log('✅ Validación de empresa principal completada')
    }

    // Método para categorizar automáticamente gastos
    categorizeExpense(description: string, vendor: string): string {
        const desc = description.toLowerCase()
        const vendorLower = vendor.toLowerCase()

        // Restaurantes y comida
        if (desc.includes('restaurante') || desc.includes('comida') || desc.includes('almoço') ||
            desc.includes('jantar') || desc.includes('café') || vendorLower.includes('restaurante')) {
            return 'restaurante'
        }

        // Gasolina y transporte
        if (desc.includes('gasolina') || desc.includes('combustível') || desc.includes('estacionamento') ||
            vendorLower.includes('galp') || vendorLower.includes('bp') || vendorLower.includes('repsol')) {
            return 'transporte'
        }

        // Oficina y material
        if (desc.includes('papel') || desc.includes('caneta') || desc.includes('impressora') ||
            desc.includes('computador') || vendorLower.includes('staples') || vendorLower.includes('office')) {
            return 'oficina'
        }

        // Servicios profesionales
        if (desc.includes('advogado') || desc.includes('contabilista') || desc.includes('consultor') ||
            vendorLower.includes('advocacia') || vendorLower.includes('contabilidade')) {
            return 'serviços_profissionais'
        }

        // Por defecto
        return 'outros'
    }
}
