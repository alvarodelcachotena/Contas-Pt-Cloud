import OpenAI from 'openai'

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
    private openai: OpenAI

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY

        // Debug logging
        console.log('🔍 Verificando API key...')
        console.log('API key definida:', !!apiKey)
        if (apiKey) {
            console.log('Longitud de API key:', apiKey.length)
            console.log('Primeros 12 caracteres:', apiKey.substring(0, 12))
            console.log('Últimos 4 caracteres:', apiKey.substring(apiKey.length - 4))
        }

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY no está configurada')
        }

        // Limpiar la API key por si acaso
        const cleanApiKey = apiKey.trim()

        this.openai = new OpenAI({
            apiKey: cleanApiKey
        })
    }

    async analyzeDocument(imageBuffer: Buffer, filename: string): Promise<DocumentAnalysisResult> {
        try {
            console.log(`🔍 Analizando documento: ${filename}`)

            // Test de conexión antes de procesar la imagen
            try {
                console.log('🔄 Verificando conexión con OpenAI...')
                const testResponse = await this.openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [{ role: "user", content: "Test connection" }],
                    max_tokens: 5
                })
                console.log('✅ Conexión verificada')
            } catch (testError) {
                if (testError instanceof Error) {
                    console.error('❌ Error en test de conexión:', testError)
                    throw new Error(`Error de conexión: ${testError.message}`)
                } else {
                    console.error('❌ Error en test de conexión:', testError)
                    throw new Error('Error de conexión desconocido')
                }
            }

            // Continuar con el procesamiento de la imagen
            const base64Image = imageBuffer.toString('base64')
            console.log('📊 Tamaño de la imagen en base64:', base64Image.length)

            console.log('🤖 Enviando imagen a OpenAI para análisis...')

            const response = await this.openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: this.getPrompt() },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${this.getMimeType(filename)};base64,${imageBuffer.toString('base64')}`
                                }
                            }
                        ]
                    }
                ],
            })

            console.log(`📋 Respuesta completa de OpenAI:`, response.choices[0].message.content)

            // Extraer JSON de la respuesta
            const text = response.choices[0].message.content || ''
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('No se pudo extraer JSON de la respuesta de OpenAI')
            }

            let analysisResult: DocumentAnalysisResult
            try {
                analysisResult = JSON.parse(jsonMatch[0])
                console.log('✅ Datos extraídos:', JSON.stringify(analysisResult, null, 2))
            } catch (error) {
                console.error('❌ Error al parsear JSON:', error)
                throw new Error('El formato de respuesta de OpenAI no es válido')
            }

            // Validar y limpiar los datos
            this.validateAndCleanData(analysisResult)

            return analysisResult

        } catch (error) {
            console.error('❌ Error en análisis:', error)
            if (error instanceof Error) {
                console.error('Mensaje:', error.message)
                console.error('Stack:', error.stack)
            }
            throw error
        }
    }

    private getPrompt(): string {
        return `
            Analiza detalladamente esta imagen de un documento comercial (factura o recibo) y extrae TODOS los datos que encuentres.

            INSTRUCCIONES ESPECÍFICAS:
            1. Busca y extrae TODOS los números que parezcan importes
            2. Identifica específicamente el NIF/CIF/VAT number (suele empezar con letras como PT)
            3. Busca la fecha (puede estar en varios formatos)
            4. Encuentra el nombre del establecimiento/empresa
            5. Identifica si hay número de factura o recibo
            6. Busca el desglose del IVA (normalmente 23%, 13% o 6% en Portugal)
            7. Determina si es una factura formal ("Fatura") o un recibo simple ("Recibo")

            IMPORTANTE:
            - NO INVENTES DATOS. Si no encuentras algo, déjalo vacío o null
            - Busca el NIF en TODA la imagen (suele estar arriba o abajo)
            - Los importes deben ser números (convierte strings a números)
            - Si ves "Total", "Subtotal", "IVA" - EXTRÁELOS
            - Extrae CUALQUIER texto que parezca relevante

            Responde en este formato JSON exacto:
            {
              "document_type": "invoice|expense|receipt|other",
              "confidence": 0.95,
              "extracted_data": {
                "vendor_name": "Nombre exacto del establecimiento",
                "vendor_nif": "Número fiscal encontrado",
                "invoice_number": "Número de factura si existe",
                "number": "Mismo número de factura",
                "invoice_date": "YYYY-MM-DD",
                "subtotal": 0.00,
                "vat_rate": 23,
                "vat_amount": 0.00,
                "total_amount": 0.00,
                "description": "Descripción de los productos/servicios",
                "category": "restaurante|transporte|oficina|otros"
              },
              "processing_notes": ["Notas sobre lo encontrado o no encontrado"]
            }

            RECUERDA: Extrae TODOS los números y texto que veas en la imagen. NO OMITAS INFORMACIÓN.`
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
