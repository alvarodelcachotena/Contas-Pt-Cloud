import { NextRequest, NextResponse } from 'next/server'
import { AgentExtractorGemini } from '@/server/agents/AgentExtractorGemini'
import { AgentExtractorOpenAI } from '@/server/agents/AgentExtractorOpenAI'
import crypto from 'crypto'

// Función para limpiar cache manualmente
function clearDocumentAnalysisCache() {
  if ((globalThis as any).__doc_analysis_cache) {
    (globalThis as any).__doc_analysis_cache.clear()
    console.log('🧹 Cache de análisis de documentos limpiado manualmente')
  }
  if ((globalThis as any).__doc_analysis_inflight) {
    (globalThis as any).__doc_analysis_inflight.clear()
    console.log('🧹 In-flight de análisis de documentos limpiado manualmente')
  }
}

// Tipo extendido para incluir información de empresa
interface ExtendedExtractionData {
  invoiceNumber?: string;
  vendor?: string;
  nif?: string;
  nifCountry?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  total?: number;
  netAmount?: number;
  vatAmount?: number;
  vatRate?: number;
  issueDate?: string;
  dueDate?: string;
  category?: string;
  description?: string;
  // Propiedades adicionales
  isMyCompany?: boolean;
  companyType?: string;
  confidence?: number;
}

// Configuración de límites
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB (reducido para Netlify)
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/x-icon',
  'image/vnd.microsoft.icon'
]

// Endpoint GET para ver estado del cache y limpiarlo
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  if (action === 'clear') {
    clearDocumentAnalysisCache()
    return NextResponse.json({
      success: true,
      message: 'Cache limpiado exitosamente',
      timestamp: new Date().toISOString()
    })
  }

  if (action === 'status') {
    const cacheMap = (globalThis as any).__doc_analysis_cache || new Map()
    const inflightMap = (globalThis as any).__doc_analysis_inflight || new Map()

    const cacheEntries = Array.from(cacheMap.entries()).map((entry) => {
      const [key, value] = entry as [string, any]
      return {
        key: key.substring(0, 50) + '...',
        hash: value.hash?.substring(0, 16) + '...',
        ageSeconds: Math.round((Date.now() - value.ts) / 1000),
        resultSuccess: value.result?.success || false
      }
    })

    return NextResponse.json({
      success: true,
      cache: {
        entries: cacheEntries,
        totalEntries: cacheMap.size,
        inFlightRequests: inflightMap.size
      },
      timestamp: new Date().toISOString()
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Endpoint de análisis de documentos',
    availableActions: ['status', 'clear'],
    usage: {
      status: '/api/ai-document-analysis?action=status',
      clear: '/api/ai-document-analysis?action=clear'
    }
  })
}

export async function POST(request: NextRequest) {
  console.log('📎 Nova requisição de análise de documento recebida')
  console.log('🌍 Environment:', process.env.NODE_ENV)
  console.log('🌍 Platform:', process.env.VERCEL ? 'Vercel' : process.env.NETLIFY ? 'Netlify' : 'Local')
  console.log('🔑 API Keys disponibles:')
  console.log('  - GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ Set' : '❌ Not set')
  console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set')
  console.log('  - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set')

  // Debug adicional para Netlify
  if (process.env.NETLIFY) {
    console.log('🔍 Netlify Environment Variables:')
    console.log('  - NODE_ENV:', process.env.NODE_ENV)
    console.log('  - NETLIFY:', process.env.NETLIFY)
    console.log('  - CONTEXT:', process.env.CONTEXT)
    console.log('  - BRANCH:', process.env.BRANCH)
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const base64 = formData.get('base64') as string
    const fileName = formData.get('fileName') as string
    const fileType = formData.get('fileType') as string

    if (!file && !base64) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum arquivo foi enviado',
          errorType: 'NO_FILE'
        },
        { status: 400 }
      )
    }

    // Cache de deduplicación en memoria (por proceso) - MEJORADO
    type CacheEntry = { result: any, ts: number, hash: string, fileName: string }
    const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora (más tiempo)

    // Inicializar maps globales si no existen
    if (!(globalThis as any).__doc_analysis_inflight) {
      (globalThis as any).__doc_analysis_inflight = new Map<string, Promise<any>>()
    }
    if (!(globalThis as any).__doc_analysis_cache) {
      (globalThis as any).__doc_analysis_cache = new Map<string, CacheEntry>()
    }

    const inflightMap = (globalThis as any).__doc_analysis_inflight
    const cacheMap = (globalThis as any).__doc_analysis_cache

    // Función para generar un ID único más simple
    function generateFileId(fileBuffer: Buffer, fileName: string, fileType: string): string {
      const hash = crypto.createHash('md5').update(fileBuffer).digest('hex')
      return `${hash}-${fileName}-${fileType}`
    }

    // Usar base64 si está disponible, sino usar el archivo
    let fileToProcess: any
    let fileBuffer: Buffer
    let finalFileName: string
    let finalFileType: string

    if (base64) {
      console.log('📄 Procesando archivo desde base64')
      fileBuffer = Buffer.from(base64, 'base64')
      finalFileName = fileName || 'document'
      finalFileType = fileType || 'application/octet-stream'

      // Crear objeto simulado compatible con Node.js
      fileToProcess = {
        name: finalFileName,
        type: finalFileType,
        size: fileBuffer.length,
        arrayBuffer: async () => fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
      }
    } else {
      console.log('📄 Procesando archivo desde FormData')
      const fileArrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(fileArrayBuffer)
      finalFileName = file.name
      finalFileType = file.type
      fileToProcess = file
    }

    // Verificar tipo de arquivo
    if (!ALLOWED_TYPES.includes(fileToProcess.type)) {
      console.log(`❌ Tipo de arquivo não suportado: ${fileToProcess.type}`)
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de arquivo não suportado: ${fileToProcess.type}. Tipos permitidos: PDF, PNG, JPG, JPEG, GIF, BMP, WebP, TIFF, SVG, HEIC, HEIF, AVIF, ICO`,
          errorType: 'UNSUPPORTED_FILE_TYPE'
        },
        { status: 400 }
      )
    }

    // Verificar tamanho do arquivo
    if (fileToProcess.size > MAX_FILE_SIZE) {
      console.log(`❌ Arquivo muito grande: ${fileToProcess.size} bytes`)
      return NextResponse.json(
        {
          success: false,
          error: `Arquivo muito grande (${(fileToProcess.size / 1024 / 1024).toFixed(1)}MB). Tamanho máximo: 5MB`,
          errorType: 'FILE_TOO_LARGE'
        },
        { status: 400 }
      )
    }

    console.log(`📄 Processando arquivo: ${finalFileName} (${finalFileType}, ${(fileToProcess.size / 1024).toFixed(1)}KB)`)

    // Generar ID único del archivo para deduplicación
    const fileId = generateFileId(fileBuffer, finalFileName, finalFileType)

    console.log(`🔍 File ID: ${fileId}`)
    console.log(`📊 Cache actual: ${cacheMap.size} entradas, In-flight: ${inflightMap.size} solicitudes`)

    // Limpiar cache expirado
    const now = Date.now()
    let expiredCount = 0
    for (const [k, v] of cacheMap) {
      if (now - v.ts > CACHE_TTL_MS) {
        cacheMap.delete(k)
        expiredCount++
      }
    }
    if (expiredCount > 0) {
      console.log(`🧹 Limpiadas ${expiredCount} entradas expiradas del cache`)
    }

    // Responder desde cache si existe
    const cached = cacheMap.get(fileId)
    if (cached) {
      console.log(`♻️ CACHE HIT: Devolviendo resultado cacheado para archivo ${finalFileName}`)
      console.log(`⏰ Cacheado hace: ${Math.round((now - cached.ts) / 1000)} segundos`)
      console.log(`📁 Archivo cacheado: ${cached.fileName}`)
      return NextResponse.json(cached.result)
    }

    // Compartir solicitud en vuelo si ya se está procesando el mismo archivo
    if (inflightMap.has(fileId)) {
      console.log(`⏳ IN-FLIGHT SHARING: Aguardando análisis ya en curso para archivo ${finalFileName}`)
      const sharedResult = await inflightMap.get(fileId)!
      console.log(`✅ IN-FLIGHT COMPLETADO: Resultado compartido para ${finalFileName}`)
      return NextResponse.json(sharedResult)
    }

    // Verificar se pelo menos una API está disponible
    const googleAIKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
    const openAIKey = process.env.OPENAI_API_KEY

    console.log('🔍 Verificando APIs disponibles:')
    console.log('  - Google AI Key:', googleAIKey ? `✅ ${googleAIKey.substring(0, 10)}...` : '❌ No disponible')
    console.log('  - OpenAI Key:', openAIKey ? `✅ ${openAIKey.substring(0, 10)}...` : '❌ No disponible')

    if (!googleAIKey && !openAIKey) {
      console.error('❌ No hay APIs de IA configuradas')
      console.error('❌ Variables de entorno disponibles:', Object.keys(process.env).filter(key =>
        key.includes('API') || key.includes('KEY') || key.includes('GEMINI') || key.includes('GOOGLE') || key.includes('OPENAI')
      ))

      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma API de IA está configurada no servidor',
          errorType: 'NO_AI_API',
          details: 'Verifique as variáveis de ambiente GOOGLE_AI_API_KEY, GEMINI_API_KEY ou OPENAI_API_KEY',
          availableEnvVars: Object.keys(process.env).filter(key =>
            key.includes('API') || key.includes('KEY') || key.includes('GEMINI') || key.includes('GOOGLE') || key.includes('OPENAI')
          )
        },
        { status: 500 }
      )
    }

    let extractedData = null
    let extendedData: ExtendedExtractionData | null = null
    let usedModel = ''
    let fallbackUsed = false
    let ocrText = ''

    // PRIMEIRA TENTATIVA: Google AI (Gemini) - PRINCIPAL
    const runAnalysis = async () => {
      let extractedData = null
      let extendedData: ExtendedExtractionData | null = null
      let usedModel = ''
      let fallbackUsed = false
      let ocrText = ''
      if (googleAIKey) {
        try {
          console.log('🔄 Tentando extração com Google AI (Gemini)...')
          console.log('🔑 API Key length:', googleAIKey.length)
          console.log('🔑 API Key starts with:', googleAIKey.substring(0, 10))

          const geminiExtractor = new AgentExtractorGemini(googleAIKey)

          if (finalFileType === 'application/pdf') {
            // Processar PDF
            const result = await geminiExtractor.extractFromPDF(fileBuffer, finalFileName)
            extractedData = result.data
            ocrText = 'PDF processado via Gemini Vision'
            usedModel = 'Google AI (Gemini-1.5-Pro) - PDF Vision'
            console.log('✅ Extração PDF com Google AI concluída')
          } else {
            // Processar imagem
            const result = await geminiExtractor.extractFromImage(fileBuffer, finalFileType, finalFileName)
            extractedData = result.data
            ocrText = 'Imagem processada via Gemini Vision'
            usedModel = 'Google AI (Gemini-1.5-Pro) - Image Vision'
            console.log('✅ Extração de imagem com Google AI concluída')
          }

          // Adicionar detecção de empresa própria
          if (extractedData && extractedData.nif) {
            const nif = extractedData.nif.toString().replace(/[^0-9]/g, '')
            if (nif === '517124548') {
              extendedData = {
                ...extractedData,
                isMyCompany: true,
                companyType: 'PRÓPRIA'
              }
              console.log('🏢 Empresa própria detectada (NIF: 517124548)')
            } else {
              extendedData = {
                ...extractedData,
                isMyCompany: false,
                companyType: 'EXTERNA'
              }
              console.log('🏪 Empresa externa detectada')
            }
          } else {
            extendedData = {
              ...extractedData,
              isMyCompany: false,
              companyType: 'EXTERNA'
            }
          }

        } catch (googleError: any) {
          console.error('❌ Erro na Google AI, tentando fallback para OpenAI:', googleError.message)
          console.error('❌ Google AI Error details:', {
            name: googleError.name,
            message: googleError.message,
            code: googleError.code,
            status: googleError.status
          })
          fallbackUsed = true

          // SEGUNDA TENTATIVA: OpenAI (Fallback)
          if (openAIKey) {
            try {
              console.log('🔄 Usando OpenAI como fallback...')

              const openAIExtractor = new AgentExtractorOpenAI(openAIKey)

              if (finalFileType === 'application/pdf') {
                // Para PDF, primeiro converter a OCR e depois processar
                // Por ahora, simplificamos usando solo el texto
                const result = await openAIExtractor.extract('Documento PDF - processamento limitado', finalFileName)
                extractedData = result.data
                ocrText = 'PDF processado via OpenAI (limitado)'
                usedModel = 'OpenAI (GPT-4o-Mini) - Fallback PDF'
              } else {
                // Para imagem, usar GPT-4 Vision
                const result = await openAIExtractor.extractFromImage(fileBuffer, finalFileType, finalFileName)
                extractedData = result.data
                ocrText = 'Imagem processada via OpenAI Vision'
                usedModel = 'OpenAI (GPT-4o-Mini) - Fallback Image Vision'
              }

              console.log('✅ Extração com OpenAI (fallback) concluída')

              // Adicionar detecção de empresa própria
              if (extractedData && extractedData.nif) {
                const nif = extractedData.nif.toString().replace(/[^0-9]/g, '')
                if (nif === '517124548') {
                  extendedData = {
                    ...extractedData,
                    isMyCompany: true,
                    companyType: 'PRÓPRIA'
                  }
                  console.log('🏢 Empresa própria detectada (NIF: 517124548)')
                } else {
                  extendedData = {
                    ...extractedData,
                    isMyCompany: false,
                    companyType: 'EXTERNA'
                  }
                  console.log('🏪 Empresa externa detectada')
                }
              } else {
                extendedData = {
                  ...extractedData,
                  isMyCompany: false,
                  companyType: 'EXTERNA'
                }
              }

            } catch (openAIError: any) {
              console.error('❌ Erro também na OpenAI (fallback):', openAIError)
              console.error('❌ OpenAI Error details:', {
                name: openAIError.name,
                message: openAIError.message,
                code: openAIError.code,
                status: openAIError.status
              })
              throw new Error(`Ambas as APIs falharam - Google AI: ${googleError.message}, OpenAI: ${openAIError.message}`)
            }
          } else {
            throw new Error(`Google AI falhou e OpenAI não está configurada: ${googleError.message}`)
          }
        }
      } else {
        // Se Google AI não está configurada, usar OpenAI diretamente
        if (openAIKey) {
          try {
            console.log('🔄 Google AI não configurada, usando OpenAI...')

            const openAIExtractor = new AgentExtractorOpenAI(openAIKey)

            if (finalFileType === 'application/pdf') {
              const result = await openAIExtractor.extract('Documento PDF - processamento limitado', finalFileName)
              extractedData = result.data
              ocrText = 'PDF processado via OpenAI (limitado)'
              usedModel = 'OpenAI (GPT-4o-Mini) - Única disponível PDF'
            } else {
              const result = await openAIExtractor.extractFromImage(fileBuffer, finalFileType, finalFileName)
              extractedData = result.data
              ocrText = 'Imagem processada via OpenAI Vision'
              usedModel = 'OpenAI (GPT-4o-Mini) - Única disponível Image Vision'
            }

            console.log('✅ Extração com OpenAI concluída')

            // Adicionar detecção de empresa própria
            if (extractedData && extractedData.nif) {
              const nif = extractedData.nif.toString().replace(/[^0-9]/g, '')
              if (nif === '517124548') {
                extendedData = {
                  ...extractedData,
                  isMyCompany: true,
                  companyType: 'PRÓPRIA'
                }
                console.log('🏢 Empresa própria detectada (NIF: 517124548)')
              } else {
                extendedData = {
                  ...extractedData,
                  isMyCompany: false,
                  companyType: 'EXTERNA'
                }
                console.log('🏪 Empresa externa detectada')
              }
            } else {
              extendedData = {
                ...extractedData,
                isMyCompany: false,
                companyType: 'EXTERNA'
              }
            }

          } catch (openAIError: any) {
            throw openAIError
          }
        }
      }

      if (!extendedData) {
        throw new Error('Falha na extração de dados do documento')
      }

      console.log(`✅ Análise concluída com ${usedModel}`)

      const resultPayload = {
        success: true,
        extractedData: extendedData,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          model: usedModel,
          fallbackUsed: fallbackUsed,
          primaryAPI: 'Google AI',
          ocrText: ocrText.substring(0, 200) + '...',
          processedAt: new Date().toISOString(),
          fileId: fileId
        },
        availableAPIs: {
          googleAI: !!googleAIKey,
          openAI: !!openAIKey
        }
      }

      return resultPayload
    }

    console.log(`🚀 NUEVO ANÁLISIS: Iniciando procesamiento para archivo ${finalFileName} (ID: ${fileId.substring(0, 20)}...)`)

    const inflightPromise = runAnalysis()
    inflightMap.set(fileId, inflightPromise)

    try {
      const result = await inflightPromise
      console.log(`✅ ANÁLISIS COMPLETADO: Guardando en cache para archivo ${finalFileName}`)
      cacheMap.set(fileId, { result, ts: Date.now(), hash: fileId, fileName: finalFileName })
      console.log(`💾 CACHE GUARDADO: ${cacheMap.size} entradas en cache`)
      return NextResponse.json(result)
    } catch (error) {
      console.error(`❌ ERROR EN ANÁLISIS: ${error}`)
      throw error
    } finally {
      inflightMap.delete(fileId)
      console.log(`🧹 LIMPIEZA: Removido de in-flight, quedan ${inflightMap.size} solicitudes`)
    }

  } catch (error: any) {
    console.error('❌ Erro geral na análise de documento:', error)
    console.error('❌ Stack trace:', error.stack)

    let errorMessage = 'Erro interno do servidor'
    let errorType = 'UNKNOWN_ERROR'
    let statusCode = 500
    let userFriendlyMessage = 'Ocorreu um erro ao processar o documento. Tente novamente.'

    // Log más detalles del error para debugging
    if (error.message) {
      console.error('❌ Error message:', error.message)
    }
    if (error.code) {
      console.error('❌ Error code:', error.code)
    }

    if (error.message?.includes('Ambas as APIs falharam')) {
      errorMessage = error.message
      errorType = 'ALL_APIS_FAILED'
      userFriendlyMessage = 'Todas as APIs de IA estão temporariamente indisponíveis. Tente novamente mais tarde.'
      statusCode = 503
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Timeout no processamento'
      errorType = 'TIMEOUT_ERROR'
      userFriendlyMessage = 'O processamento demorou muito. Tente com um arquivo menor.'
      statusCode = 408
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Limite de API excedido'
      errorType = 'QUOTA_EXCEEDED'
      userFriendlyMessage = 'Limite de uso da API atingido. Contacte o administrador.'
      statusCode = 429
    } else if (error.message?.includes('Failed to fetch')) {
      errorMessage = 'Erro de conexão com API'
      errorType = 'CONNECTION_ERROR'
      userFriendlyMessage = 'Erro de conexão. Verifique a configuração da API.'
      statusCode = 502
    } else if (error.message?.includes('Invalid API key')) {
      errorMessage = 'API key inválida'
      errorType = 'INVALID_API_KEY'
      userFriendlyMessage = 'Configuração de API inválida. Contacte o administrador.'
      statusCode = 401
    } else if (error.message) {
      errorMessage = error.message
      userFriendlyMessage = 'Erro no processamento do documento. Verifique o arquivo e tente novamente.'
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
        details: errorMessage,
        errorType: errorType,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        debugInfo: {
          platform: process.env.VERCEL ? 'Vercel' : process.env.NETLIFY ? 'Netlify' : 'Local',
          nodeEnv: process.env.NODE_ENV,
          hasGoogleAI: !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY),
          hasOpenAI: !!process.env.OPENAI_API_KEY
        }
      },
      { status: statusCode }
    )
  }
} 