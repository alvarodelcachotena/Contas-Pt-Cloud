import { GoogleGenerativeAI } from '@google/generative-ai'

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
    receipt_number?: string
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

export class GeminiAIService {
    private genAI: GoogleGenerativeAI
    private model: any

    constructor() {
        const apiKey = process.env.GEMINI_AI_API_KEY
        if (!apiKey) {
            throw new Error('GEMINI_AI_API_KEY no está configurada')
        }

        this.genAI = new GoogleGenerativeAI(apiKey)
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    }

    async analyzeDocument(imageBuffer: Buffer, filename: string): Promise<DocumentAnalysisResult> {
        try {
            console.log(`🔍 Analizando documento: ${filename}`)

            // Convertir buffer a base64 para Gemini
            const base64Image = imageBuffer.toString('base64')

            // Prompt específico para facturas portuguesas
            const prompt = `
        Analiza esta imagen de un documento comercial (factura, recibo, etc.) y extrae toda la información relevante.
        
        Si es una factura, extrae:
        - Nombre del vendedor/proveedor
        - NIF del vendedor (número fiscal portugués)
        - Dirección del vendedor
        - Número de factura
        - Fecha de factura
        - Fecha de vencimiento (si existe)
        - Subtotal (sin IVA)
        - Porcentaje de IVA
        - Monto de IVA
        - Monto total
        - Descripción de los productos/servicios
        - Categoría (restaurante, oficina, transporte, etc.)
        
        Si es un recibo o gasto, extrae:
        - Nombre del establecimiento
        - NIF del establecimiento
        - Monto total
        - Porcentaje de IVA
        - Monto de IVA
        - Categoría
        - Descripción
        - Fecha
        
        Responde en formato JSON válido con esta estructura:
        {
          "document_type": "invoice|expense|receipt|other",
          "confidence": 0.95,
          "extracted_data": {
            // Los datos extraídos según el tipo de documento
          },
          "processing_notes": ["Notas sobre el procesamiento"]
        }
        
        IMPORTANTE: 
        - Los montos deben ser números (no strings)
        - Las fechas en formato YYYY-MM-DD
        - El NIF debe ser solo números
        - La categoría debe ser específica (ej: "restaurante", "gasolina", "oficina")
        - Responde SOLO con el JSON, sin texto adicional
      `

            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: this.getMimeType(filename)
                    }
                }
            ])

            const response = await result.response
            const text = response.text()

            console.log(`📋 Respuesta de Gemini:`, text)

            // Extraer JSON de la respuesta
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No se pudo extraer JSON de la respuesta de Gemini')
            }

            const analysisResult: DocumentAnalysisResult = JSON.parse(jsonMatch[0])

            // Validar y limpiar los datos
            this.validateAndCleanData(analysisResult)

            console.log(`✅ Análisis completado: ${analysisResult.document_type}`)
            return analysisResult

        } catch (error) {
            console.error('❌ Error en análisis de Gemini:', error)
            throw error
        }
    }

    private getMimeType(filename: string): string {
        const ext = filename.toLowerCase().split('.').pop()
        const mimeTypes: { [key: string]: string } = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        }
        return mimeTypes[ext || ''] || 'image/jpeg'
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

        // Limpiar datos según el tipo
        if (result.document_type === 'invoice') {
            const invoiceData = result.extracted_data as InvoiceData

            // Asegurar que los campos obligatorios existan
            if (!invoiceData.invoice_number) {
                // Generar un número de factura temporal si no existe
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
                // Si no hay total, intentar calcularlo del subtotal + IVA
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
    }

    private isValidDate(dateString: string): boolean {
        const date = new Date(dateString)
        return date instanceof Date && !isNaN(date.getTime())
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
