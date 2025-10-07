import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
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
    private genAI?: GoogleGenerativeAI
    private openai?: OpenAI

    constructor() {
        const geminiApiKey = process.env.GEMINI_API_KEY
        const openaiApiKey = process.env.OPENAI_API_KEY

        console.log('🔧 Inicializando DocumentAIService con Gemini AI y OpenAI como fallback')
        console.log(`   Gemini API key configurada: ${geminiApiKey ? '✅ Sí' : '❌ No'}`)
        console.log(`   OpenAI API key configurada: ${openaiApiKey ? '✅ Sí' : '❌ No'}`)

        if (geminiApiKey) {
            console.log(`   Gemini longitud: ${geminiApiKey.length} caracteres`)
            console.log(`   Gemini empieza con: ${geminiApiKey.substring(0, 10)}...`)
            console.log(`   Gemini termina con: ...${geminiApiKey.substring(geminiApiKey.length - 10)}`)
        }

        if (!geminiApiKey && !openaiApiKey) {
            throw new Error('Ni GEMINI_API_KEY ni OPENAI_API_KEY están configuradas')
        }

        if (geminiApiKey) {
            this.genAI = new GoogleGenerativeAI(geminiApiKey)
        }

        if (openaiApiKey) {
            this.openai = new OpenAI({ apiKey: openaiApiKey })
        }
    }

    async analyzeDocument(fileBuffer: Buffer, filename: string, mimeType?: string): Promise<DocumentAnalysisResult> {
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.5-flash"
        ]

        let lastError: Error | null = null
        let successfulResult: DocumentAnalysisResult | null = null

        for (let i = 0; i < modelsToTry.length; i++) {
            const modelName = modelsToTry[i]
            try {
                console.log(`🔍 Intento ${i + 1}/${modelsToTry.length} - Analizando documento con Gemini AI: ${filename} (Modelo: ${modelName})`)
                console.log(`📊 Tamaño del buffer: ${fileBuffer.length} bytes`)

                // Convertir buffer a base64
                const base64Data = fileBuffer.toString('base64')

                // Determinar el tipo MIME - usar el proporcionado o detectar por extensión
                const detectedMimeType = mimeType || this.getMimeType(filename)
                console.log(`📄 Tipo MIME detectado: ${detectedMimeType}`)
                console.log(`📄 MIME type proporcionado: ${mimeType || 'No proporcionado'}`)
                console.log(`📄 MIME type por extensión: ${this.getMimeType(filename)}`)

                // Crear el modelo Gemini con configuración de reintentos
                if (!this.genAI) {
                    throw new Error('Gemini AI no está inicializado')
                }
                const model = this.genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.1,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 4096,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT" as any,
                            threshold: "BLOCK_NONE" as any
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH" as any,
                            threshold: "BLOCK_NONE" as any
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any,
                            threshold: "BLOCK_NONE" as any
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any,
                            threshold: "BLOCK_NONE" as any
                        }
                    ]
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

                console.log(`🤖 Enviando documento a Gemini AI con modelo ${modelName}...`)

                // Generar contenido con timeout personalizado
                const generateResult = await Promise.race([
                    model.generateContent([prompt, fileData]),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error(`Timeout después de 45 segundos con modelo ${modelName}`)), 45000)
                    )
                ])

                const response = await generateResult.response
                const text = response.text()

                console.log(`✅ Respuesta de Gemini AI recibida con modelo ${modelName}`)
                console.log(`📝 Longitud de respuesta: ${text.length} caracteres`)

                // Procesar respuesta y verificar si es válida
                const analysisResult = this.processResponse(text)

                // Verificar que el total no sea 0 (requiere reintento)
                if (analysisResult.extracted_data && (analysisResult.extracted_data.total_amount === 0 || analysisResult.extracted_data.amount === 0)) {
                    console.log(`⚠️ Total detectado como 0 en modelo ${modelName}, marcando como reintento necesario`)

                    // Si es el último modelo y el total sigue siendo 0, lanzar error especial
                    if (i === modelsToTry.length - 1) {
                        throw new Error('TOTAL_ZERO_DETECTED - El análisis detectó total=0, necesita reintento')
                    }

                    // Continuar con el siguiente modelo
                    lastError = new Error('Total cero detectado, probando siguiente modelo')
                    continue
                }

                successfulResult = analysisResult
                console.log(`🎉 Análisis exitoso con modelo ${modelName}, no se necesitan más intentos`)
                break // Salir del bucle ya que obtuvimos un resultado válido

            } catch (error) {
                console.error(`❌ Error con modelo ${modelName}:`, error instanceof Error ? error.message : 'Error desconocido')

                lastError = error instanceof Error ? error : new Error('Error desconocido')

                // Si es error 503 (overloaded), continuar con el siguiente modelo
                if (error instanceof Error && error.message.includes('503')) {
                    console.log(`⚠️ Modelo ${modelName} sobrecargado (503), probando siguiente modelo...`)
                    continue
                }

                // Si es timeout, continuar con el siguiente modelo
                if (error instanceof Error && error.message.includes('Timeout')) {
                    console.log(`⏰ Timeout con modelo ${modelName}, probando siguiente modelo...`)
                    continue
                }

                // Si es el último modelo, lanzar error
                if (i === modelsToTry.length - 1) {
                    console.error('❌ Todos los modelos de Gemini fallaron')
                    throw lastError
                }

                // Intentar con el siguiente modelo después de una breve pausa
                console.log(`🔄 Esperando 2 segundos antes de probar con el siguiente modelo...`)
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }

        // Si obtuvimos un resultado exitoso, usarlo
        if (successfulResult) {
            console.log('🎉 Retornando resultado exitoso obtenido')
            return successfulResult
        }

        // Si todos los modelos de Gemini fallaron, intentar con OpenAI como fallback
        if (this.openai) {
            console.log('🔄 Todos los modelos de Gemini fallaron, intentando con OpenAI como fallback...')
            try {
                return await this.analyzeWithOpenAI(fileBuffer, filename, mimeType)
            } catch (openaiError) {
                console.error('❌ OpenAI también falló:', openaiError)
            }
        }

        // Si todo falla, usar procesamiento offline como último recurso
        console.log('🔄 Todos los servicios de IA fallaron, usando procesamiento offline como último recurso...')
        return this.createOfflineAnalysis(filename)
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
    "vendor_nif": "Número fiscal encontrado con letra inicial si existe (ej: B72493646, NO 517124548)",
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

            // Limpiar NIF (mantener letra inicial si existe)
            if (invoiceData.vendor_nif && typeof invoiceData.vendor_nif === 'string') {
                // Si empieza con letra, mantenerla y limpiar el resto
                if (/^[A-Z]/.test(invoiceData.vendor_nif)) {
                    const letter = invoiceData.vendor_nif.charAt(0)
                    const numbers = invoiceData.vendor_nif.slice(1).replace(/\D/g, '')
                    invoiceData.vendor_nif = letter + numbers
                } else {
                    // Si no empieza con letra, solo números
                    invoiceData.vendor_nif = invoiceData.vendor_nif.replace(/\D/g, '')
                }
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

            // Limpiar NIF (mantener letra inicial si existe)
            if (expenseData.vendor_nif && typeof expenseData.vendor_nif === 'string') {
                // Si empieza con letra, mantenerla y limpiar el resto
                if (/^[A-Z]/.test(expenseData.vendor_nif)) {
                    const letter = expenseData.vendor_nif.charAt(0)
                    const numbers = expenseData.vendor_nif.slice(1).replace(/\D/g, '')
                    expenseData.vendor_nif = letter + numbers
                } else {
                    // Si no empieza con letra, solo números
                    expenseData.vendor_nif = expenseData.vendor_nif.replace(/\D/g, '')
                }
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

    private async analyzeWithOpenAI(fileBuffer: Buffer, filename: string, mimeType?: string): Promise<DocumentAnalysisResult> {
        console.log('🤖 Analizando documento con OpenAI...')

        // Convertir imagen a base64
        const base64Data = fileBuffer.toString('base64')
        const detectedMimeType = mimeType || this.getMimeType(filename)

        const prompt = `Analiza esta imagen de un documento (factura, recibo, etc.) y extrae la información en formato JSON. 

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "document_type": "invoice" o "expense" o "receipt" o "other",
  "confidence": 0.95,
  "extracted_data": {
    "vendor_name": "Nombre del proveedor",
    "vendor_nif": "NIF/CIF del proveedor",
    "invoice_number": "Número de factura",
    "invoice_date": "YYYY-MM-DD",
    "total_amount": 123.45,
    "vat_amount": 23.45,
    "vat_rate": 21,
    "description": "Descripción del gasto",
    "category": "Categoría del gasto"
  },
  "processing_notes": ["Nota 1", "Nota 2"]
}

IMPORTANTE:
- Si es una factura de restaurante, supermercado, gasolinera, etc., es un GASTO (expense)
- Si es una factura que TÚ emites a un cliente, es un INGRESO (invoice)
- Usa "expense" para la mayoría de documentos recibidos por WhatsApp
- Asegúrate de que el JSON sea válido y completo`

        try {
            if (!this.openai) {
                throw new Error('OpenAI no está inicializado')
            }
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${detectedMimeType};base64,${base64Data}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2000,
                temperature: 0.1
            })

            const content = response.choices[0]?.message?.content
            if (!content) {
                throw new Error('No se recibió respuesta de OpenAI')
            }

            console.log('📊 Respuesta de OpenAI:', content)
            return this.processResponse(content)

        } catch (error) {
            console.error('❌ Error en análisis con OpenAI:', error)
            throw error
        }
    }

    private createOfflineAnalysis(filename: string): DocumentAnalysisResult {
        console.log('🔄 Creando análisis offline para:', filename)

        // Crear análisis básico offline
        const timestamp = new Date().toISOString()
        const currentDate = timestamp.split('T')[0]

        // Generar número único basado en timestamp y filename
        const docNumber = `OFFLINE-${Date.now().toString().slice(-6)}`

        // Crear datos básicos para procesamiento offline
        const offlineData = {
            vendor_name: filename.includes('restaurant') ? 'Restaurante' :
                filename.includes('gas') ? 'Gasolinera' :
                    filename.includes('office') ? 'Oficina' :
                        'Proveedor',
            vendor_nif: '000000000',
            invoice_number: docNumber,
            number: docNumber,
            invoice_date: currentDate,
            subtotal: 0,
            vat_rate: 23,
            vat_amount: 0,
            total_amount: 0,
            description: `Documento procesado offline - ${filename}`,
            category: 'otros',
            payment_type: 'card'
        }

        const result: DocumentAnalysisResult = {
            document_type: 'expense', // Por defecto como gasto para procesamiento offline
            confidence: 0.3, // Confianza baja porque es procesamiento offline
            extracted_data: offlineData,
            processing_notes: [
                'Procesamiento offline debido a sobrecarga de servicIAs IA',
                'Todos los modelos de Gemini estuvieron indisponibles',
                'Los datos reales deben ser revisados manualmente',
                `Archivo original: ${filename}`,
                `Hora de procesamiento: ${timestamp}`
            ]
        }

        console.log('✅ Análisis offline creado:', {
            type: result.document_type,
            confidence: result.confidence,
            vendor: offlineData.vendor_name
        })

        return result
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
